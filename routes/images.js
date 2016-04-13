'use strict';

const Boom = require('boom');
const Path = require('path');
const fs = require('fs');

module.exports = function (config, db, logger) {

  const getImage = {
    method: 'GET',
    path: '/updates/{id}',
    handler: (request, reply) => {
      // This is a devices-only endpoint
      if (request.raw.req.client.authorized) {
        logger.info('Client (%s) requested update with id: %s. ' +
          'Looking for it in the database.',
          request.info.remoteAddress,
          request.params.id);
        db.query(
          'select * from device_images where id = ?',
          [request.params.id],
          (err, result) => {

            if (err) {
              logger.error('Error found while fetching device image ' +
                'information from the database',
                err);
              const response = Boom.badImplementation(
                'Error found while fetching device image ' +
                'information from the database',
                err
              );
              return reply(response);

            }

            if (result.length != 0) {
              logger.info('Found image, sending it to client (%s).',
                request.info.remoteAddress);
              return reply.file('device_images/' + result[0].filename);
            }
            else {
              logger.warn('Device image with given id (%s) not found. Client (%s).',
                request.params.id,
                request.info.remoteAddress);
              return reply(Boom.notFound('Device image with given id not found.'));
            }
          }
        );
      } else {
        logger.warn('Client (%s) presented an invalid client certificate.',
          request.info.remoteAddress);
        return reply(Boom.unauthorized('No valid client certificate was presented.'));
      }
    },
  };

  const getLatestImageMetadata = {
    method: 'POST',
    path: '/newUpdate',
    handler: (request, reply) => {
      // This is a devices-only endpoint
      if (request.raw.req.client.authorized) {

        logger.info('Device (%s) asking for latest update by timestamp.',
          request.info.remoteAddress);

        if (!request.payload.timestamp) {
          logger.info('Request payload does not contain' +
            ' required \'timestamp\' property. Device (%s).',
            request.info.remoteAddress);
          return reply(Boom.badRequest('Request payload does not contain' +
            ' required \'timestamp\' property.'));
        }

        db.query(
          'select * from device_images where timestamp > FROM_UNIXTIME(?) order by timestamp desc',
          [request.payload.timestamp],
          (err, result) => {

            if (err) {
              logger.error('Error found while fetching image metadata ' +
                'information from the database',
                err);
              const response = Boom.badImplementation(
                'Error found while fetching image metadata ' +
                'information from the database',
                err
              );
              return reply(response);
            }

            if (result.length > 0) {
              logger.info('Sending latest image metadata to client (%s).',
                request.info.remoteAddress);
              return reply({
                updateId: result[0].id,
                message: true,
              });
            }
            logger.info('Not sending any image metadata to client (%s), ' +
              'no image was created after given timestamp (%s).',
              request.info.remoteAddress, request.payload.timestamp);
            return reply({ message: false });
          }
        );
      } else {
        logger.warn('Client (%s) presented an invalid client certificate.',
          request.info.remoteAddress);
        return reply(Boom.unauthorized('No valid client certificate was presented.'));
      }
    },
  };

  const postImage = {
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

  return [].concat(getImage, getLatestImageMetadata, postImage);
};
