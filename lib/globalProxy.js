"use strict";
/**
 * Creates new instance of `GlobalProxy`.
 *
 * @class
 * @name GlobalProxy
 * @classdesc - Contains methods to run and manage global transparent proxy.
 * @arg {object} [opts] - global proxy options
 * @arg {number} [opts.port=8080] - global proxy port
 * @arg {number} [opts.timeout=0] - global proxy timeout
 * @arg {boolean} [opts.installCertificate=false] - flag to install global
 *  proxy certificate as trusted in order to manage `https` connection or no
 * @arg {?string} [opts.rootPath] - Folder where proxy starts in order to
 *  generate self-signed certificate. By default is `current work directory`.
 * @arg {boolean} [opts.useCache=false] - flag to cache and take from cache responses
 */

var fs = require("fs");
var path = require("path");
var util = require("util");

var expect = require("chai").expect;
var MitmProxy = require("http-mitm-proxy").Proxy;
var spawn = require("cross-spawn");
var U = require("glace-utils");

var BaseProxy = require("./baseProxy");
var cache = require("./middleware/cache");
var middleware = require("./middleware");

var LOG = U.logger;

var _onError = MitmProxy.prototype._onError;
/**
 * Patch mitm proxy error processing, in order to avoid default response
 * finalizing on reconnect.
 *
 * @ignore
 */
MitmProxy.prototype._onError = function (kind, ctx, err) {
    if (!ctx) return _onError.apply(this, arguments);
    var req = ctx.clientToProxyRequest;
    if (req._reconnect > 0 && !req.socket.destroyed) {
        this.onErrorHandlers.forEach(function(handler) {
            return handler(ctx, err, kind);
        });
    } else {
        _onError.apply(this, arguments);
    };
};

var GlobalProxy = function (opts) {

    opts = U.defVal(opts, {});
    BaseProxy.call(this, opts);

    this._installCertificate = U.defVal(opts.installCertificate, false);
    this._sslCaDir = U.defVal(opts.sslCaDir, path.resolve(U.cwd, ".http-mitm-proxy"));
    this._certificatePath = path.resolve(this._sslCaDir, "certs", "ca.pem");

    this._proxy = new MitmProxy();

    this._proxy.onError((ctx, err) => {
        var req = ctx.clientToProxyRequest;
        if (req._reconnect > 0 && !req.socket.destroyed) {
            LOG.warn("Request reconnected", U.getReqKey(req));
            req._reconnect--;
            this._proxy._onHttpServerRequest(ctx.isSSL,
                                             ctx.clientToProxyRequest,
                                             ctx.proxyToClientResponse);
        } else {
            LOG.error(U.getReqKey(req), err);
        };
    });

    this._proxy.onRequest(async (ctx, callback) => {

        this.req = ctx.clientToProxyRequest;
        if (this.req._reconnect === undefined) {
            this.req._reconnect = this._reconnect;
        };
        this.res = ctx.proxyToClientResponse;

        for (var mw of middleware) if (await mw.call(this)) return;

        delete this.req;
        delete this.res;

        return callback();
    });

    // TODO not sure that it works reliable
    this._proxy.onRequestData((ctx, chunk, callback) => {
        if (ctx.clientToProxyRequest.body) {
            chunk = new Buffer("");
        };
        return callback(null, chunk);
    });
    this._proxy.onResponse((ctx, callback) => {
        if (ctx.clientToProxyRequest.body) {
            ctx.proxyToServerRequest.end(ctx.clientToProxyRequest.body);
        };
        return callback(null);
    });
};
util.inherits(GlobalProxy, BaseProxy);
module.exports = GlobalProxy;
/**
 * Starts global proxy if it"s not started yet.
 *
 * @method
 */
GlobalProxy.prototype.start = function () {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {

        this._proxy.listen({ port: this._port,
                             silent: true,
                             sslCaDir: this._sslCaDir,
                             timeout: this._timeout },
                           err => {
                               if (err) reject(err);
                               resolve();
                           });

    }).then(() => cache.init()).then(() => {

        this.isRunning = true;

        if (this._installCertificate) {

            if (process.platform !== "win32") {
                throw new Error("For your platform certificate" +
                                     "installation isn't implemented");
            };
            expect(fs.existsSync(this._certificatePath),
                   `Proxy certificate ${this._certificatePath} is absent`)
                .to.be.true;

            var proc = spawn.sync("certutil", [ "-addstore",
                                                "-enterprise",
                                                "-f", "Root",
                                                this._certificatePath ]);

            if (proc.status !== 0) {
                throw new Error(
                    "Can't install proxy certificate as trusted:\n" +
                    proc.stdout.toString());
            };
        };
    });
};
/**
 * Stops global proxy if it's not stopped yet.
 *
 * @method
 */
GlobalProxy.prototype.stop = function () {
    if (!this.isRunning) return;
    this._proxy.close();
    this.isRunning = false;
};
