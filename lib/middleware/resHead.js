"use strict";
/**
 * Middleware to cache responses.
 *
 * @module
 */

var _ = require("lodash");

module.exports = function () {

    var res = this.res;

    var resHead = res.writeHead;
    var resHeader = res.setHeader;

    res.headers = res.headers || {};

    res.writeHead = function (statusCode, statusMsg, headers) {

        if (_.isPlainObject(statusMsg) && !headers) {
            headers = statusMsg;
            statusMsg = undefined;
        };

        if (statusCode) {
            res.statusCode = res.statusCode || statusCode;
        };

        if (statusMsg) {
            res.statusMessage = res.statusMessage || statusMsg;
        };

        if (_.isPlainObject(headers)) {
            _.assign(res.headers, headers);
        };

        return resHead.apply(this, arguments);
    };

    res.setHeader = function(name, value) {
        res.headers[name] = value;
        return resHeader.apply(this, arguments);
    };
};
