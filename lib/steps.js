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

var GlobalProxy = require("./globalProxy");
var HttpProxy = require("./httpProxy");

var LOG = U.logger;
/**
 * Steps to manage proxy.
 *
 * @mixin ProxySteps
 */
module.exports = {
    __GlobalProxy: GlobalProxy,
    __HttpProxy: HttpProxy,
    /**
     * Helper to register proxy classes.
     * 
     * @method
     * @arg {object} [opts] - Options.
     * @arg {object} [opts.GlobalProxy] - Global proxy class.
     * @arg {object} [opts.HttpProxy] - HTTP proxy class.
     */
    registerProxy: function (opts) {
        opts = U.defVal(opts, {});
        this.__GlobalProxy = U.defVal(opts.GlobalProxy, this.__GlobalProxy);
        this.__HttpProxy = U.defVal(opts.HttpProxy, this.__HttpProxy);
    },
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

        this._httpProxy = new this.__HttpProxy({
            url: appUrl,
            useCache: useCache,
            timeout: timeout,
            reconnect: reconnect,
            port: port });
        await this._httpProxy.start();

        if (check) {
            expect(this._httpProxy.isRunning,
                   "HTTP proxy was not launched").be.true;
        };
        this._isProxyStarted = true;

        this._appUrl = _.trim(
            this._httpProxy.url + url.parse(this._config.appUrl).pathname, "/");
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
     * @return {string} - Proxy URL.
     * @throws {AssertionError} - If proxy URL isn't defined.
     */
    getProxyUrl: function (opts) {
        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (check) {
            expect(this._httpProxy.url,
                   "HTTP proxy was not launched").to.exist;
        };

        return this._httpProxy.url;
    },
    /**
     * Step to stop proxy. Step call will be skipped if proxy wasn't launched
     *  before.
     *
     * @async
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy was
     *  stopped.
     * @return {Promise<void>}
     * @throws {AssertionError} - If proxy wasn't stopped.
     */
    stopProxy: async function (opts) {

        if (!this._isProxyStarted) {
            LOG.warn("Step to start HTTP proxy wasn't passed yet");
            return;
        };

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        await this._httpProxy.stop();

        if (check) {
            expect(this._httpProxy.isRunning,
                   "HTTP proxy wasn't stopped").be.false;
        };

        this._appUrl = this._config.appUrl;
        this._isProxyStarted = false;
    },
    /**
     * Step to start global proxy. Step recall will be skipped if global
     *  proxy wasn't stopped before.
     *
     * @async
     * @method
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
     * @return {Promise<void>}
     * @throws {AssertionError} - If global proxy was not launched.
     */
    startGlobalProxy: async function (opts) {

        if (this._isGlobalProxyStarted) {
            LOG.warn("Step to start global proxy was passed already");
            return;
        };

        opts = U.defVal(opts, {});
        var useCache = U.defVal(opts.useCache, this._config.cache.use);
        var timeout = U.defVal(opts.timeout, this._config.proxy.timeout);
        var reconnect = U.defVal(opts.reconnect, this._config.proxy.reconnect);
        var port = U.defVal(opts.port, this._config.proxy.globalPort);
        var check = U.defVal(opts.check, true);

        this._globalProxy = new this.__GlobalProxy({
            useCache: useCache,
            timeout: timeout,
            reconnect: reconnect,
            port: port,
            installCertificate: this._config.proxy.installCertificate });

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
     * @async
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that global
     *  proxy was stopped.
     * @return {Promise<void>}
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

        if (this._httpProxy) {
            this._httpProxy.setSpeed(speed);
        };
        if (this._globalProxy) {
            this._globalProxy.setSpeed(speed);
        };

        if (check) {
            if (this._httpProxy) {
                expect(this._httpProxy.speed,
                       "HTTP proxy speed is not limited").be.equal(speed);
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

        if (this._httpProxy) {
            this._httpProxy.resetSpeed();
        };
        if (this._globalProxy) {
            this._globalProxy.resetSpeed();
        };

        if (check) {
            if (this._httpProxy) {
                expect(this._httpProxy.speed,
                       "HTTP proxy speed still has limited value").be.null;
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

        if (this._httpProxy) {
            this._httpProxy.measureResponses();
        };
        if (this._globalProxy) {
            this._globalProxy.measureResponses();
        };

        if (check) {
            if (this._httpProxy) {
                expect(this._httpProxy.getResponsesData(),
                       "HTTP proxy responses measurement is not launched")
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
     * @return {object[]} - List of captured response data.
     */
    getResponsesData: function (opts) {

        this._checkProxy();

        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        var data = [];

        if (this._httpProxy && this._httpProxy.getResponsesData()) {
            data = data.concat(this._httpProxy.getResponsesData());
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

        if (this._httpProxy) {
            this._httpProxy.unmeasureResponses();
        };
        if (this._globalProxy) {
            this._globalProxy.unmeasureResponses();
        };

        if (check) {
            if (this._httpProxy) {
                expect(this._httpProxy.getResponsesData(),
                       "HTTP proxy responses measurement is still running")
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
        if (this._httpProxy) this._httpProxy.useCache = true;
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
        if (this._httpProxy) this._httpProxy.useCache = false;
        if (this._globalProxy) this._globalProxy.useCache = false;
    },
    /**
     * Helper to check that proxy is launched.
     *
     * @method
     * @protected
     * @instance
     * @throws {AssertionError} - If no one proxy is launched.
     */
    _checkProxy: function () {
        expect(this._httpProxy || this._globalProxy,
               "No one proxy is launched").to.exist;
    },
};
