'use strict';
var helpers = require('../helpers');

async function cacheFirst(request, values, options) {
  helpers.debug('Strategy: cache first [' + request.url + ']', options);
  var cache = await helpers.openCache(options);
  var response = await cache.match(request);

  if (response) {
    return response;
  }

  return helpers.fetchAndCache(request, options);
}

module.exports = cacheFirst;