"use strict";
/**
 * Configures `GlaceJS` proxy before run.
 *
 * @module
 */

var path = require("path");

var _ = require("lodash");
const expect = require("chai").expect;
var U = require("glace-utils");

/* Set up default config */

/**
 * Contains `GlaceJS` proxy configuration.
 * 
 * @namespace GlaceConfig
 * @prop {?string} [url=null] - Proxied URL.
 * @prop {object} cache - Cache config.
 * @prop {number} [cache.ttl] - Time to life cache. Default is maximum.
 * @prop {number} [cache.size] - Maximum cached file size. Default is 10 GB.
 * @prop {boolean} [cache.use=false] - Use cache.
 * @prop {boolean} [cache.existing=false] - Use existing cache if exists.
 * @prop {boolean} [cache.folder=cwd/.proxy-cache] - Cache folder.
 * @prop {object} chrome - Chrome config.
 * @prop {boolean} [chrome.launch=false] - Launch chrome browser.
 * @prop {boolean} [chrome.incognito=false] - Use incognito mode in chrome.
 * @prop {object} log - Log config.
 * @prop {string} [log.level=debug] - Log level.
 * @prop {string} [log.path=cwd/glace-proxy.log] - Log file path.
 * @prop {boolean} [log.stdout=false] - Print log messages to terminal.
 * @prop {object} proxy - Proxy config.
 * @prop {number} [proxy.timeout=60000] - Proxy time to wait for remote response, ms.
 * @prop {number} [proxy.http=false] - Launch http proxy.
 * @prop {number} [proxy.port=0] - Proxy port. By default will be assigned by OS.
 * @prop {boolean} [proxy.global=false] - Launch global proxy.
 * @prop {number} [proxy.globalPort=8888] - Global proxy port.
 * @prop {boolean} [proxy.installCertificates] - Install global proxy certificates
 *  as trusted. Windows only. Admin privileges are required.
 * @prop {number} [proxy.reconnect=2] - Number of reconnect attemptions if
 *  remote side breaks connection.
 */
var config = _.merge(U.config, {
    cache: {
        ttl: Number.MAX_SAFE_INTEGER,
        size: 10 * 1024 * 1024 * 1024
    },
    chrome: {
    },
    log: {
        level: "debug",
    },
    proxy: {
        timeout: 60000,
    },
});
var args = config.args;
config.report = U.defVal(config.report, {});
config.report.dir = U.defVal(config.report.dir, U.cwd);
config.cluster = U.defVal(config.cluster, {});
/* Use CLI arguments */
config.web = U.defVal(config.web, {});
config.web.url = args.webUrl;  // proxied URL

config.proxy.http = !!args.httpProxy;  // default is `false`
config.proxy.port = args.httpProxyPort || 0;  // default is random
if (config.cluster.slavesNum) {
    expect(config.proxy.port,
        "`--http-proxy-port` is incompatible with `--slaves`").to.be.equal(0);
}
config.proxy.global = !!args.globalProxy;  //default `false`
config.proxy.globalPort = args.globalProxyPort || 0;  // default is random
if (config.cluster.slavesNum) {
    expect(config.proxy.globalPort,
        "`--global-proxy-port` is incompatible with `--slaves`").to.be.equal(0);
}
config.proxy.speed = args.speed;  // default unlimited
config.proxy.installCertificate = !!args.installCertificate;  //default `false`
config.proxy.sslCaDir = path.resolve(config.report.dir, U.defVal(args.sslCaDir, ".certificates"));
config.proxy.reconnect = args.reconnect || 2;  // TODO maybe to make as CLI option

config.cache.use = !!args.cache || !!args.existingCache;  // default `false`
config.cache.existing = !!args.existingCache;  // default `false`
config.cache.folder = path.resolve(config.report.dir, U.defVal(args.cacheFolder, ".proxy-cache"));

config.chrome.launch = !!args.chrome;  // default `false`
config.chrome.incognito = !!args.chromeIncognito;  // default `false`

module.exports = config;
