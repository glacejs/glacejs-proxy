"use strict";
/**
 * Base proxy.
 *
 * @class
 * @abstract
 * @name BaseProxy
 * @arg {object} [opts] - Options.
 * @arg {?number} [opts.speed=null] - Proxy speed, kb/s.
 * @arg {boolean} [opts.useCache=false] - Flag to use cache middleware.
 * @arg {number} [opts.reconnect=0] - Number of times reconnect to remote
 *  side, if it breaks connection.
 * @arg {timeout} [opts.timeout=60000] - Time to wait remote side response, ms.
 * @arg {port} [opts.port=0] - Port. Default is random.
 */

var _ = require("lodash");
var U = require("glace-utils");

var BaseProxy = function (opts) {
    opts = U.defVal(opts, {});

    this.isRunning = false;
    this.speed = U.defVal(opts.speed);
    this.responsesData = null;
    this.useCache = U.defVal(opts.useCache, false);

    this._reconnect = U.defVal(opts.reconnect, 0);
    this._timeout = U.defVal(opts.timeout, 60000);
    this._port = U.defVal(opts.port, 0);
    this._proxy = null;
};
/**
 * Sets speed of responses from proxy to client.
 *
 * @method
 * @arg {number} speed - Proxy responses speed. kb/s.
 */
BaseProxy.prototype.setSpeed = function (speed) {
    this.speed = speed;
};
/**
 * Resets speed of responses.
 *
 * @method
 */
BaseProxy.prototype.resetSpeed = function () {
    this.speed = null;
};
/**
 * Starts to measure responses and gather information of them.
 *
 * @method
 */
BaseProxy.prototype.measureResponses = function () {
    this.responsesData = [];
};
/**
 * Disables responses measurement.
 *
 * @method
 */
BaseProxy.prototype.unmeasureResponses = function () {
    this.responsesData = null;
};
/**
 * Gets responses data.
 *
 * @method
 */
BaseProxy.prototype.getResponsesData = function () {
    if (this.responsesData === null) return null;
    return _.cloneDeep(this.responsesData);
};
/**
 * Starts proxy.
 *
 * @method
 */
BaseProxy.prototype.start = function () {
    throw new Error("Should be implemented in derived class");
};
/**
 * Stops proxy server.
 *
 * @method
 */
BaseProxy.prototype.stop = function () {
    throw new Error("Should be implemented in derived class");
};

module.exports = BaseProxy;
