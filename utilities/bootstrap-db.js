'use strict';
const Path = require('path');
const config = require(Path.join(__dirname, '..', 'config.js'));
const fs = require('fs');

const mysql = require('mysql');
const db  = mysql.createConnection({
  connectionLimit    : 10,
  host               : config.db_host,
  database           : config.db_database,
  user               : config.db_user,
  password           : config.db_pass,
  multipleStatements : true,
});

const schemaPath = Path.join(__dirname, '..', 'db', 'schema.sql');
let schema;
try {
  schema = fs.readFileSync(schemaPath, 'utf8');
} catch (e) {
  console.error('Got error reading database schema from disk.', e);
  process.exit(-1);
}

db.query(schema, (err, res) => {
  if (err) {
    console.error('Got error while creating schema in the database.', err);
    return;
  }

  console.log('Schema created successfully!');
  db.end();
});
