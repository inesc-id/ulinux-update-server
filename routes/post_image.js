'use strict';

const Boom = require('boom');
const Path = require('path');
const fs = require('fs');

const Queue = require('bee-queue');

module.exports = function (config, db, logger) {

const notifyClientsQ = new Queue('clients');
const notifyClientQ = new Queue('client');

notifyClientsQ.process(function (job, done) {
  let now = new Date();
  let tenMinutesAgo = new Date(now.getTime() - config.client_imalive_interval * 2);

  db.query(
    'select * from device_imalives where timestamp >= ? and timestamp <= ? group by ip, port',
    [tenMinutesAgo, now],
    (err, result) => {
      if (err) return done(err);
      else {
        logger.debug(`Sending update notifications to ${result.length} devices`);

        result.forEach(function (row) {
          notifyClientQ.createJob({
            ip: row['ip'],
            port: row['port'],
            id: job.data.id,
            timestamp: job.data.timestamp
          }).save();
        });

        return done();
      }
    }
  );
});

notifyClientQ.process(function (job, done) {
  let url = `https://${job.data.ip}:${job.data.port}/newUpdate`;
  logger.debug(`Sending update notification to ${url}: {id: ${job.data.id}, timestamp: ${job.data.timestamp}}`);
  // TODO: actually call the endpoints
  return done();
});

return {
  method: 'POST',
  path: '/updates/',
  handler: (request, reply) => {
    const data = request.payload;

    if (data.file) {
      logger.info('Receiving new update image from signing server (%s).',
        request.info.remoteAddress);

      const name = Date.now() + '_' + data.file.hapi.filename;
      const path = Path.join(__dirname, '..', 'public/device_images/', name);
      const file = fs.createWriteStream(path);

      file.on('error', function (err) {
        logger.error('Something wrong happened ' +
          'while writing the image file disk', err);
        return reply(Boom.badImplementation('Something wrong happened ' +
          'while writing the image file disk'));
      });

      data.file.pipe(file);

      data.file.on('end', function (err) {
        db.query(
          'insert into device_images (filename) values (?)',
          [name],
          (err, res) => {
            if (err) {
              logger.error('Something wrong while inserting device image ' +
                'into the database.', err);
              return reply(Boom.badImplementation(
                'Error found while inserting device image into the database'));
            }

            db.query(
              'select * from device_images where id = ?',
              [res.insertId],
              (err, result) => {
                if (err) {
                  logger.error('Got error when retrieving new device image ' +
                  ' from database right after inserting it: ', err);
                  return;
                } else {
                  notifyClientsQ.createJob({
                    id: result[0]['id'],
                    timestamp: result[0]['timestamp']
                  }).save();
                }
              }
            );

            return reply({ success: true });
          })
      });
    } else {
      logger.warn('Required file missing from request.');
      return reply(Boom.badRequest('Required file missing from request.'));
    }
  },
  config: {
    auth: {
      strategy: 'bearer',
      scope: 'ss',
    },
    payload: {
      output: 'stream',
      maxBytes: config.image_maxsize,
    },
  },
};
}
