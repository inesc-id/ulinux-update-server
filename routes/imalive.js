const Boom = require('boom');

module.exports = function (config, db) {

  const postImAlive = {
    method: 'POST',
    path: '/imAlive',
    handler: function (request, reply) {

      if (!request.payload.deviceId
        || !request.payload.firmwareVersion
        || !requestpayload.port) {
          return reply(Boom.badRequest('Request payload does not contain' +
            ' atleast one of the required \'deviceId\', \'firmwareVersion\'' +
            ' or \'port\' properties.'));
      }

      db.query(
        'insert into device_imalives (device_id, firmware_version, ip, port) ' +
        'values (?, ?, ?, ?)',
        [].concat(request.payload.deviceId, request.payload.firmwareVersion,
           request.info.address, request.payload.port),
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
    },
  };

  return [].concat(postImAlive);
};
