const puppeteer = require('puppeteer');
const login = require('./login.js');
const {
  GRASS_EXTENSION_PAGE,
  HEADLESS,
  CHROME_EXECUTABLE_PATH,
} = require('./constants.js');

(async () => {
  const dir = process.argv[2];
  const extensionDir = process.argv[3];
  const username = process.argv[4];
  const password = process.argv[5];

  try {
    var browser = await puppeteer.launch({
      headless: HEADLESS,
      executablePath: CHROME_EXECUTABLE_PATH,
      userDataDir: dir,
      args: [
        `--disable-extensions-except=${extensionDir}`,
        `--load-extension=${extensionDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    await login(username, password, browser);
    await (await browser.newPage()).goto(GRASS_EXTENSION_PAGE);
  } catch (e) {
    console.error(e);
    console.log('Failed to log in...');
  } finally {
    await browser.close();
  }
})();
