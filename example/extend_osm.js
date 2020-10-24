const through = require('through2');
const peliasLogger = require('pelias-logger').get('openstreetmap');
const Sqlite3 = require('better-sqlite3');
const _ = require('lodash');

const config = require('pelias-config').generate();

module.exports = function () {
  let db = new Sqlite3(`${config.imports.wikidata.datapath}/metadata.sqlite`);
  const stmt = db.prepare('SELECT id, metadata FROM metadata WHERE id = ?');

  return through.obj((doc, enc, next) => {
    try {
      const tags = doc.getMeta('tags');
      const wikiId = tags && tags['wikidata'];

      if (!wikiId) {
        return next(null, doc);
      }

      const result = stmt.get(wikiId);
      if (!result) {
        return next(null, doc);
      }

      const metadata = JSON.parse(result.metadata);

      if (metadata.labels) {
        _.forEach(metadata.labels, (val, lang) => {
          doc.setName(lang, val);
        });
      }

      if (metadata.aliases) {
        _.forEach(metadata.aliases, (aliases, lang) => {
          aliases.forEach(alias => doc.setNameAlias(lang, alias));
        });
      }

      if (metadata.addendum) {
        doc.setAddendum('custom', metadata.addendum);
      }
    } catch (e) {
      peliasLogger.error('extend_osm error');
      peliasLogger.error(e.stack);
      peliasLogger.error(JSON.stringify(doc, null, 2));
    }

    return next(null, doc);
  });
};
