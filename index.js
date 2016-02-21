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
  ca: [
    fs.readFileSync(config.devices_ca_cert),
  ],
  requestCert: true,
  rejectUnauthorized: false,
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

const validateFunction = function (token, callback) {
  let userCredentials = {}
  if (token === config.ss_token) {
    userCredentials.scope = 'ss';
    callback(null, true, userCredentials);
  } else {
    callback(null, false, userCredentials);
  }
};
server.register(require('hapi-auth-bearer-simple'));
server.auth.strategy('bearer', 'bearerAuth', {
  validateFunction: validateFunction
});

server.route(routes(config, db));

server.start((err) => {
  console.log('uLinux Update Server running at:', server.info.uri);
  if (err) throw err;
});
