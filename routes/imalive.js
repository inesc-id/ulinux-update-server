const Boom = require('boom');

module.exports = function (config, db) {

  const postImAlive = {
    method: 'POST',
    path: '/imAlive',
    handler: function (request, reply) {
      db.query(
        'insert into device_imalives (device_id, firmware_version) values (?, ?)',
        [request.payload.deviceId, request.payload.firmwareVersion],
        (err, result) => {

          if (err) {

            const response = Boom.badImplementation(
              'Error found while inserting device Im Alive ' +
              'information from the database',
              err
            );
            return reply(response);

          }

          return reply();
        }
      );
    },
  };

  return [].concat(postImAlive);
};
