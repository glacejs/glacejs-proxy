"use strict";
/**
 * Commands to manage `GlaceJS` proxy.
 *
 * @module
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
var U = require("glacejs-utils");

var cache = require("./middleware/cache");
var GlobalProxy = require("./globalProxy");
var HttpProxy = require("./httpProxy");
var logger = require("./logger");
/**
 * Creates commands instance.
 *
 * @class
 * @arg {object} config - Commands config.
 * @arg {object} [opts] - Commands options.
 * @arg {function} [opts.logger] - Commands logger. Default is system logger.
 * @arg {boolean} [opts.colored=false] - Flag to use ANSI color in log message.
 */
var Commands = module.exports = function (config, opts) {
    this._config = config;

    opts = U.defVal(opts, {});
    this._log = U.defVal(opts.logger, logger.info.bind(logger));
    this._coloredLog = U.defVal(opts.colored, false);

    this._chrome = null;
    this._httpProxy = null;
    this._globalProxy = null;
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

    if (this._httpProxy && this._httpProxy.isRunning) {
        var msg = "HTTP proxy is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    if (!this._config.url) {
        var msg = "Proxied URL isn't specified";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._httpProxy = new HttpProxy({
        port: this._config.proxy.port,
        timeout: this._config.proxy.timeout,
        reconnect: this._config.proxy.reconnect,
        useCache: this._config.cache.use,
        url: this._config.url,
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
            return true;
        });
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
    if (!this._checkProxy()) return false;
    this._httpProxy.stop();
    this._httpProxy = null;
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
Commands.prototype.restartHttpProxy = async function() {
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

    if (this._globalProxy && this._globalProxy.isRunning) {
        var msg = "Global transparent proxy is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._globalProxy = new GlobalProxy({
        port: this._config.proxy.globalPort,
        timeout: this._config.proxy.timeout,
        reconnect: this._config.proxy.reconnect,
        installCertificate: this._config.installCertificate,
        rootPath: this._config.rootPath,
        useCache: this._config.cache.use,
        speed: this._config.speed,
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
            return true;
        });
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

    if (this._globalProxy && this._globalProxy.isRunning) {
        var msg = "Global transparent proxy isn't launched yet";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    this._globalProxy.stop();
    this._globalProxy = null;
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
Commands.prototype.restartGlobalProxy = async function() {
    return this.stopGlobalProxy().then(() => this.launchGlobalProxy());
};
/**
 * Command to launch chrome browser.
 *
 * @async
 * @method
 * @return {Promise<boolean>} - `true` if chrome browser was launched. `false`
 *  if command can't be executed. Causes to not launch chrome browser:
 *  - HTTP proxy isn't launched yet.
 *  - Chrome browser is launched already.
 */
Commands.prototype.launchChrome = async function () {

    if (this._isChromeLaunched()) {
        var msg = "Chrome browser is launched already";
        if (this._coloredLog) msg = msg.red;
        this._log(msg);
        return false;
    };

    var chromeFlags = [
        "--start-maximized",
        "--disable-infobars",
        "--enable-precise-memory-info",
        "--disable-translate",
    ];

    if (this._config.chrome.incognito) {
        chromeFlags.push("--incognito");
    };

    if (this._config.proxy.global) {
        chromeFlags = chromeFlags.concat([
            "--ignore-certificate-errors",
            `--proxy-server=${U.hostname}:${this._config.proxy.globalPort}`,
            `--proxy-bypass-list=localhost,127.0.0.1,${U.hostname}`,
        ]);
    };

    var profileDir = temp.path();
    fse.mkdirsSync(profileDir);

    return chromeLauncher.launch({

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

        logger.info("Chrome PID", chrome.pid);
        logger.info("Chrome debugging port", chrome.port);
        logger.info("Chrome profile", profileDir);

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

    this._chrome.kill();
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
Commands.prototype.restartChrome = async function () {
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
    if (this._globalProxy) {
        this._globalProxy.setSpeed(speed);
    };
    this._httpProxy.setSpeed(speed);
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
    if (this._globalProxy) {
        this._globalProxy.resetSpeed();
    };
    this._httpProxy.resetSpeed();
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
    if (this._globalProxy) {
        this._globalProxy.useCache = true;
    };
    this._httpProxy.useCache = true;
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
    if (this._globalProxy) {
        this._globalProxy.useCache = false;
    };
    this._httpProxy.useCache = false;
    return true;
};
/**
 * Command to clear proxy cache.
 *
 * @async
 * @method
 * @return {Promise}
 */
Commands.prototype.clearProxyCache = async function () {
    if (fs.existsSync(this._config.cache.folder)) {
        fse.removeSync(this._config.cache.folder);
    };
    await cache.init({ force: true });
};
/**
 * Helper to check whether any proxy is launched.
 *
 * @method
 * @protected
 * @return {boolean} - `true` if proxy exists and launched, `false` otherwise.
 */
Commands.prototype._checkProxy = function () {
    if ((this._httpProxy && this._httpProxy.isRunning) ||
        (this._globalProxy && this._globalProxy.isRunning)) return true;
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
 */
Commands.prototype._isChromeLaunched = function () {
    return this._chrome && isRunning(this._chrome.pid);
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
    if (this._proxy) {
        return _.trim(
            this._proxy.url + url.parse(this._config.url).pathname, "/");
    } else {
        return this._config.url;
    };
};
