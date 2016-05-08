'use strict';

module.exports = function (config, db, logger) {

  return [].concat(
    require('./get_image')(config, db, logger),
    require('./get_latest_image_metadata')(config, db, logger),
    require('./post_image')(config, db, logger)
  );
};
