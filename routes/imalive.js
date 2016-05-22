const Boom = require('boom');

module.exports = function (config, db, logger) {

  const postImAlive = {
    method: 'POST',
    path: '/imAlive',
    handler: function (request, reply) {
      if (request.raw.req.client.authorized) {

        if (!request.payload.deviceId
          || !request.payload.firmwareVersion
          || !request.payload.port) {
            return reply(Boom.badRequest('Request payload does not contain' +
              ' atleast one of the required \'deviceId\', \'firmwareVersion\'' +
              ' or \'port\' properties.'));
            }

            db.query(
              'insert into device_imalives (device_id, firmware_version, ip, port) ' +
              'values (?, ?, ?, ?)',
              [].concat(request.payload.deviceId, request.payload.firmwareVersion,
                request.info.remoteAddress, request.payload.port),
                (err, result) => {

                  if (err) {

                    const response = Boom.badImplementation(
                      'Error found while inserting device Im Alive ' +
                      'information from the database',
                      err
                    );
                    return reply(response);

                  }

                  return reply({success: true});
                }
              );

      } else {
        logger.warn('Client (%s) presented an invalid client certificate.',
          request.info.remoteAddress);
        return reply(Boom.unauthorized('No valid client certificate was presented.'));
      }
    },
  };

  return [].concat(postImAlive);
};
