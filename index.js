'use strict';

const Hapi = require('hapi');
const config = require(__dirname + '/config.js');
const fs = require('fs');

const options = {
  key: fs.readFileSync(config.key_path),
  cert: fs.readFileSync(config.cert_path),
};

const server = new Hapi.Server();
server.connection({
  port: config.port,
  tls: options,
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
   reply('Hello, world!');
  }
});

server.start((err) => {
  console.log('uLinux Update Server running at:', server.info.uri);
  if (err) throw err;
});
