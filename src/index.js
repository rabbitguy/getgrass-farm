const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const needsUpdate = require('./check-for-updates.js');
const updateExtension = require('./update-extension.js');
const latestVersions = require('./get-latest-version.js');
const {
  GRASS_LOGIN_URL,
  GRASS_EXTENSION_PAGE,
  HEADLESS,
  CHROME_EXECTUABLE_PATH,
  LOGIN_CHECK_FREQUENCY_HOURS,
  CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER,
} = require('./constants.js');
const login = require('./login.js');

if (process.argv.length - 2 < 3) {
  console.error('Not enough arguments...');
  process.exit(1);
}

const extensionDir = process.argv[2];
const chromeProfileDir = process.argv[3];
const credentialArgs = process.argv.slice(4);

const users = {};

for (let i = 0; i < credentialArgs.length; i += 3) {
  const proxyString = credentialArgs[i];
  const username = credentialArgs[i + 1];
  const password = credentialArgs[i + 2];

  users[(i / 3).toString()] = {
    proxyString,
    username,
    password,
  };
}

function parseProxy(str) {
  const arr = str.split(':');
  if (arr.length !== 4) {
    throw new Error('Invalid proxy string');
  }
  return arr;
}

/**
 * Checks if a directory exists.
 * @param {string} dir - The directory path.
 * @returns {Promise<boolean>} A promise that resolves to true if the directory exists, false otherwise.
 */
async function dirExists(dir) {
  try {
    await fs.access(dir);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Creates new profile directories for each user. Overwrites existing directories.
 * @returns {Promise<void>} A promise that resolves when all profile directories are created.
 */
async function forceCreateNewChromeProfileDirs() {
  for (let i = 0; i < Object.keys(users).length; i++) {
    const profileDir = path.join(chromeProfileDir, `${i}`);
    if (await dirExists(profileDir)) {
      await fs.rm(profileDir, { recursive: true });
    }
    await fs.mkdir(profileDir, { recursive: true });
  }
}

/**
 * Creates profile directories for each user if they do not exist.
 * @returns {Promise<void>} A promise that resolves when all profile directories are created.
 */
async function createChromeProfileDirsIfNotExists() {
  for (let i = 0; i < Object.keys(users).length; i++) {
    const profileDir = path.join(chromeProfileDir, `${i}`);
    if (!(await dirExists(profileDir))) {
      await fs.mkdir(profileDir, { recursive: true });
    }
  }
}

const intervalIds = [];

async function run() {
  async function getSubDirectories(directoryPath) {
    try {
      const files = await fs.readdir(directoryPath);
      const subDirectories = await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(directoryPath, file);
          const stats = await fs.stat(fullPath);
          return stats.isDirectory() ? file : null;
        })
      );
      return subDirectories.filter(Boolean);
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  const profiles = await getSubDirectories(chromeProfileDir);

  async function launchBrowser(userDataDir, index) {
    const [ip, port, _, __] = parseProxy(users[index].proxyString);

    return await puppeteer.launch({
      headless: HEADLESS,
      executablePath: CHROME_EXECTUABLE_PATH,
      userDataDir,
      args: [
        `--disable-extensions-except=${path.join(
          extensionDir,
          'grass-extension'
        )}`,
        `--load-extension=${path.join(extensionDir, 'grass-extension')}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--proxy-server=${ip}:${port}`,
      ],
    });
  }

  const browsers = [];

  async function openExtensionPage(browser, username, password) {
    const page = await browser.newPage();
    await page.authenticate({ username, password });
    await page.goto(GRASS_EXTENSION_PAGE);
  }

  async function ensureLoggedIn(browser, index) {
    if (!Boolean(browser)) {
      console.warn('browser is null at index', index);
      return;
    }
    const pages = await browser.pages();
    for (const page of pages) {
      await page.close();
    }

    const [_, __, username, password] = parseProxy(users[index].proxyString);

    const page = await browser.newPage();
    await page.authenticate({ username, password });
    await Promise.all([
      page.goto(GRASS_LOGIN_URL),
      page
        .waitForNavigation({ timeout: 90 * 1000 })
        .catch((e) => console.log(`waitForNavigation error: ${e}`)),
    ]);

    const cookies = await page.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    if (!Boolean(tokenCookie)) {
      console.log(`Profile ${index} not logged in`);
      await login(
        users[index.toString()].username,
        users[index.toString()].password,
        browser,
        {
          username,
          password,
        }
      );
    } else {
      console.log(`Profile ${index} logged in`);
    }

    await openExtensionPage(browser, username, password);

    await page?.close();
  }

  let loginCheckCounter = 0;

  async function launch(checkForUpdates) {
    if (checkForUpdates) {
      // close all browsers
      for (const browser of browsers) {
        await browser.close();
      }
      // clear browsers array
      browsers.length = 0;

      try {
        const latestVers = await latestVersions();
        if (await needsUpdate(extensionDir, latestVers.extension)) {
          await updateExtension(
            extensionDir,
            latestVers.browser,
            latestVers.extension
          );
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }

      console.log('launching browsers');
      for (let i = 0; i < profiles.length; i++) {
        browsers.push(
          await launchBrowser(path.join(chromeProfileDir, profiles[i]), i)
        );
      }
    }

    // check all are signed in
    for (let i = 0; i < browsers.length; i++) {
      await ensureLoggedIn(browsers[i], i);
    }
  }

  await launch(true);

  loginCheckCounter++;

  const intervalId = setInterval(async () => {
    console.log('refreshing. timestamp:', Date.now());
    console.log('loginCheckCounter:', loginCheckCounter);

    const checkForUpdates =
      loginCheckCounter >= CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER;

    console.log(
      'checkForUpdates:',
      `${checkForUpdates},`,
      'timestamp:',
      Date.now()
    );

    loginCheckCounter = checkForUpdates ? 0 : loginCheckCounter + 1;

    await launch(checkForUpdates);
  }, LOGIN_CHECK_FREQUENCY_HOURS * 60 * 60 * 1000);
  intervalIds.push(intervalId);
}

async function main() {
  await createChromeProfileDirsIfNotExists();

  function clearIntervals() {
    console.log('clearing intervals');
    for (const intervalId of intervalIds) {
      clearInterval(intervalId);
    }
    intervalIds.length = 0;
  }

  /**
   * Runs the main function, retrying up to 5 times if it fails.
   * @returns {Promise<boolean>} A promise that resolves to true if the function failed to launch, false otherwise.
   */
  async function aux() {
    let attempts = 0;
    while (attempts < 5) {
      try {
        await run();
        console.log('run() finished successfully');
        break;
      } catch (error) {
        clearIntervals();
        attempts++;
        console.error(`Error occurred: ${error}`);
      }
    }
    return attempts >= 5;
  }

  if (await aux()) {
    console.log(
      'Failed to launch. Attempting to clear chrome profile directories.'
    );
    await forceCreateNewChromeProfileDirs();
    if (await aux()) {
      console.log('Failed to launch. Exiting...');
      process.exit(1);
    }
  }
}

main();
