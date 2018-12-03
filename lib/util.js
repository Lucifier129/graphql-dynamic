"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var delay = function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

var fromEntries = function fromEntries() {
  var list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return list.reduce(function (result, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    result[key] = value;
    return result;
  }, {});
};

var isThenable = function isThenable(obj) {
  return !!(obj && typeof obj.then === 'function');
};

var getValue = function getValue(obj) {
  if (obj == null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return getArray(obj);
  }

  if (_typeof(obj) === 'object') {
    return getObject(obj);
  }

  return obj;
};

var getArray = function getArray(array) {
  var hasThenable = false;
  var result = array.map(function (item) {
    var value = getValue(item);

    if (isThenable(value)) {
      hasThenable = true;
    }

    return value;
  });
  return hasThenable ? Promise.all(result) : array;
};

var getObject = function getObject(object) {
  var values = getArray(Object.values(object));

  if (!isThenable(values)) {
    return object;
  }

  return values.then(function (values) {
    var keys = Object.keys(object);
    var result = {};

    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = values[i];
    }

    return result;
  });
};

var deferred = function deferred() {
  var promise, resolve, reject;
  promise = new Promise(function ($resolve, $reject) {
    resolve = $resolve;
    reject = $reject;
  });
  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
};

module.exports = {
  fromEntries: fromEntries,
  deferred: deferred,
  isThenable: isThenable,
  getValue: getValue,
  getObject: getObject,
  getArray: getArray,
  delay: delay
};