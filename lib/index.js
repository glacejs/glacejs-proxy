"use strict";
/**
 * `GlaceJS` proxy.
 *
 * @module
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
    /**
     * @type {Commands}
     */
    Commands: {
        get: function () {
            Commands = Commands || require("./commands");
            return Commands;
        },
    },
    /**
     * @type {GlaceProxyConfig}
     */
    config: {
        get: function () {
            config = config || require("./config");
            return config;
        },
    },
    /**
     * @type {GlobalProxy}
     */
    GlobalProxy: {
        get: function () {
            GlobalProxy = GlobalProxy || require("./globalProxy");
            return GlobalProxy;
        },
    },
    /**
     * @type {HttpProxy}
     */
    HttpProxy: {
        get: function () {
            HttpProxy = HttpProxy || require("./httpProxy");
            return HttpProxy;
        },
    },
    /**
     * @type {interactive}
     */
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
    /**
     * @type {ProxySteps}
     */
    Steps: {
        get: function () {
            Steps = Steps || require("./steps");
            return Steps;
        },
    },
});
