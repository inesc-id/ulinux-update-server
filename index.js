'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const config = require(__dirname + '/config.js');
const fs = require('fs');
const Path = require('path');

const routes = require('./routes');

const mysql = require('mysql');
const db  = mysql.createPool({
  connectionLimit : 10,
  host            : config.db_host,
  database        : config.db_database,
  user            : config.db_user,
  password        : config.db_pass,
});

const options = {
  key: fs.readFileSync(config.key_path),
  cert: fs.readFileSync(config.cert_path),
};

const server = new Hapi.Server();
server.connection({
  port: config.port,
  tls: options,
  routes: {
    files: {
      relativeTo: Path.join(__dirname, 'public'),
    },
  },
});

server.register(Inert, () => {});

server.route(routes(config, db));

server.start((err) => {
  console.log('uLinux Update Server running at:', server.info.uri);
  if (err) throw err;
});
