"use strict";
/**
 * Creates commands instance.
 *
 * @class
 * @name Commands
 * @classdesc Aggregates commands to manage `GlaceJS` proxy.
 * @arg {object} config - Commands config.
 * @arg {object} [opts] - Commands options.
 * @arg {function} [opts.logger] - Commands logger. Default is system logger.
 * @arg {boolean} [opts.colored=false] - Flag to use ANSI color in log message.
 * @arg {object} [opts.GlobalProxy] - Global proxy class.
 * @arg {object} [opts.HttpProxy] - HTTP proxy class.
 * @arg {object} [opts.isRunning] - Function to detect is process launched.
 */

var fs = require("fs");
var http = require("http");
var os = require("os");
var path = require("path");
var url = require("url");

require("colors");
var _ = require("lodash");
var chromeLauncher = require("chrome-launcher");
var expect = require("chai").expect;
var fse = require("fs-extra");
var isRunning = require("is-running");
var temp = require("temp").track();
var U = require("glace-utils");

var cache = require("./middleware/cache");
var GlobalProxy = require("./globalProxy");
var HttpProxy = require("./httpProxy");

var LOG = U.logger;

var Commands = function (config, opts) {
    this._config = config;

    opts = U.defVal(opts, {});
    this._log = U.defVal(opts.logger, LOG.info.bind(LOG));
    this._coloredLog = U.defVal(opts.colored, false);

    this._chrome = null;
    this._httpProxy = null;
    this._globalProxy = null;

    this.__GlobalProxy = U.defVal(opts.GlobalProxy, GlobalProxy);
    this.__HttpProxy = U.defVal(opts.HttpProxy, HttpProxy);
    this.__isRunning = U.defVal(opts.isRunning, isRunning);
    this.__chromeLauncher = U.defVal(opts.chromeLauncher, chromeLauncher);
    this.__fs = U.defVal(opts.fs, fs);
    this.__fse = U.defVal(opts.fse, fse);
    this.__cache = U.defVal(opts.cache, cache);
};
module.exports = Commands;
/**
 * Command to set proxied URL.
 * 
 * @async
 * @method
 * @return {Promise}
 */
Commands.prototype.setProxiedUrl = async function (proxiedUrl) {
    this._config.web.url = proxiedUrl;
    if (this._isHttpProxyLaunched()) {
        this._httpProxy.setUrl(proxiedUrl);
    };
    if (this._isChromeLaunched()) return await this.restartChrome();
    return true;
};
/**
 * Command to launch HTTP proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if HTTP proxy was launched. `false` if
 *  command can't be executed. Causes to not launch HTTP proxy:
 *  - HTTP proxy is launched already.
 *  - Proxied URL isn't specified.
 */
Commands.prototype.launchHttpProxy = async function () {

    if (this._isHttpProxyLaunched()) {
        var msg = "HTTP proxy is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    if (!this._config.web.url) {
        var msg = "HTTP proxy isn't launched because proxied URL is missed";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._httpProxy = this._httpProxy || new this.__HttpProxy({
        port: this._config.proxy.port,
        timeout: this._config.proxy.timeout,
        reconnect: this._config.proxy.reconnect,
        useCache: this._config.cache.use,
        url: this._config.web.url,
        speed: this._config.proxy.speed,
    });
    
    return this._httpProxy
        .start()
        .then(() => {
            if (this._coloredLog) {
                var msg = `HTTP proxy is started on host ${U.hostname.cyan} ` +
                    `and port ${this._httpProxy._port.toString().yellow}`;
            } else {
                var msg = `HTTP proxy is started on host '${U.hostname}' and ` +
                    `port '${this._httpProxy._port}'`;
            };
            this._log(msg);
        })
        .then(() => {
            if (this._isChromeLaunched()) return this.restartChrome();
        })
        .then(() => true);
};
/**
 * Command to stop HTTP proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if HTTP proxy was stopped. `false` if
 *  command can't be executed. Causes to not stop HTTP proxy:
 *  - HTTP proxy isn't launched yet.
 */
Commands.prototype.stopHttpProxy = async function () {

    if (!this._isHttpProxyLaunched()) {
        var msg = "HTTP proxy isn't launched yet";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._httpProxy.stop();
    return true;
};
/**
 * Command to restart HTTP proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if HTTP proxy was restarted. `false` if
 *  command can't be executed. Causes to not restart HTTP proxy are the same as
 *  for command to launch HTTP proxy.
 */
Commands.prototype.restartHttpProxy = function() {
    return this.stopHttpProxy().then(() => this.launchHttpProxy());
};
/**
 * Command to launch global transparent proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if global transparent proxy isn't
 *  launched. `false` if command can't be executed. Causes to not launch
 *  global transparent proxy:
 *  - Global transparent proxy is launched already.
 */
Commands.prototype.launchGlobalProxy = function () {

    if (this._isGlobalProxyLaunched()) {
        var msg = "Global transparent proxy is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._globalProxy = this._globalProxy || new this.__GlobalProxy({
        port: this._config.proxy.globalPort,
        timeout: this._config.proxy.timeout,
        reconnect: this._config.proxy.reconnect,
        installCertificate: this._config.proxy.installCertificate,
        sslCaDir: this._config.proxy.sslCaDir,
        useCache: this._config.cache.use,
        speed: this._config.proxy.speed,
    });

    return this._globalProxy
        .start()
        .then(() => {
            if (this._coloredLog) {
                var msg = `Global transparent proxy is started on ` +
                    `${U.hostname.cyan} and port ` +
                    `${this._config.proxy.globalPort.toString().yellow}`;
            } else {
                var msg = `Global transparent proxy is started on host ` +
                    `'${U.hostname}' and port '${this._config.proxy.globalPort}'`;
            };
            this._log(msg);
        })
        .then(() => {
            if (this._isChromeLaunched()) return this.restartChrome();
        })
        .then(() => true);
};
/**
 * Command to stop global transparent proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if global transparent proxy was stopped.
 *  `false` if command can't be executed. Causes to not stop global transparent
 *  proxy:
 *  - Global transparent proxy isn't launched yet.
 */
Commands.prototype.stopGlobalProxy = async function () {

    if (!this._isGlobalProxyLaunched()) {
        var msg = "Global transparent proxy isn't launched yet";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._globalProxy.stop();
    return true;
};
/**
 * Command to restart global transparent proxy.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if global transparent proxy was restarted.
 *  `false` if command can't be executed. Causes to not restart global
 *  transparent proxy are the same as for command to launch global
 *  transparent proxy.
 */
Commands.prototype.restartGlobalProxy = function() {
    return this.stopGlobalProxy().then(() => this.launchGlobalProxy());
};
/**
 * Command to launch chrome browser.
 *
 * @async
 * @method
 * @arg {object} [opts] - Options.
 * @arg {string[]} [opts.chromeOpts=[]] - Chrome options list.
 * @return {Promise<boolean>} - `true` if chrome browser was launched. `false`
 *  if command can't be executed. Causes to not launch chrome browser:
 *  - HTTP proxy isn't launched yet.
 *  - Chrome browser is launched already.
 */
Commands.prototype.launchChrome = async function (opts) {

    opts = U.defVal(opts, {});
    var chromeOpts = U.defVal(opts.chromeOpts, []);

    if (this._isChromeLaunched()) {
        var msg = "Chrome browser is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    var chromeFlags = [
        "start-maximized",
        "disable-infobars",
        "enable-precise-memory-info",
        "disable-translate",
    ];

    for (var opt of chromeOpts) {
        if (!isOptPresent(opt, chromeFlags)) chromeFlags.push(opt);
    };

    if (this._config.chrome.incognito && !isOptPresent("incognito", chromeFlags)) {
        chromeFlags.push("incognito");
    };

    if (this._isGlobalProxyLaunched()) {
        var proxyOpts = [
            "ignore-certificate-errors",
            `proxy-server=${U.hostname}:${this._config.proxy.globalPort}`,
            `proxy-bypass-list=localhost,127.0.0.1,${U.hostname}`,
        ];
        for (var opt of proxyOpts) {
            if (!isOptPresent(opt, chromeFlags)) chromeFlags.push(opt);
        };
    };

    for (var i = 0; i < chromeFlags.length; i++) {
        if (!chromeFlags[i].startsWith("-")) {
            chromeFlags[i] = "--" + chromeFlags[i];
        };
    };

    var profileDir = temp.path();
    fse.mkdirsSync(profileDir);

    return this.__chromeLauncher.launch({

        startingUrl: this._chromeUrl(),
        userDataDir: profileDir,
        chromeFlags: chromeFlags,
        handleSIGINT: true,

    }).then(chrome => {

        this._chrome = chrome;

        if (this._coloredLog) {
            var msg = `Chrome is launched with PID ` +
                `${chrome.pid.toString().yellow}`;
        } else {
            var msg = `Chrome is launched with PID '${chrome.pid}'`;
        }
        this._log(msg);

        LOG.info("Chrome PID", chrome.pid);
        LOG.info("Chrome debugging port", chrome.port);
        LOG.info("Chrome profile", profileDir);

        return true;
    });
};
/**
 * Command to close chrome browser.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if chrome browser was closed. `false` if
 *  command can't be executed. Causes to not close chrome browser:
 *  - Chrome browser isn't launched yet.
 */
Commands.prototype.closeChrome = async function () {

    if (!this._isChromeLaunched()) {
        var msg = "Chrome browser isn't launched yet";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    await this._chrome.kill();
    this._chrome = null;
    return true;
};
/**
 * Command to restart chrome browser.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if chrome browser was restarted. `false`
 *  if command can't be executed. Causes to not restart chrome browser are the
 *  the same as for command to launch chrome browser.
 */
Commands.prototype.restartChrome = function () {
    return this.closeChrome().then(() => this.launchChrome());
};
/**
 * Command to set proxy speed.
 *
 * @async
 * @method
 * @arg {number} speed - Proxy speed, kb/s.
 * @return {Promise<boolean>} - `true` if proxy speed was set. `false` if
 *  command can't be executed. Causes to not set proxy speed:
 *  - HTTP proxy isn't launched.
 */
Commands.prototype.setProxySpeed = async function (speed) {
    if (!this._checkProxy()) return false;

    if (this._httpProxy) {
        this._httpProxy.setSpeed(speed);
    };
    if (this._globalProxy) {
        this._globalProxy.setSpeed(speed);
    };
    return true;
};
/**
 * Command to reset proxy speed.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if proxy speed was reset. `false` if
 *  command can't be executed. Causes to not reset proxy speed:
 *  - HTTP proxy isn't launched.
 */
Commands.prototype.resetProxySpeed = async function () {
    if (!this._checkProxy()) return false;

    if (this._httpProxy) {
        this._httpProxy.resetSpeed();
    };
    if (this._globalProxy) {
        this._globalProxy.resetSpeed();
    };
    return true;
};
/**
 * Command to enable proxy cache.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if proxy cache wasn't enabled. `false` if
 *  command can't be executed. Causes to not enable proxy cache:
 *  - HTTP proxy isn't launched.
 */
Commands.prototype.enableProxyCache = async function () {
    if (!this._checkProxy()) return false;

    if (this._httpProxy) {
        this._httpProxy.useCache = true;
    };
    if (this._globalProxy) {
        this._globalProxy.useCache = true;
    };
    return true;
};
/**
 * Command to disable proxy cache.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if proxy cache wasn't disabled. `false`
 *  if command can't be executed. Causes to not disable proxy cache:
 *  - HTTP proxy isn't launched.
 */
Commands.prototype.disableProxyCache = async function () {
    if (!this._checkProxy()) return false;

    if (this._httpProxy) {
        this._httpProxy.useCache = false;
    };
    if (this._globalProxy) {
        this._globalProxy.useCache = false;
    };
    return true;
};
/**
 * Command to clear proxy cache.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` when cache will be cleared.
 */
Commands.prototype.clearProxyCache = async function () {
    if (this.__fs.existsSync(this._config.cache.folder)) {
        this.__fse.removeSync(this._config.cache.folder);
    };
    await this.__cache.init({ force: true });
    return true;
};
/**
 * Helper to check whether any proxy is launched.
 *
 * @method
 * @protected
 * @return {boolean} - `true` if proxy exists and launched, `false` otherwise.
 */
Commands.prototype._checkProxy = function () {
    if ((this._isHttpProxyLaunched()) ||
        (this._isGlobalProxyLaunched())) return true;
    var msg = "No one of http or global proxy isn't launched yet";
    if (this._coloredLog) msg = msg.red;
    this._log(msg);
    return false;
};
/**
 * Helper to define whether chrome is launched.
 *
 * @method
 * @protected
 * @return {boolean}
 */
Commands.prototype._isChromeLaunched = function () {
    return !!(this._chrome && this.__isRunning(this._chrome.pid));
};
/**
 * Helper to get URL to open in chrome browser. If HTTP proxy is launched,
 *  it will return proxy URL.
 *
 * @method
 * @protected
 * @return {string} - URL to open chrome.
 */
Commands.prototype._chromeUrl = function () {
    if (this._httpProxy) {
        return _.trim(
            this._httpProxy.url + url.parse(this._config.web.url).pathname, "/");
    } else {
        return this._config.web.url;
    };
};
/**
 * Helper to define whether http proxy is running.
 *
 * @method
 * @protected
 * @return {boolean}
 */
Commands.prototype._isHttpProxyLaunched = function () {
    return !!(this._httpProxy && this._httpProxy.isRunning);
};
/**
 * Helper to define whether global proxy is running.
 *
 * @method
 * @protected
 * @return {boolean}
 */
Commands.prototype._isGlobalProxyLaunched = function () {
    return !!(this._globalProxy && this._globalProxy.isRunning);
};
/**
 * Helper to define whether chrome option is present in options list.
 * 
 * @ignore
 * @function
 * @arg {string} opt - Checking option.
 * @arg {string[]} opts - List of options.
 * @return {boolean}
 */
var isOptPresent = (opt, opts) => {
    var optStart = opt.split("=")[0];
    for (var o of opts) {
        if (o.split("=")[0] === optStart) return true;
    };
    return false;
};
