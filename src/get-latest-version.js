const puppeteer = require('puppeteer');
const {
  EXTENSION_URL,
  HEADLESS,
  CHROME_EXECUTABLE_PATH,
} = require('./constants.js');

async function latestVersions() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    // check latest extension version
    const page = await browser.newPage();
    await page.goto(EXTENSION_URL);

    const latestVersionSelector =
      '#yDmH0d > c-wiz > div > div > main > div > section:nth-child(5) > div:nth-child(2) > div > ul > li.Qt4bne.HV0oG > div.pDlpAd';
    await page.waitForSelector(latestVersionSelector, { timeout: 90 * 1000 });

    var latestVersion = await page.$eval(
      latestVersionSelector,
      (el) => el.innerText
    );

    var browserVersion = (await page.browser().version()).split('/')[1];
    await browser.close();
  } catch (error) {
    console.log(error);
  } finally {
    await browser?.close();
    return {
      browser: browserVersion,
      extension: latestVersion,
    };
  }
}

module.exports = latestVersions;
