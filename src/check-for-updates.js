const path = require('path');
const fs = require('fs').promises;

async function needsUpdate(extensionDir, latestVersion) {
  // get installed version
  const installedVersionFilePath = path.join(extensionDir, 'version.txt');
  let installedVersion;
  console.log("Checking if extension is installed and it's version...");
  try {
    // check if file exists
    await fs.access(installedVersionFilePath);

    console.log('Extension is installed...');
    // read file
    installedVersion = await fs.readFile(installedVersionFilePath, 'utf-8');
  } catch (e) {
    console.error(e);
  } finally {
    if (!installedVersion) {
      console.log('Extension is not installed...');
      return true;
    }

    if (installedVersion === latestVersion) {
      console.log('Extension is up to date...');
      return false;
    } else if (installedVersion) {
      console.log('Extension is outdated');
      return true;
    }
  }
}

module.exports = needsUpdate;
