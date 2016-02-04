const Boom = require('boom');

module.exports = function (config, db) {

  const getImage = {
    method: 'GET',
    path: '/images/{id}',
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
    method: 'GET',
    path: '/images/latest',
    handler: function (request, reply) {
      db.query(
        'select * from device_images order by timestamp desc',
        [request.params.id],
        (err, result) => {

          if (err) {

            const response = Boom.badImplementation(
              'Error found while fetching latest image metadata ' +
              'information from the database',
              err
            );
            reply(response);

          } else {

            reply(result[0]);
          }
        }
      );
    },
  }

  return [].concat(getImage, getLatestImageMetadata);
};
