"use strict";
/**
 * Middleware to cache responses.
 *
 * @module
 */

var fs = require("fs");

var cacheManager = require("cache-manager");
var fse = require("fs-extra");
var fsStore = require("cache-manager-fs");
var U = require("glace-utils");

var CONF = require("../config");

var LOG = U.logger;

if (!CONF.cache.existing && fs.existsSync(CONF.cache.folder)) {
    fse.removeSync(CONF.cache.folder);
};
fse.mkdirsSync(CONF.cache.folder);

var diskCache;

var inited;
var init = opts => {

    opts = U.defVal(opts, {});
    opts.force = U.defVal(opts.force, false);

    if (!inited || opts.force) {
        inited = new Promise(resolve => {

            var fillcb = null;
            if (CONF.cache.existing) fillcb = resolve;

            diskCache = cacheManager.caching({
                store: fsStore,
                options: {
                    ttl: CONF.cache.ttl,
                    maxsize: CONF.cache.size,
                    path: CONF.cache.folder,
                    preventfill: !CONF.cache.existing,
                    fillcallback: fillcb } });

            if (!CONF.cache.existing) resolve();
        });
    };
    return inited;
};
init();
/**
 * Middleware to cache server responses and reply them.
 *
 * @function
 * @this BaseProxy
 * @return {boolean} - `true` if response was retrieved from cache, `false`
 *  otherwise.
 */
var cache = module.exports = async function () {
    if (!this.useCache) return false;
    if (!diskCache) return false;

    for (var skipped of cache.skipped.req) {
        if (skipped(this.req)) return false;
    };

    var req = this.req;
    var res = this.res;

    var result;
    if (await fromCache(req, res)) {
        result = true;
    } else {
        toCache(req, res);
        result = false;
    };
    return result;
};
/**
 * @prop {object} skipped - Filters to skip caching.
 * @prop {function[]} [skipped.req=[]] - List of filters to skip by request.
 * @prop {function[]} [skipped.res=[]] - List of filters to skip by response.
 */
cache.skipped = { req: [], res: [] };
/**
 * Initializes cache. Does nothing if it is initialized already and no force option.
 *
 * @function
 * @arg {object} [opts] - Initialization options.
 * @arg {boolean} [opts.force=false] - Force reinitialize cache.
 * @return {Promise}
 */
cache.init = init;
/**
 * Patches http response to send response from cache, if it is there.
 *
 * @function
 * @arg {object} req - http(s) request
 * @arg {object} res - http(s) response
 * @return {Promise.<boolean>} - `true` if response is in cache and
 *  was patched, otherwise `false`
 */
var fromCache = (req, res) => {
    return new Promise((resolve, reject) => {

        diskCache.get(U.getReqKey(req), (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

    }).then(cached => {
        if (!cached) return false;

        LOG.silly("[cache] <<<<", U.getReqKey(req));
        var response = JSON.parse(cached);

        res.writeHead(response.code, response.headers);
        res.end(Buffer.from(response.data));

        return true;
    });
};
/**
 * Patches http response to put response to cache.
 *
 * @function
 * @arg {object} req - http(s) request
 * @arg {object} res - http(s) response
 */
var toCache = (req, res) => {

    var resWrite = res.write;
    var resEnd = res.end;

    var chunks = [];

    res.write = function (chunk) {
        if (chunk instanceof Buffer) chunks.push(chunk);
        resWrite.apply(this, arguments);
    };

    res.end = function (chunk) {
        if (chunk instanceof Buffer) chunks.push(chunk);
        var data = Buffer.concat(chunks).toJSON().data;

        if (res.statusCode !== 200 || data.length === 0) {
            return resEnd.apply(this, arguments);
        };

        for (var skipped of cache.skipped.res) {
            if (skipped(res)) {
                return resEnd.apply(this, arguments);
            };
        };

        var resData = JSON.stringify({ data: data,
            code: res.statusCode,
            headers: res.headers });

        LOG.silly("[cache] >>>>", U.getReqKey(req));
        diskCache.set(U.getReqKey(req), resData);

        resEnd.apply(this, arguments);
    };
};
