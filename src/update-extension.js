const path = require('path');
const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const axios = require('axios');
const { EXTENSIONID } = require('./constants.js');

const writeFileAsync = util.promisify(fs.writeFile);
const pipeline = util.promisify(require('stream').pipeline);

const CRX_DOWNLOAD_URL = (PRODVERSION) =>
  `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${PRODVERSION}&acceptformat=crx2,crx3&x=id%3D${EXTENSIONID}%26uc`;

async function downloadFile(url, destinationPath) {
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
  });

  await pipeline(response.data, fs.createWriteStream(destinationPath));

  return destinationPath;
}

async function updateExtension(extensionDir, browserVersion, latestVersion) {
  try {
    const downloadUrl = CRX_DOWNLOAD_URL(browserVersion);
    const crxFilePath = path.join(extensionDir, 'grass-extension.crx');

    console.log('starting download');
    // Download the extension file
    await downloadFile(downloadUrl, crxFilePath);
    console.log('Downloaded extension...');

    // Unzip the extension
    exec(
      `unzip ${crxFilePath} -d ${path.join(extensionDir, 'grass-extension')}`,
      (error, stdout, stderr) => {
        if (error) {
          console.warn(`Error unzipping extension: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Unzip stderr: ${stderr}`);
          return;
        }
        console.log(`Unzip stdout: ${stdout}`);
        console.log('Unzipped extension...');
      }
    );

    // Update version in version.txt
    const installedVersionFilePath = path.join(extensionDir, 'version.txt');
    // if file doesn't exist create it
    if (!fs.existsSync(installedVersionFilePath)) {
      fs.writeFileSync(installedVersionFilePath, '');
    }
    await writeFileAsync(installedVersionFilePath, latestVersion);
    console.log('Extension updated successfully...');
  } catch (error) {
    console.error(`Error updating extension: ${error.message}`);
    console.log('Error updating extension...');
  }
}

module.exports = updateExtension;
