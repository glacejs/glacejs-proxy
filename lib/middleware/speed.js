"use strict";
/**
 * Middleware to manage responses speed.
 *
 * @module
 */

var U = require("glace-utils");

var MAX_PACKAGE_SIZE = 8192; // empirical value

var self = module.exports = function () {
    self.__changeReqSpeed(this);
    self.__changeResSpeed(this);
    return false;
};
/**
 * Helper to change requests speed.
 *
 * @ignore
 * @function
 * @arg {BaseProxy} ctx - Proxy instance. 
 */
self.__changeReqSpeed = ctx => {

    if (ctx.reqSpeed == null) return;

    var req = ctx.req;
    var timer = 1000;
    var size = Math.ceil(ctx.reqSpeed * 128);
    var prms = Promise.resolve();

    [size, timer] = self.__balance(size, timer);
    var promisify = self.__promisify(size, timer);

    var emit = req.emit;
    req.emit = function (ev, chunk) {

        if (!["data", "end"].includes(ev)) {
            return emit.apply(this, arguments);
        };

        if (size === 0) return; // reject requests if speed is zero

        prms = promisify(prms, chunk, chk => {
            return emit.call(this, "data", chk);
        });

        if (ev === "end") {
            prms = prms.then(() => {
                return emit.call(this, "end");
            });
        };
        return prms;
    };
};
/**
 * Helper to change responses speed.
 *
 * @ignore
 * @function
 * @arg {BaseProxy} ctx - Proxy instance.
 */
self.__changeResSpeed = ctx => {

    if (ctx.resSpeed == null) return;

    var res = ctx.res;
    var timer = 1000;
    var size = Math.ceil(ctx.resSpeed * 128);
    var prms = Promise.resolve();

    [size, timer] = self.__balance(size, timer);
    var promisify = self.__promisify(size, timer);

    var write = res.write;
    res.write = function () {

        if (size === 0) return; // reject responses if speed is zero

        var args = Array.from(arguments);

        prms = promisify(prms, args[0], chk => {
            args[0] = chk;
            return write.apply(this, args);
        });
        return prms;
    };

    var end = res.end;
    res.end = function () {

        if (size === 0) return; // reject responses if speed is zero

        var args = Array.from(arguments);

        prms = promisify(prms, args[0], chk => {
            args[0] = chk;
            return write.apply(this, args);
        });

        return prms.then(() => {
            args[0] = null;
            return end.apply(res, args);
        });
    };
};
/**
 * Helper to balance data size and throttle time.
 *
 * @ignore
 * @function
 * @arg {number} size - Data size, bytes.
 * @arg {number} timer - Throttle time, ms.
 * @return {number[]} Balanced size and timer.
 */
self.__balance = (size, timer) => { 
    while (size > MAX_PACKAGE_SIZE) {
        size = Math.ceil(size / 2);
        timer = Math.ceil(timer / 2);
    };
    return [size, timer];
};
/**
 * Helper to promisify requests and responses with size and time.
 *
 * @ignore
 * @function
 * @arg {number} size - Data size, bytes.
 * @arg {number} timer - Throttle time, ms.
 * @return {function} Function to promisify request or response.
 */
self.__promisify = (size, timer) => (prms, chunk, cb) => {
    if (!chunk) return prms;

    for (var i = 0; i < chunk.length; i += size) {
        prms = prms
            .then(() => U.sleep(timer))
            .then((idx => () => cb(chunk.slice(idx, idx + size)))(i));
    };
    return prms;
};
