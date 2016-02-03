const imagesRoutes = require('./images');

module.exports = function (config, db) {
  return [].concat(imagesRoutes(config, db));
};
