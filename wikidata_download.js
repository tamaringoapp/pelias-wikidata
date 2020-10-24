'use strict';

const _ = require('lodash');
const child_process = require('child_process');
const fs = require('fs');
const config = require('pelias-config').generate();

if (require.main === module) {
  download(err => {
    if (err) {
      console.error('Failed to download data', err);
      process.exit(1);
    }
    console.info('All done!');
  });
}

function download(callback) {
  const source = _.get(
    config,
    'imports.wikidata.download.sourceURL',
    'https://dumps.wikimedia.your.org/other/wikibase/wikidatawiki/latest-all.json.gz'
  );

  console.info(`Downloading source: ${source}`);

  fs.mkdir(config.imports.wikidata.datapath, { recursive: true }, err => {
    if (err) {
      console.error(
        `error making directory ${config.imports.wikidata.datapath}`,
        err,
      );
      return callback(err);
    }

    downloadSource(config, source, callback);
  });
}

function downloadSource(config, sourceUrl, callback) {
  const targetDir = config.imports.wikidata.datapath;

  console.debug(`downloading ${sourceUrl} to ${targetDir}`);
  child_process.exec(
    `cd ${targetDir} && { curl -L -X GET --silent --fail --remote-name ${sourceUrl}; }`,
    callback,
  );
}

module.exports = download;
