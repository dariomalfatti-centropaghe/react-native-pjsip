const VERSION = "v2.7.1";
const URL = `https://github.com/datso/react-native-pjsip-builder/archive/refs/tags/${VERSION}-with-vialer.tar.gz`;
const LOCK = ".libs.lock";
const DEST = ".libs.tar.gz";
let DOWNLOAD = true;

const fs = require('fs');
const http = require('http');
const https = require('https');


async function downloadFile(url, filePath) {
    const proto = !url.charAt(4).localeCompare('s') ? https : http;
  
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      let fileInfo = null;
  
      const request = proto.get(url, response => {

        if (response.statusCode === 302) {
          reject(new Error(response.headers['location']));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }
  
        fileInfo = {
          mime: response.headers['content-type'],
          size: parseInt(response.headers['content-length'], 10),
        };
  
        response.pipe(file);
      });
  
      // The destination stream is ended by the time it's called
      file.on('finish', () => resolve(fileInfo));
  
      request.on('error', err => {
        fs.unlink(filePath, () => reject(err));
      });
  
      file.on('error', err => {
        fs.unlink(filePath, () => reject(err));
      });
  
      request.end();
    });
}


async function main() {



    if (fs.existsSync(LOCK)) {

        const CURRENT_VERSION = fs.readFileSync(LOCK);
        console.log(`Check lock file ${CURRENT_VERSION} with current version ${VERSION}`);

        if (`${CURRENT_VERSION}` === VERSION) DOWNLOAD = false;

    }

    if (DOWNLOAD) {

        console.log(`Download the file`);

        let newUrl = '';
        try {
          await downloadFile(URL, DEST);
        } catch (ex) {
          if (ex.message.startsWith('http')) {
            newUrl = ex.message;
          } else {
            return;
          }
        }


        if (newUrl) {

          try {
            await downloadFile(newUrl, DEST);
          } catch (ex) {
            console.log(ex);
            return;
          }

        }

        console.log('Download completed!');


        const decompress = require('decompress');
 
        console.log('Extract content');

        decompress(DEST, '.').then(files => {
            console.log('Extract complete!');
            console.log('Delete the downloaded file');
            fs.unlinkSync(DEST);
        });

        fs.writeFileSync(LOCK, VERSION);

    }

}


main();
