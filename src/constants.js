const GRASS_LOGIN_URL = 'https://app.getgrass.io/';
const GRASS_EXTENSION_PAGE =
  'chrome-extension://ilehaonighjijnmpnagapkhpcdbhclfg/index.html';
const EXTENSIONID = 'ilehaonighjijnmpnagapkhpcdbhclfg';
const EXTENSION_URL = `https://chromewebstore.google.com/detail/grass-extension/${EXTENSIONID}?hl=en`;
const HEADLESS = false;
const LOGIN_CHECK_FREQUENCY_HOURS = 6;
const EXTENSION_REFRESH_FREQUENCY_MINUTES = 2;
const EXTENSION_REFRESH_RAND_RANGE_SECONDS = 60;
const CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER = 8;
const CHROME_EXECUTABLE_PATH = '/usr/bin/google-chrome-stable';

module.exports = {
  GRASS_LOGIN_URL,
  GRASS_EXTENSION_PAGE,
  EXTENSIONID,
  EXTENSION_URL,
  HEADLESS,
  LOGIN_CHECK_FREQUENCY_HOURS,
  EXTENSION_REFRESH_FREQUENCY_MINUTES,
  EXTENSION_REFRESH_RAND_RANGE_SECONDS,
  CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER,
  CHROME_EXECUTABLE_PATH,
};
