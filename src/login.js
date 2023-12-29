const { GRASS_LOGIN_URL, GRASS_EXTENSION_PAGE } = require('./constants.js');
async function login(username, password, browser, proxyAuth) {
  // open login page
  const page = await browser.newPage();
  if (proxyAuth) {
    await page.authenticate({
      username: proxyAuth.username,
      password: proxyAuth.password,
    });
  }

  await Promise.all([
    page.goto(GRASS_LOGIN_URL),
    page
      .waitForNavigation({ timeout: 90 * 1000 })
      .catch((e) => console.log(`waitForNavigation error: ${e}`)),
  ]);

  const cookies = await page.cookies();

  const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

  // check if auth token exists
  if (tokenCookie) {
    console.log(`${username} already logged in...`);
  } else {
    console.log('Not logged in, logging in...');
    // sign in
    const usernameSelector = '#field-\\:r0\\:';
    const passwordSelector = '#field-\\:r1\\:';

    await page.waitForSelector(usernameSelector);
    await page.waitForSelector(passwordSelector);

    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);

    const buttonSelector =
      'body > div.css-t1k2od > div > div.css-0 > div > div.css-10heyz4 > div > form > button';
    await page.waitForSelector(buttonSelector);

    await Promise.all([
      page.click(buttonSelector),
      page
        .waitForNavigation({ timeout: 90 * 1000 })
        .catch((e) => console.log(`waitForNavigation error: ${e}`)),
    ]);

    if (
      (await page.cookies()).find((cookie) => cookie.name === 'token') ===
      undefined
    ) {
      console.log('Failed to log in...');
    } else {
      console.log(`${username} logged in successfully...`);
    }
  }

  await page.close();
}

module.exports = login;
