'use strict';

var globalOptions = require('./options');
var savedState = require('./savedState');

function debug(message, options={}) {
  var flag = options.debug || globalOptions.debug;  
  if (flag) {
    console.log(`[shed] ${message}`);
  }
}

async function openCache(options={}) {
  var name = options.cacheName || globalOptions.cacheName || await savedState.get('lastActivatedCache');

  debug(`Opening cache "${name}"`);
  return caches.open(name);
}

async function fetchAndCache(request, options) {
  options = options || {};
  var successResponses = options.successResponses || globalOptions.successResponses;

  var response = await fetch(request.clone());

  // Only cache successful responses
  if (successResponses.test(response.status)) {
    openCache(options).then(function(cache) {
      cache.put(request, response);
    });
  }

  return response.clone();
}

module.exports = {
  debug: debug,
  fetchAndCache: fetchAndCache,
  openCache: openCache,
};