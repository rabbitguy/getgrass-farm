const latestVersions = require('./get-latest-version.js');
const updateExtension = require('./update-extension.js');
const { EXTENSION_URL, HEADLESS } = require('./constants.js');

(async () => {
  const extensionDir = process.argv[2];

  console.log('getting latest versions');
  const { browser: browserVersion, extension: latestVersion } =
    await latestVersions();

  console.log('Latest extension version:', latestVersion);

  console.log('Updating extension...');
  await updateExtension(extensionDir, browserVersion, latestVersion);
  return;
})();
