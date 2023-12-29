const GRASS_LOGIN_URL = 'https://app.getgrass.io/';
const GRASS_EXTENSION_PAGE =
  'chrome-extension://ilehaonighjijnmpnagapkhpcdbhclfg/index.html';
const EXTENSIONID = 'ilehaonighjijnmpnagapkhpcdbhclfg';
const EXTENSION_URL = `https://chromewebstore.google.com/detail/grass-extension/${EXTENSIONID}?hl=en`;
const HEADLESS = false;
const LOGIN_CHECK_FREQUENCY_HOURS = 6;
const CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER = 4;
const CHROME_EXECTUABLE_PATH = '/usr/bin/google-chrome-stable';

module.exports = {
  GRASS_LOGIN_URL,
  GRASS_EXTENSION_PAGE,
  EXTENSIONID,
  EXTENSION_URL,
  HEADLESS,
  LOGIN_CHECK_FREQUENCY_HOURS,
  CHECK_FOR_UPDATES_LOGIN_FREQUENCY_MULTIPLIER,
  CHROME_EXECTUABLE_PATH,
};
