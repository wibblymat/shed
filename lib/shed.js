'use strict';

require('serviceworker-cache-polyfill/lib/caches');
var globalOptions = require('./options');
var savedState = require('./savedState');
var router = require('./router');
var helpers = require('./helpers');
var strategies = require('./strategies');

helpers.debug('Shed is loading');

// Install

// TODO: This is necessary to handle different implementations in the wild
// The spec defines self.registration
var scope;
if (self.registration) {
  scope = self.registration.scope;
} else {
  scope = self.scope || new URL('./', self.location);
}
var cachePrefix = `$$$shed-cache$$$${scope}$$$`;

async function createCache() {
  helpers.debug('creating new cache');

  var lastVersion = await savedState.get('lastInstalledVersion');
  var version = lastVersion + 1;
  var name = cachePrefix + version;
  helpers.debug(`creating cache [${name}]`);

  await Promise.all([
    savedState.set('lastInstalledVersion', version),
    savedState.set('lastInstalledCache', name)
  ]);

  return helpers.openCache({cacheName: name});
}

function initializeCache(cache) {
  helpers.debug('preCache list: ' + (globalOptions.preCacheItems.join(', ') || '(none)'));
  return cache.addAll(globalOptions.preCacheItems);
}

self.addEventListener('install', function(event) {
  helpers.debug('install event fired');
  event.waitUntil(createCache().then(initializeCache));
});

// Activate

function filterCacheNames(currentCacheName, names) {
  helpers.debug('Filtering caches: ' + currentCacheName + '[' + names.join(', ') + ']');
  return names.filter(function(name) {
    return (name.indexOf(cachePrefix) === 0 && name !== currentCacheName);
  });
}

function deleteCache(name) {
  helpers.debug('Deleting an old cache: [' + name + ']');
  return caches.delete(name);
}

function deleteCaches(names) {
  return Promise.all(names.map(deleteCache));
}

async function deleteOldCaches() {
  helpers.debug('removing old caches');
  var [currentName, cacheList] = await Promise.all([
    savedState.get('lastInstalledCache'),
    caches.keys()
  ]);

  cacheList = filterCacheNames(currentName, cacheList);
  return deleteCaches(cacheList);
}

async function setActiveCache() {
  helpers.debug('Making last installed cache active');
  var name = await savedState.get('lastInstalledCache');
  return savedState.set('lastActivatedCache', name);
}

self.addEventListener('activate', function(event) {
  helpers.debug('activate event fired');
  event.waitUntil(deleteOldCaches().then(setActiveCache));
});

// Fetch

self.addEventListener('fetch', function(event) {
  var handler = router.match(event.request);

  if (handler) {
    event.respondWith(handler(event.request));
  } else if (router.default) {
    event.respondWith(router.default(event.request));
  }
});

// Caching

async function cache(url, options) {
  var cache = await helpers.openCache(options);
  return cache.add(url);
}

async function uncache(url, options) {
  var cache = await helpers.openCache(options);
  return cache.delete(url);
}

function precache(items) {
  if (!Array.isArray(items)) {
    items = [items];
  }
  globalOptions.preCacheItems = globalOptions.preCacheItems.concat(items);
}

module.exports = {
  networkOnly: strategies.networkOnly,
  networkFirst: strategies.networkFirst,
  cacheOnly: strategies.cacheOnly,
  cacheFirst: strategies.cacheFirst,
  fastest: strategies.fastest,
  router: router,
  options: globalOptions,
  cache: cache,
  uncache: uncache,
  precache: precache
};
