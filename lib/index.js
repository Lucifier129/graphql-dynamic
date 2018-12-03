"use strict";

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n\t{\n\t\tobject(value: { a: 123, b: $test, c: 522 })\n\t\tprovide(value: 123) @variable(name: \"provide\") @val\n\t\ta(value: $testA)\n\t\t\t@get(\n\t\t\t\turl: \"/12446/getUserInfo\"\n\t\t\t\tquery: { a: 1, b: 2, c: 3 }\n\t\t\t\toptions: { headers: [[\"Content-Type\", \"application/json\"]] }\n\t\t\t)\n\t\t\t@drop(if: true)\n\t\tb(value: $provide)\n\t\t\t@post(url: \"/12446/getUserInfo\", body: { a: 1, b: 2, c: 3 })\n\t}\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('graphql-anywhere/lib/async'),
    graphql = _require.graphql;

var gql = require('graphql-tag');

var compose = require('koa-compose');

var fetch = require('isomorphic-fetch');

var _require2 = require('./util'),
    getValue = _require2.getValue,
    isThenable = _require2.isThenable,
    deferred = _require2.deferred,
    fromEntries = _require2.fromEntries;

var createVariables = function createVariables(variables) {
  var deferredMap = {};
  return new Proxy(variables, {
    get: function get(target, key) {
      // existed value
      if (key in target) {
        return target[key];
      } // defered value


      if (!deferredMap.hasOwnProperty(key)) {
        resolveMap[key] = deferred();
      }

      return deferredMap[key].promise;
    },
    set: function set(target, key, value) {
      // read-only
      if (key in target) {
        return true;
      } // dynamic


      if (!deferredMap.hasOwnProperty(key)) {
        target[key] = value;
        return true;
      } // async & dynamic


      deferredMap[key].resolve(value);
      return true;
    }
  });
};

var resolveDynamicArgs =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(ctx, next) {
    var directives, args;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directives = getValue(ctx.info.directives);
            args = getValue(ctx.args);

            if (!isThenable(directives)) {
              _context.next = 6;
              break;
            }

            _context.next = 5;
            return directives;

          case 5:
            ctx.info.directives = _context.sent;

          case 6:
            if (!isThenable(args)) {
              _context.next = 10;
              break;
            }

            _context.next = 9;
            return args;

          case 9:
            ctx.args = _context.sent;

          case 10:
            return _context.abrupt("return", next());

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function resolveDynamicArgs(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var addUtils = function addUtils(ctx, next) {
  ctx.entries = Object.entries;
  ctx.fromEntries = Object.fromEntries || fromEntries;
  ctx.fetch = fetch;
  return next();
};

var addDirective = function addDirective(ctx, next) {
  var directiveHandlers = ctx.directiveHandlers = {};

  ctx.directive = function (key, handler) {
    directiveHandlers[key] = handler;
  };

  return next();
};

var handleDirectives =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(ctx, next) {
    var directiveKeys, i;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            directiveKeys = Object.keys(ctx.info.directives);

            for (i = 0; i < directiveKeys.length; i++) {}

            return _context2.abrupt("return", next());

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function handleDirectives(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}(); // const fetch = async (ctx, next) => {
//   let { directives } =
// }


var beforeAll = [resolveDynamicArgs, addUtils];
var afterAll = [];

var create = function create() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (query, variables) {
    var errors = [];
    var resolve = compose.apply(void 0, beforeAll.concat(middlewares, afterAll));
    var dynamicVariables = createVariables(variables);

    var resolver =
    /*#__PURE__*/
    function () {
      var _ref3 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3(fieldName, rootValue, args, graphqlContext, info) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                _context3.next = 3;
                return resolve({
                  variables: dynamicVariables,
                  fieldName: fieldName,
                  rootValue: rootValue,
                  args: args,
                  graphqlContext: graphqlContext,
                  info: info,
                  errors: errors,
                  result: null
                });

              case 3:
                return _context3.abrupt("return", context.result);

              case 6:
                _context3.prev = 6;
                _context3.t0 = _context3["catch"](0);

                _context3.t0.push(_context3.t0);

                return _context3.abrupt("return", null);

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[0, 6]]);
      }));

      return function resolver(_x5, _x6, _x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
      };
    }();

    return graphql(resolver, query, {}, {}, dynamicVariables);
  };
};

var q1 = gql(_templateObject());
var proxy = new Proxy({}, {
  get: function get(target, key) {
    return Promise.resolve(key);
  }
});

var test =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return graphql(resolver, q1, null, null, proxy);

          case 2:
            result = _context4.sent;
            console.log('result', result);

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function test() {
    return _ref4.apply(this, arguments);
  };
}();

test();
module.exports = {
  create: create
};