'use strict';
var helpers = require('../helpers');

async function cacheOnly(request, values, options) {
  helpers.debug('Strategy: cache only [' + request.url + ']', options);
  var cache = await helpers.openCache(options)
  return cache.match(request);
}

module.exports = cacheOnly;
