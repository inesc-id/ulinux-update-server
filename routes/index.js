const imagesRoutes = require('./images');
const imAliveRoutes = require('./imalive');

module.exports = function (config, db, logger) {
  return [].concat(imagesRoutes(config, db, logger),
    imAliveRoutes(config, db, logger));
};
