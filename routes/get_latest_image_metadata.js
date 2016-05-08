'use strict';

const Boom = require('boom');

module.exports = function (config, db, logger) {

return {
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

}
