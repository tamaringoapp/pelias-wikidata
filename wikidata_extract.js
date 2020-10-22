const _ = require('lodash');
const split2 = require('split2');
const through = require('through2');
const md5 = require('md5');
const zlib = require('zlib');
const Sqlite3Writable = require('./streams/sqlite');
const prettyMs = require('pretty-ms');
const prettyBytes = require('pretty-bytes');
const fs = require('fs');
const config = require('pelias-config').generate();

const dataPath = config.imports.wikidata.datapath;
const filename = config.imports.wikidata.import.filename;
const allowed_langs = config.imports.wikidata.langs;

const shoudKeep = record => {
  const { claims } = record;

  return (
    claims &&
    (!_.isEmpty(claims.P6766) || // has WOF id
      !_.isEmpty(claims.P402) || // has OSM relation id
      !_.isEmpty(claims.P625)) // has coordinates
  );
};

const getImage = record => {
  const match = _.find(record.claims.P18, c =>
    _.get(c, 'mainsnak.datavalue.value'),
  );
  if (match) {
    const image = _.get(match, 'mainsnak.datavalue.value');
    const path = image.replace(/ /g, '_');
    const hash = md5(path);
    const one = hash.substr(0, 1);
    const two = hash.substr(0, 2);
    const encodedPath = encodeURI(path);
    return `https://upload.wikimedia.org/wikipedia/commons/${one}/${two}/${encodedPath}`;
  }
};

const getAddendum = record => {
  const addendum = _.pickBy(
    {
      image: getImage(record),
    },
    _.negate(_.isEmpty),
  );

  if (!_.isEmpty(addendum)) {
    return addendum;
  }
};

const getLabels = record => {
  const labels = _.reduce(
    record.labels,
    (acc, value) => {
      if (allowed_langs.includes(value.language)) {
        acc[value.language] = value.value;
      }

      return acc;
    },
    {},
  );
  if (!_.isEmpty(labels)) {
    return labels;
  }
};

const getMetadata = record => {
  const metadata = _.pickBy(
    {
      labels: getLabels(record),
      addendum: getAddendum(record),
    },
    _.negate(_.isEmpty),
  );

  if (!_.isEmpty(metadata)) {
    return metadata;
  }
};

fs.mkdirSync(dataPath, { recursive: true });

const filePath = `${dataPath}/${filename}`;
const fileSize = fs.statSync(filePath)['size'];
console.log(filePath, `${dataPath}/metadata.sqlite`);
const sqliteDb = new Sqlite3Writable({ path: `${dataPath}/metadata.sqlite` });

console.log(`Processing ${filename} (${prettyBytes(fileSize)})`);

let downloaded = 0;
let count = 0;
let inserted = 0;
const start = Date.now();

fs.createReadStream(filePath)
  .on('data', function (chunk) {
    downloaded += chunk.length;
  })
  .pipe(zlib.createGunzip())
  .pipe(split2(/\,?\r?\n/))
  .pipe(
    through.obj(function (line, enc, cb) {
      if (!line || line === '[' || line === ']') {
        cb();
      } else {
        try {
          count++;
          if (count % 10000 === 0) {
            const elapsed = Date.now() - start;
            const ETA = (fileSize - downloaded) / (downloaded / elapsed);
            console.log(
              `${prettyBytes(downloaded)} of ${prettyBytes(
                fileSize,
              )} processed (${_.round((downloaded / fileSize) * 100, 2)}%) - ` +
                `${count} processed - ` +
                `${inserted} inserted - ` +
                `Elapsed: ${prettyMs(elapsed)} - ` +
                `ETA: ${prettyMs(ETA)}`,
            );
          }
          const obj = JSON.parse(line);
          cb(null, obj);
        } catch (error) {
          console.log('Could not parse json, skipping');
          console.log(error);
          console.log(line);
          cb();
        }
      }
    }),
  )
  .pipe(
    through.obj(function (record, enc, cb) {
      try {
        if (shoudKeep(record)) {
          const metadata = getMetadata(record);
          if (metadata) {
            inserted++;
            cb(null, {
              id: record.id,
              metadata: JSON.stringify(metadata),
            });
          } else {
            cb();
          }
        } else {
          cb();
        }
      } catch (error) {
        console.log('Error when building db record, skipping: ');
        console.log(error);
        cb();
      }
    }),
  )
  .pipe(sqliteDb)
  .on('error', error => {
    console.log(error);
    process.exit(1);
  })
  .on('end', () => {
    const time = Date.now() - start;
    console.log(`Done in ${prettyMs(time)}`);
  });
// });
