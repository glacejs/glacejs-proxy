"use strict";
/**
 * Http Proxy classes and functions.
 *
 * @module
 */

var fs = require("fs");
var os = require("os");
var http = require("http");
var https = require("https");
var url = require("url");
var util = require("util");
var path = require("path");

require("colors");
var _ = require("lodash");
var expect = require("chai").expect;
var express = require("express");
var httpProxy = require("http-proxy");
var U = require("glacejs-utils");

var CONF = require("./config");
var BaseProxy = require("./baseProxy");
var cache = require("./middleware/cache");
var middleware = require("./middleware");
/**
 * Http Proxy.
 *
 * @class
 * @arg {object} opts - Proxy options.
 * @arg {string} opts.url - URL which should be proxied.
 *  them from cache.
 */
var HttpProxy = module.exports = function (opts) {

    BaseProxy.call(this, opts);
    this.url = null;

    this._initUrl = null;
    this._server = null;
    this._proxyOptions = {};

    this._proxy = httpProxy.createProxyServer();

    this._proxy.on('proxyReq', (proxyReq, req, res, options) => {
        if (req.body) proxyReq.end(req.body);
    });

    this._proxy.on("error", (err, req, res) => {
        if (req._reconnect > 0 && !req.socket.destroyed) {
            logger.warn("Request reconnected", U.getReqKey(req));
            req._reconnect--;
            this._proxy.web(req, res);
        } else {
            logger.error(U.getReqKey(req), err);
        };
    });

    this.setUrl(opts.url);

    var app = express();
    app.use(async (req, res) => {

        this.req = req;
        if (this.req._reconnect === undefined) {
            this.req._reconnect = this._reconnect;
        };
        this.res = res;

        for (var mw of middleware) if (await mw.call(this)) return;

        delete this.req;
        delete this.res;

        this._proxy.web(req, res, this._proxyOptions);
    });
    this._server = http.createServer(app);
};
util.inherits(HttpProxy, BaseProxy);
/**
 * Sets proxied URL.
 *
 * @method
 * @arg {string} targetUrl - URL which should be proxied.
 */
HttpProxy.prototype.setUrl = function (targetUrl) {
    this._initUrl = targetUrl;
    var parsedUrl = url.parse(targetUrl);

    expect(["http:", "https:"],
           "Unsupported protocol").include(parsedUrl.protocol);

    // FIXME work around bug in `node-http-proxy`: https://github.com/nodejitsu/node-http-proxy/pull/1074
    this._proxy.options = { proxyTimeout: this._timeout };

    if (parsedUrl.protocol === "https:") {

        this._proxyOptions = {
            target: "https://" + parsedUrl.host,
            agent: https.globalAgent,
            headers: { host: parsedUrl.hostname },
        };
    } else {

        this._proxyOptions = {
            target: {
                host: parsedUrl.hostname,
                port: parsedUrl.port,
            },
        };
    };
};
/**
 * Starts proxy server if it’s not started yet.
 *
 * @method
 */
HttpProxy.prototype.start = function () {
    return new Promise((resolve, reject) => {

        this._server.listen(this._port, err => {
            if (err) return reject(err);

            this._port = this._server.address().port;
            this.url = `http://${U.hostname}:${this._port}`;

            this.isRunning = true;
            resolve();
        });
    })
    .then(() => cache.init())
    .then(() => this.url);
};
/**
 * Stops proxy server if it’s not stopped yet.
 *
 * @method
 */
HttpProxy.prototype.stop = function () {
    if (!this.isRunning) return;
    this._server.close();
    this._proxy.close();
    this.proxyUrl = null;
    this.isRunning = false;
};
