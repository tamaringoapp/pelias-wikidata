const { Writable } = require('stream');
const Sqlite3 = require('better-sqlite3');

class Sqlite3Writable extends Writable {
  constructor(options) {
    const { path, ...superOptions } = options;
    super({ ...superOptions, objectMode: true });

    this.db = new Sqlite3(path);
    this.db.exec('DROP TABLE IF EXISTS metadata;');
    this.db.exec(`CREATE TABLE metadata(
      id text PRIMARY KEY,
      metadata text
    )`);
    this.insert = this.db.prepare(
      'INSERT INTO metadata (id, metadata) VALUES (@id, @metadata)',
    );
  }

  _write(record, _, callback) {
    this.insert.run(record);
    callback();
  }

  _final(cb) {
    this.db.close();
    this.emit('close');
    cb();
  }
}

module.exports = Sqlite3Writable;
