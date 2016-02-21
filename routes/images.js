'use strict';

const Boom = require('boom');
const Path = require('path');
const fs = require('fs');

module.exports = function (config, db) {

  const getImage = {
    method: 'GET',
    path: '/updates/{id}',
    handler: (request, reply) => {
      // This is a devices-only endpoint
      if (request.raw.req.client.authorized) {
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
              return reply(response);

            }

            if (result.length != 0)
              return reply.file('device_images/' + result[0].filename);
            else
              return reply(Boom.notFound('Device image with given id not found.'));
          }
        );
      } else {
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

        if (!request.payload.timestamp) {
          return reply(Boom.badRequest('Request payload does not contain' +
            ' required \'timestamp\' property.'));
        }

        db.query(
          'select * from device_images where timestamp > FROM_UNIXTIME(?) order by timestamp desc',
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

            if (result.length > 0) {
              return reply({
                updateId: result[0].id,
                message: true,
              });
            }

            return reply({ message: false });
          }
        );
      } else {
      return reply(Boom.unauthorized('No valid client certificate was presented.'));
      }
    },
  };

  const postImage = {
    method: 'POST',
    path: '/updates/',
    handler: (request, reply) => {
      var data = request.payload;
      if (data.file) {
        var name = Date.now() + '_' + data.file.hapi.filename;
        var path = Path.join(__dirname, '..', 'public/device_images/', name);
        var file = fs.createWriteStream(path);

        file.on('error', function (err) {
          console.error(err);
          return reply(Boom.badImplementation('Something wrong happened ' +
            'while writing the image file disk'));
        });

        data.file.pipe(file);

        data.file.on('end', function (err) {
          db.query(
            'insert into device_images (filename) values (?)',
            [name],
            (err, res) => {
              if (err) return reply(Boom.badImplementation(
                'Error found while inserting device image into the database'));
              return reply({ success: true });
            })

        });
      } else {
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
