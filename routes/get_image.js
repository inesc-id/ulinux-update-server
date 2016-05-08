'use strict';

const Boom = require('boom');
const fs = require('fs');

module.exports = function (config, db, logger) {
  return {
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
}
