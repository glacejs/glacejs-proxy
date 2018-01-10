"use strict";
/**
 * Base proxy.
 *
 * @class
 * @abstract
 * @name BaseProxy
 * @arg {object} [opts] - Options.
 * @arg {?number} [opts.speed=null] - Proxy speed, kb/s.
 * @arg {?number} [opts.reqSpeed=null] - Requests speed, kb/s.
 * @arg {?number} [opts.resSpeed=null] - Responses speed, kb/s.
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
    this.reqSpeed = U.defVal(opts.reqSpeed, opts.speed);
    this.resSpeed = U.defVal(opts.resSpeed, opts.speed);
    this.responsesData = null;
    this.useCache = U.defVal(opts.useCache, false);

    this._reconnect = U.defVal(opts.reconnect, 0);
    this._timeout = U.defVal(opts.timeout, 60000);
    this._port = U.defVal(opts.port, 0);
    this._proxy = null;
};
/**
 * Sets proxy speed.
 *
 * @method
 * @arg {number|object} speed - Proxy speed, kb/s.
 * @arg {?number} [speed.req] - Requests speed, kb/s.
 * @arg {?number} [speed.res] - Responses speed, kb/s.
 */
BaseProxy.prototype.setSpeed = function (speed) {
    if (_.isNumber(speed)) {
        this.reqSpeed = this.resSpeed = speed;
    } else {
        if (speed.req !== undefined) this.reqSpeed = speed.req;
        if (speed.res !== undefined) this.resSpeed = speed.res;
    };
};
/**
 * Resets proxy speed.
 *
 * @method
 */
BaseProxy.prototype.resetSpeed = function () {
    this.reqSpeed = this.resSpeed = null;
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
