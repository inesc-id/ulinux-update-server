const Boom = require('boom');

module.exports = function (config, db) {

  const getImage = {
    method: 'GET',
    path: '/updates/{id}',
    handler: function (request, reply) {
      db.query(
        'select * from device_images where id = ?',
        [request.params.id],
        (err, result) => {

          if (err) {

            const response = Boom.badImplementation(
              'Error found while fetching device image ' +
              'information from the database',
              err
            );
            reply(response);

          } else {

            reply.file('device_images/' + result.filename);
          }
        }
      );
    },
  };

  const getLatestImageMetadata = {
    method: 'POST',
    path: '/newUpdate',
    handler: function (request, reply) {

      if (!request.payload.timestamp) {
        return reply(Boom.badRequest('Request payload does not contain' +
          ' required \'timestamp\' property.'));
      }

      db.query(
        'select * from device_images where timestamp > ? order by timestamp desc',
        [request.payload.timestamp],
        (err, result) => {

          if (err) {
            const response = Boom.badImplementation(
              'Error found while fetching image metadata ' +
              'information from the database',
              err
            );
            return reply(response);
          }

          if (result.length > 0)
            return reply({
              updateId: result[0].id,
              message: true,
            });
          }

          return reply({ message: false });

      );
    },
  }

  return [].concat(getImage, getLatestImageMetadata);
};
