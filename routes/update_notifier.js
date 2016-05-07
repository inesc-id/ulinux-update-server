const request = require('request');

module.exports = function (config, db, logger) {
  return () => {
    setImmediate(() => {
      console.log("Log from attaching function");
    });
  }
}
