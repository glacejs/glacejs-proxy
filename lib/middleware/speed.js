"use strict";
/**
 * Middleware to manage responses speed.
 *
 * @module
 */

var changeResponsesSpeed = module.exports = function () {

    if (this.speed == null) return;

    var res = this.res;
    var req = this.req;
    var timer = 125;
    var size = Math.ceil(this.speed * 16);
    var prms = Promise.resolve();

    var resWrite = res.write;
    var resEnd = res.end;

    var promisify = args => {

        var chunk = args[0];
        if (!chunk) return;

        for (var i = 0; i < chunk.length; i += size) {
            prms = prms.then((idx => () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        args[0] = chunk.slice(idx, idx + size);
                        resWrite.apply(res, args);
                        resolve();
                    }, timer);
                });
            })(i));
        };
    };

    res.write = function () {
        if (size === 0) return; // reject responses if speed is zero
        promisify(Array.from(arguments));
    };

    res.end = function () {
        if (size === 0) return; // reject responses if speed is zero
        var args = Array.from(arguments);
        promisify(args);

        prms.then(() => {
            args[0] = null;
            resEnd.apply(res, args);
        });
    };

    return false;
};
