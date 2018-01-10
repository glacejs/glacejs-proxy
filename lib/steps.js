"use strict";
/**
 * Steps to manage proxy.
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
     * Step to start HTTP proxy. Step recall will be skipped if proxy wasn't
     *  stopped before.
     *
     * @async
     * @method
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
     */
    startHttpProxy: async function (opts) {

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
    /**
     * Step to get proxy URL.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy URL is
     *  defined.
     * @return {string} Proxy URL.
     * @throws {AssertionError} If proxy URL isn't defined.
     */
    getProxyUrl: function (opts) {
        opts = U.defVal(opts, {});
        var check = U.defVal(opts.check, true);

        if (check) {
            expect(this.httpProxy.url,
                   "HTTP proxy was not launched").to.exist;
        };

        return this.httpProxy.url;
    },
    /**
     * Step to stop HTTP proxy. Step call will be skipped if proxy wasn't
     *  launched before.
     *
     * @async
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy was
     *  stopped.
     * @return {Promise<boolean>} `true` if step was passed, `false` if was
     *  skipped.
     * @throws {AssertionError} If proxy wasn't stopped.
     */
    stopHttpProxy: async function (opts) {

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
     * @return {Promise<boolean>} `true` if step was passed, `false` if was
     *  skipped.
     * @throws {AssertionError} If global proxy was not launched.
     */
    startGlobalProxy: async function (opts) {

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
     * @return {Promise<boolean>} `true` if step was passed, `false` if was
     *  skipped.
     * @throws {AssertionError} If global proxy wasn't stopped.
     */
    stopGlobalProxy: async function (opts) {

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
    /**
     * Step to limit proxy speed.
     *
     * @method
     * @instance
     * @arg {number|object} speed - Proxy limited speed, kb/s.
     * @arg {?number} [speed.req] - Requests speed, kb/s.
     * @arg {?number} [speed.res] - Responses speed, kb/s.
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy speed
     *  is limited.
     * @return {boolean} `true` if step was passed.
     * @throws {AssertionError} If proxy speed is not limited.
     */
    limitProxySpeed: function (speed, opts) {

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
    /**
     * Step to unlimit proxy speed.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that proxy speed
     *  is unlimited.
     * @return {boolean} `true` if step is passed.
     * @throws {AssertionError} If proxy speed is still limited.
     */
    unlimitProxySpeed: function (opts) {

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
    /**
     * Step to start responses measurement.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  measurement is launched.
     * @return {boolean} `true` if step is passed.
     * @throws {AssertionError} If responses measurement is not launched.
     */
    measureResponses: function (opts) {

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
    /**
     * Step to get measured responses data.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  data are present.
     * @throws {AssertionError} If responses data are absent.
     * @return {object[]} List of captured response data.
     */
    getResponsesData: function (opts) {

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
    /**
     * Step to stop responses measurement.
     *
     * @method
     * @instance
     * @arg {object} [opts] - Step options.
     * @arg {boolean} [opts.check=true] - Flag to check that responses
     *  measurement is stopped.
     * @return {boolean} `true` if step is passed.
     * @throws {AssertionError} If responses measurement is still running.
     */
    unmeasureResponses: function (opts) {

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
    /**
     * Step to enable cache.
     *
     * @method
     * @instance
     * @return {boolean} `true` if step is passed.
     */
    enableCache: function () {
        this._checkProxy();
        if (this.httpProxy) this.httpProxy.useCache = true;
        if (this.globalProxy) this.globalProxy.useCache = true;
        return true;
    },
    /**
     * Step to disable cache.
     *
     * @method
     * @instance
     * @return {boolean} `true` if step is passed.
     */
    disableCache: function () {
        this._checkProxy();
        if (this.httpProxy) this.httpProxy.useCache = false;
        if (this.globalProxy) this.globalProxy.useCache = false;
        return true;
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
        expect(
            (this.httpProxy && this.httpProxy.isRunning) ||
            (this.globalProxy && this.globalProxy.isRunning),
            "No one proxy is launched").to.be.true;
    },
};
module.exports = ProxySteps;
