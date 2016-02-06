const imagesRoutes = require('./images');
const imAliveRoutes = require('./imalive');

module.exports = function (config, db) {
  return [].concat(imagesRoutes(config, db), imAliveRoutes(config, db));
};
