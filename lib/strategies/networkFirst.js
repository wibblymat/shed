'use strict';
var globalOptions = require('../options');
var helpers = require('../helpers');

async function networkFirst(request, values, options) {
  options = options || {};
  var successResponses = options.successResponses || globalOptions.successResponses;
  helpers.debug(`Strategy: network first [${request.url}]`, options);
  var cache = await helpers.openCache(options);
  var response;

  try {
    response = await helpers.fetchAndCache(request, options);
  } catch(error) {
    helpers.debug(`Network error, fallback to cache [${request.url}]`, options);
    return cache.match(request);
  }

  if (successResponses.test(response.status)) {
    return response;
  }

  helpers.debug(`Response was an HTTP error [${request.url}]`, options);

  var cacheResponse = await cache.match(request);

  if (cacheResponse) {
    helpers.debug('Resolving with cached response instead', options);
    return cacheResponse;
  } else {
    // If we didn't have anything in the cache, it's better to return the
    // error page than to return nothing
    helpers.debug('No cached result, resolving with HTTP error response from network', options);
    return response;
  }
}

module.exports = networkFirst;