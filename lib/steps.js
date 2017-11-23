"use strict";
/**
 * `GlaceJS` steps for proxy.
 *
 * @module
 */

var url = require("url");

var _ = require("lodash");
var expect = require("chai").expect;
var U = require("glacejs-utils");

var LOG = require("./logger");
var GlobalProxy = require("./globalProxy");
var HttpProxy = require("./httpProxy");
/**
 * Steps to manage proxy.
 *
 *  @mixin
 */
module.exports = {
    /**
     * Step to start proxy. Step recall will be skipped if proxy wasn't
     *  stopped before.
     *
     * @async
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {string} [opts.appUrl] - Web application url which will
     *  be proxied. Default value will be requested from `config.appUrl`
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
     * @return {Promise<string>} - Proxied URL.
     * @throws {AssertionError} - If proxy was not launched.
     */
    startProxy: async function (opts) {

        if (this._isProxyStarted) {
            LOG.warn("Step to start proxy was passed already");
            return;
        };

        opts = U.defVal(opts, {});
        var appUrl = U.defVal(opts.appUrl, this._config.appUrl);
        var useCache = U.defVal(opts.useCache, this._config.cache.use);
        var timeout = U.defVal(opts.timeout, this._config.proxy.timeout);
        var reconnect = U.defVal(opts.reconnect, this._config.proxy.reconnect);
        var port = U.defVal(opts.port, this._config.proxy.port);
        var check = U.defVal(opts.check, true);

        this._proxy = new HttpProxy({ url: appUrl,
                                      useCache: useCache,
                                      timeout: timeout,
                                      reconnect: reconnect,
                                      port: port });
        await this._proxy.start();

        if (check) {
            expect(this._proxy.isRunning,
                   "Proxy was not launched").be.true;
        };
        this._isProxyStarted = true;

        this._appUrl = _.trim(
            this._proxy.url + url.parse(this._config.appUrl).pathname, "/");
        return this._appUrl;
    },
    /**
     * Step to get proxy URL.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy URL is
     *  defined.
     * @throws {AssertionError} - If proxy URL isn't defined.
     */
    getProxyUrl: function (opts) {
        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (check) {
            expect(this._proxy.url,
                   "Proxy was not launched").to.exist;
        };

        return this._proxy.url;
    },
    /**
     * Step to stop proxy. Step call will be skipped if proxy wasn't launched
     *  before.
     *
     * @method
     * @instance
     * @async
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy was
     *  stopped.
     * @throws {AssertionError} - If proxy wasn't stopped.
     */
    stopProxy: async function (opts) {

        if (!this._isProxyStarted) {
            LOG.warn("Step to start proxy wasn't passed yet");
            return;
        };

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        await this._proxy.stop();

        if (check) {
            expect(this._proxy.isRunning,
                   "Proxy wasn't stopped").be.false;
        };

        this._appUrl = this._config.appUrl;

        this._isProxyStarted = false;
    },
    /**
     * Step to start global proxy. Step recall will be skipped if global
     *  proxy wasn't stopped before.
     *
     * @method
     * @instance
     * @async
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
     * @throws {AssertionError} - If global proxy was not launched.
     */
    startGlobalProxy: async function (opts) {

        if (this._isGlobalProxyStarted) {
            LOG.warn("Step to start global proxy was passed already");
            return;
        };

        opts = U.defVal(opts, {});
        var useCache = U.defVal(opts.useCache, this._config.cache.use);
        var timeout = U.defVal(opts.timeout, this._config.timeouts.proxy);
        var reconnect = U.defVal(opts.reconnect, this._config.proxy.reconnect);
        var port = U.defVal(opts.port, this._config.globalProxyPort);
        var check = U.defVal(opts.check, true);

        this._globalProxy = new GlobalProxy({
            useCache: useCache,
            timeout: timeout,
            reconnect: reconnect,
            port: port,
            installCertificate: this._config.installCertificate });

        await this._globalProxy.start();

        if (check) {
            expect(this._globalProxy.isRunning,
                   "Global proxy was not launched")
                .to.be.true;
        };

        this._isGlobalProxyStarted = true;
    },
    /**
     * Step to stop global proxy. Step call will be skipped if global proxy
     *  wasn't launched before.
     *
     * @method
     * @instance
     * @async
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that global
     *  proxy was stopped.
     * @throws {AssertionError} - If global proxy wasn't stopped.
     */
    stopGlobalProxy: async function (opts) {

        if (!this._isGlobalProxyStarted) {
            LOG.warn("Step to start global proxy wasn't passed yet");
            return;
        };

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        await this._globalProxy.stop();

        if (check) {
            expect(this._globalProxy.isRunning,
                   "Global proxy wasn't stopped").be.false;
        };
        this._isGlobalProxyStarted = false;
    },
    /**
     * Step to limit proxy speed.
     *
     * @method
     * @instance
     * @arg {number} speed - Proxy limited speed, kb/s.
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flat to check that proxy speed
     *  is limited.
     * @throws {AssertionError} - If proxy speed is not limited.
     */
    limitProxySpeed: function (speed, opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this._proxy) {
            this._proxy.setSpeed(speed);
        };
        if (this._globalProxy) {
            this._globalProxy.setSpeed(speed);
        };

        if (check) {
            if (this._proxy) {
                expect(this._proxy.speed,
                       "Proxy speed is not limited").be.equal(speed);
            };
            if (this._globalProxy) {
                expect(this._globalProxy.speed,
                       "Global proxy speed is not limited").be.equal(speed);
            };
        };
    },
    /**
     * Step to unlimit proxy speed.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy speed
     *  is unlimited.
     * @throws {AssertionError} - If proxy speed is still limited.
     */
    unlimitProxySpeed: function (opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this._proxy) {
            this._proxy.resetSpeed();
        };
        if (this._globalProxy) {
            this._globalProxy.resetSpeed();
        };

        if (check) {
            if (this._proxy) {
                expect(this._proxy.speed,
                       "Proxy speed still has limited value").be.null;
            };
            if (this._globalProxy) {
                expect(this._globalProxy.speed,
                       "Global proxy speed still has limited value").be.null;
            };
        };
    },
    /**
     * Step to start responses measurement.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  measurement is launched.
     * @throws {AssertionError} - If responses measurement is not launched.
     */
    measureResponses: function (opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this._proxy) {
            this._proxy.measureResponses();
        };
        if (this._globalProxy) {
            this._globalProxy.measureResponses();
        };

        if (check) {
            if (this._proxy) {
                expect(this._proxy.getResponsesData(),
                       "Proxy responses measurement is not launched")
                    .to.exist;
            };
            if (this._globalProxy) {
                expect(this._globalProxy.getResponsesData(),
                       "Global proxy responses measurement is not launched")
                    .to.exist;
            };
        };
    },
    /**
     * Step to get measured responses data.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  data are present.
     * @throws {AssertionError} - If responses data are absent.
     */
    getResponsesData: function (opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        var data = [];

        if (this._proxy && this._proxy.getResponsesData()) {
            data = data.concat(this._proxy.getResponsesData());
        };
        if (this._globalProxy && this._globalProxy.getResponsesData()) {
            data = data.concat(this._globalProxy.getResponsesData());
        };

        if (check) {
            expect(_.isEmpty(data),
                   "Responses data are absent").be.false;
        };

        return data;
    },
    /**
     * Step to stop responses measurement.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  measurement is stopped.
     * @throws {AssertionError} - If responses measurement is still running.
     */
    unmeasureResponses: function (opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (this._proxy) {
            this._proxy.unmeasureResponses();
        };
        if (this._globalProxy) {
            this._globalProxy.unmeasureResponses();
        };

        if (check) {
            if (this._proxy) {
                expect(this._proxy.getResponsesData(),
                       "Proxy responses measurement is still running")
                    .to.be.null;
            };
            if (this._globalProxy) {
                expect(this._globalProxy.getResponsesData(),
                       "Global proxy responses measurement is still running")
                    .to.be.null;
            };
        };
    },
    /**
     * Step to enable cache.
     *
     * @method
     * @instance
     */
    enableCache: function () {
        this._checkProxy();
        if (this._proxy) this._proxy.useCache = true;
        if (this._globalProxy) this._globalProxy.useCache = true;
    },
    /**
     * Step to disable cache.
     *
     * @method
     * @instance
     */
    disableCache: function () {
        this._checkProxy();
        if (this._proxy) this._proxy.useCache = false;
        if (this._globalProxy) this._globalProxy.useCache = false;
    },
    /**
     * Helper to check that proxy is launched.
     *
     * @method
     * @protected
     * @instance
     * @throws {AssertionError} - If no proxy is launched.
     */
    _checkProxy: function () {
        expect(this._proxy || this._globalProxy,
               "No proxy is launched").to.exist;
    },
};
