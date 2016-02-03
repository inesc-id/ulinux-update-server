'use strict';

const Hapi = require('hapi');
const config = require(__dirname + '/config.js');
const fs = require('fs');

const routes = require('./routes');

const options = {
  key: fs.readFileSync(config.key_path),
  cert: fs.readFileSync(config.cert_path),
};

const server = new Hapi.Server();
server.connection({
  port: config.port,
  tls: options,
});

server.route(routes(config));

server.start((err) => {
  console.log('uLinux Update Server running at:', server.info.uri);
  if (err) throw err;
});
