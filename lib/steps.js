"use strict";
/**
 * Steps to manage proxy.
 *
 * These methods are mixed with glacejs [Steps](https://glacejs.github.io/glace-core/Steps.html)
 * class and available via its instance [SS](https://glacejs.github.io/glace-core/global.html#SS)
 * in tests.
 *
 * @mixin ProxySteps
 * @prop {string} webUrl - Web application URL.
 * @prop {GlobalProxy} globalProxy - Global proxy instance.
 * @prop {HttpProxy} httpProxy - HTTP proxy instance.
 */

var url = require("url");

var _ = require("lodash");
var expect = require("chai").expect;
var U = require("glace-utils");

require("./fixtures");
var GlobalProxy = require("./globalProxy");
var HttpProxy = require("./httpProxy");

var LOG = U.logger;

var ProxySteps = {
    __GlobalProxy: GlobalProxy,
    __HttpProxy: HttpProxy,

    registerProxy: function (opts) {
        /**
         * Helper to register proxy classes.
         * 
         * @memberOf ProxySteps
         * @method registerProxy
         * @instance
         * @arg {object} [opts] - Options.
         * @arg {object} [opts.GlobalProxy] - Global proxy class.
         * @arg {object} [opts.HttpProxy] - HTTP proxy class.
         * @example
         *
         * SS.registerProxy({ GlobalProxy: MyGlobalProxy, HttpProxy: MyHttpProxy });
         */

        opts = U.defVal(opts, {});
        this.__GlobalProxy = U.defVal(opts.GlobalProxy, this.__GlobalProxy);
        this.__HttpProxy = U.defVal(opts.HttpProxy, this.__HttpProxy);
    },

    startHttpProxy: async function (opts) {
        /**
         * Step to start HTTP proxy. Step recall will be skipped if proxy wasn't
         *  stopped before.
         *
         * @async
         * @memberOf ProxySteps
         * @method startHttpProxy
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {string} [opts.webUrl] - Web application url which will
         *  be proxied. Default value will be requested from `config.web.url`
         *  if it is specified.
         * @arg {boolean} [opts.useCache] - Flag to use proxy cache for
         *  responses. Default value will be requested from `config.useCache`
         *  if it is specified.
         * @arg {number} [opts.timeout] - Proxy timeout to break connection.
         *  Default value will be requested from `config.timeout.proxy`.
         * @arg {number} [opts.reconnect] - Number of proxy reconnects on failure.
         * @arg {number} [opts.port] - Proxy port. Default value will be
         *  requested from `config.proxyPort`.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy was launched.
         * @return {Promise<string>} Proxied URL.
         * @return {Promise<boolean} `false` if step was skipped
         * @throws {AssertionError} If proxy was not launched.
         * @example
         *
         * var proxiedUrl = await SS.startHttpProxy();
         * var proxiedUrl = await SS.startHttpProxy({ webUrl: "http://example.com", });
         * var proxiedUrl = await SS.startHttpProxy({ webUrl: "http://example.com", port: 8080 });
         */

        if (this._isProxyStarted) {
            LOG.warn("Step to start proxy was passed already");
            return false;
        };

        opts = U.defVal(opts, {});
        var webUrl = U.defVal(opts.webUrl, CONF.web && CONF.web.url);
        var useCache = U.defVal(opts.useCache, CONF.cache.use);
        var timeout = U.defVal(opts.timeout, CONF.proxy.timeout);
        var reconnect = U.defVal(opts.reconnect, CONF.proxy.reconnect);
        var port = U.defVal(opts.port, CONF.proxy.port);
        var check = U.defVal(opts.check, true);

        expect(webUrl, "Web URL for http proxy isn't specified").to.exist;

        this.httpProxy = this.httpProxy || new this.__HttpProxy({
            url: webUrl,
            useCache: useCache,
            timeout: timeout,
            reconnect: reconnect,
            port: port });
        await this.httpProxy.start();

        if (check) {
            expect(this.httpProxy.isRunning,
                "HTTP proxy was not launched").be.true;
        };
        this._isProxyStarted = true;

        this.webUrl = _.trim(
            this.httpProxy.url + url.parse(CONF.web.url).pathname, "/");
        return this.webUrl;
    },

    getProxyUrl: function (opts) {
        /**
         * Step to get proxy URL.
         *
         * @memberOf ProxySteps
         * @method getProxyUrl
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy URL is
         *  defined.
         * @return {string} Proxy URL.
         * @throws {AssertionError} If proxy URL isn't defined.
         * @example
         *
         * var proxiedUrl = SS.getProxiedUrl();
         */

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (check) {
            expect(this.httpProxy.url,
                "HTTP proxy was not launched").to.exist;
        };

        return this.httpProxy.url;
    },

    stopHttpProxy: async function (opts) {
        /**
         * Step to stop HTTP proxy. Step call will be skipped if proxy wasn't
         *  launched before.
         *
         * @async
         * @memberOf ProxySteps
         * @method stopHttpProxy
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy was
         *  stopped.
         * @return {Promise<boolean>} `true` if step was passed, `false` if was
         *  skipped.
         * @throws {AssertionError} If proxy wasn't stopped.
         * @example
         *
         * await SS.stopHttpProxy();
         */

        if (!this._isProxyStarted) {
            LOG.warn("Step to start HTTP proxy wasn't passed yet");
            return false;
        };

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        await this.httpProxy.stop();

        if (check) {
            expect(this.httpProxy.isRunning,
                "HTTP proxy wasn't stopped").be.false;
        };

        this.webUrl = CONF.web.Url;
        this._isProxyStarted = false;
        return true;
    },

    startGlobalProxy: async function (opts) {
        /**
         * Step to start global proxy. Step recall will be skipped if global
         *  proxy wasn't stopped before.
         *
         * @async
         * @memberOf ProxySteps
         * @method startGlobalProxy
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.useCache] - Flag to use proxy cache for
         *  responses. Default value will be requested from `config.useCache`
         *  if it is specified.
         * @arg {number} [opts.timeout] - Proxy timeout to break connection.
         *  Default value will be requested from `config.timeout.proxy`.
         * @arg {number} [opts.reconnect] - Number of proxy reconnects on failure.
         * @arg {number} [opts.port] - Proxy port. Default value will be
         *  requested from `config.globalProxyPort`.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy was launched.
         * @return {Promise<boolean>} `true` if step was passed, `false` if was
         *  skipped.
         * @throws {AssertionError} If global proxy was not launched.
         * @example
         *
         * await SS.startGlobalProxy();
         * await SS.startGlobalProxy({ timeout: 30000 });
         */

        if (this._isGlobalProxyStarted) {
            LOG.warn("Step to start global proxy was passed already");
            return false;
        };

        opts = U.defVal(opts, {});
        var useCache = U.defVal(opts.useCache, CONF.cache.use);
        var timeout = U.defVal(opts.timeout, CONF.proxy.timeout);
        var reconnect = U.defVal(opts.reconnect, CONF.proxy.reconnect);
        var port = U.defVal(opts.port, CONF.proxy.globalPort);
        var check = U.defVal(opts.check, true);

        this.globalProxy = this.globalProxy || new this.__GlobalProxy({
            useCache: useCache,
            timeout: timeout,
            reconnect: reconnect,
            port: port,
            installCertificate: CONF.proxy.installCertificate });

        await this.globalProxy.start();

        if (check) {
            expect(this.globalProxy.isRunning,
                "Global proxy was not launched")
                .to.be.true;
        };

        this._isGlobalProxyStarted = true;
        return true;
    },

    stopGlobalProxy: async function (opts) {
        /**
         * Step to stop global proxy. Step call will be skipped if global proxy
         *  wasn't launched before.
         *
         * @async
         * @memberOf ProxySteps
         * @method stopGlobalProxy
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that global
         *  proxy was stopped.
         * @return {Promise<boolean>} `true` if step was passed, `false` if was
         *  skipped.
         * @throws {AssertionError} If global proxy wasn't stopped.
         * @example
         *
         * await SS.stopGlobalProxy();
         */

        if (!this._isGlobalProxyStarted) {
            LOG.warn("Step to start global proxy wasn't passed yet");
            return false;
        };

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        await this.globalProxy.stop();

        if (check) {
            expect(this.globalProxy.isRunning,
                "Global proxy wasn't stopped").be.false;
        };
        this._isGlobalProxyStarted = false;
        return true;
    },

    limitProxySpeed: function (speed, opts) {
        /**
         * Step to limit proxy speed.
         *
         * @memberOf ProxySteps
         * @method limitProxySpeed
         * @instance
         * @arg {number|object} speed - Proxy limited speed, kb/s.
         * @arg {?number} [speed.req] - Requests speed, kb/s.
         * @arg {?number} [speed.res] - Responses speed, kb/s.
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy speed
         *  is limited.
         * @return {boolean} `true` if step was passed.
         * @throws {AssertionError} If proxy speed is not limited.
         * @example
         *
         * SS.limitProxySpeed(512);
         * SS.limitProxySpeed({ res: 512 });
         */

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this.httpProxy) {
            this.httpProxy.setSpeed(speed);
        };
        if (this.globalProxy) {
            this.globalProxy.setSpeed(speed);
        };

        if (check) {
            if (speed.req === undefined && speed.res === undefined) {
                speed = { req: speed, res: speed };
            };

            if (this.httpProxy) {
                if (speed.req !== undefined) {
                    expect(this.httpProxy.reqSpeed,
                        "HTTP proxy requests speed is not limited")
                        .be.equal(speed.req);
                };
                if (speed.res !== undefined) {
                    expect(this.httpProxy.resSpeed,
                        "HTTP proxy responses speed is not limited")
                        .be.equal(speed.res);
                };
            };
            if (this.globalProxy) {
                if (speed.req !== undefined) {
                    expect(this.globalProxy.reqSpeed,
                        "Global proxy requests speed is not limited")
                        .be.equal(speed.req);
                };
                if (speed.res !== undefined) {
                    expect(this.globalProxy.resSpeed,
                        "Global proxy responses speed is not limited")
                        .be.equal(speed.res);
                };
            };
        };
        return true;
    },

    unlimitProxySpeed: function (opts) {
        /**
         * Step to unlimit proxy speed.
         *
         * @memberOf ProxySteps
         * @method unlimitProxySpeed
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that proxy speed
         *  is unlimited.
         * @return {boolean} `true` if step is passed.
         * @throws {AssertionError} If proxy speed is still limited.
         * @example
         *
         * SS.unlimitProxySpeed();
         */

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this.httpProxy) {
            this.httpProxy.resetSpeed();
        };
        if (this.globalProxy) {
            this.globalProxy.resetSpeed();
        };

        if (check) {
            if (this.httpProxy) {
                expect(this.httpProxy.reqSpeed,
                    "HTTP proxy requests speed still has limited value")
                    .be.null;
                expect(this.httpProxy.resSpeed,
                    "HTTP proxy responses speed still has limited value")
                    .be.null;
            };
            if (this.globalProxy) {
                expect(this.globalProxy.reqSpeed,
                    "Global proxy requests speed still has limited value")
                    .be.null;
                expect(this.globalProxy.resSpeed,
                    "Global proxy responses speed still has limited value")
                    .be.null;
            };
        };
        return true;
    },

    measureResponses: function (opts) {
        /**
         * Step to start responses measurement.
         *
         * @memberOf ProxySteps
         * @method measureResponses
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that responses
         *  measurement is launched.
         * @return {boolean} `true` if step is passed.
         * @throws {AssertionError} If responses measurement is not launched.
         * @example
         *
         * SS.measureResponses();
         */

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this.httpProxy) {
            this.httpProxy.measureResponses();
        };
        if (this.globalProxy) {
            this.globalProxy.measureResponses();
        };

        if (check) {
            if (this.httpProxy) {
                expect(this.httpProxy.getResponsesData(),
                    "HTTP proxy responses measurement is not launched")
                    .to.exist;
            };
            if (this.globalProxy) {
                expect(this.globalProxy.getResponsesData(),
                    "Global proxy responses measurement is not launched")
                    .to.exist;
            };
        };
        return true;
    },

    getResponsesData: function (opts) {
        /**
         * Step to get measured responses data.
         *
         * @memberOf ProxySteps
         * @method getResponsesData
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that responses
         *  data are present.
         * @throws {AssertionError} If responses data are absent.
         * @return {object[]} List of captured response data.
         * @example
         *
         * var responses = SS.getResponsesData();
         */

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        var data = [];

        if (this.httpProxy && this.httpProxy.getResponsesData()) {
            data = data.concat(this.httpProxy.getResponsesData());
        };
        if (this.globalProxy && this.globalProxy.getResponsesData()) {
            data = data.concat(this.globalProxy.getResponsesData());
        };

        if (check) {
            expect(_.isEmpty(data),
                "Responses data are absent").be.false;
        };

        return data;
    },

    unmeasureResponses: function (opts) {
        /**
         * Step to stop responses measurement.
         *
         * @memberOf ProxySteps
         * @method unmeasureResponses
         * @instance
         * @arg {object} [opts] - Step options.
         * @arg {boolean} [opts.check=true] - Flag to check that responses
         *  measurement is stopped.
         * @return {boolean} `true` if step is passed.
         * @throws {AssertionError} If responses measurement is still running.
         * @example
         *
         * SS.unmeasureResponses();
         */

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this.httpProxy) {
            this.httpProxy.unmeasureResponses();
        };
        if (this.globalProxy) {
            this.globalProxy.unmeasureResponses();
        };

        if (check) {
            if (this.httpProxy) {
                expect(this.httpProxy.getResponsesData(),
                    "HTTP proxy responses measurement is still running")
                    .to.be.null;
            };
            if (this.globalProxy) {
                expect(this.globalProxy.getResponsesData(),
                    "Global proxy responses measurement is still running")
                    .to.be.null;
            };
        };
        return true;
    },

    enableCache: function () {
        /**
         * Step to enable cache.
         *
         * @memberOf ProxySteps
         * @method enableCache
         * @instance
         * @return {boolean} `true` if step is passed.
         * @example
         *
         * SS.enableCache();
         */

        this._checkProxy();
        if (this.httpProxy) this.httpProxy.useCache = true;
        if (this.globalProxy) this.globalProxy.useCache = true;
        return true;
    },

    disableCache: function () {
        /**
         * Step to disable cache.
         *
         * @memberOf ProxySteps
         * @method disableCache
         * @instance
         * @return {boolean} `true` if step is passed.
         * @example
         *
         * SS.disableCache();
         */

        this._checkProxy();
        if (this.httpProxy) this.httpProxy.useCache = false;
        if (this.globalProxy) this.globalProxy.useCache = false;
        return true;
    },
    /**
     * Helper to check that proxy is launched.
     *
     * @ignore
     * @method
     * @protected
     * @instance
     * @throws {AssertionError} - If no one proxy is launched.
     */
    _checkProxy: function () {
        expect(
            (this.httpProxy && this.httpProxy.isRunning) ||
            (this.globalProxy && this.globalProxy.isRunning),
            "No one proxy is launched").to.be.true;
    },
};
module.exports = ProxySteps;
