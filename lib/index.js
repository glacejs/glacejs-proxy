"use strict";
/**
 * `GlaceJS` proxy.
 *
 * @module
 *
 * @prop {object} Commands - {@link module:commands|Commands} module.
 * @prop {object} config - {@link module:config|config} module.
 * @prop {object} GlobalProxy - {@link module:globalProxy|GlobalProxy} module.
 * @prop {object} HttpProxy - {@link module:httpProxy|HttpProxy} module.
 * @prop {function} interactive - {@link module:interactive|interactive} module.
 * @prop {array} middleware - {@link module:middleware|middleware} module.
 * @prop {object} mw - middleware dictionary.
 * @prop {object} Steps - {@link module:steps|Steps} module.
 */

var Commands,
    config,
    GlobalProxy,
    HttpProxy,
    interactive,
    middleware,
    mw,
    Steps;

Object.defineProperties(exports, {
    Commands: {
        get: function () {
            Commands = Commands || require("./commands");
            return Commands;
        },
    },
    config: {
        get: function () {
            config = config || require("./config");
            return config;
        },
    },
    GlobalProxy: {
        get: function () {
            GlobalProxy = GlobalProxy || require("./globalProxy");
            return GlobalProxy;
        },
    },
    HttpProxy: {
        get: function () {
            HttpProxy = HttpProxy || require("./httpProxy");
            return HttpProxy;
        },
    },
    interactive: {
        get: function () {
            interactive = interactive || require("./interactive");
            return interactive;
        },
    },
    middleware: {
        get: function () {
            middleware = middleware || require("./middleware");
            return middleware;
        },
    },
    mw: {
        get: function () {
            mw = mw || {
                cache: require("./middleware/cache"),
                info: require("./middleware/info"),
                reqBody: require("./middleware/reqBody"),
                resHead: require("./middleware/resHead"),
                speed: require("./middleware/speed"),
            };
            return mw;
        },
    },
    Steps: {
        get: function () {
            Steps = Steps || require("./steps");
            return Steps;
        },
    },
});
