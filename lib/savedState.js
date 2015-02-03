'use strict';

var store = require('./store');

var _state;
var savePromise = Promise.resolve();

// TODO: Need to namespace storage on scope, too!

var getState = async function() {
  if (!_state) {
    var state = (await store.get('shedState')) || {
      lastInstalledVersion: 0,
      lastInstalledCache: null,
      lastActivatedCache: null
    };

    _state = state;
  }

  return _state;
};

var save = async function() {
  await savePromise;
  savePromise = store.set('shedState', _state);
  return savePromise;
};

module.exports = {
  get: async function(name) {
    var state = await getState();
    return state[name];
  },
  set: async function(name, value) {
    var state = await getState();
    state[name] = value;
    return save();
  }
};