"use strict";
/**
 * `GlaceJS` proxy runner.
 *
 * @module
 */

require("./help");

var U = require("glace-utils");

var Commands = require("./commands");
var CONF = require("./config");
var interactive = require("./interactive");
/**
 * Proxy runner.
 *
 * @function
 * @arg {Commands} cmd - Commands.
 * @return {Promise<void>}
 */
module.exports.run = cmd => {
    cmd = U.defVal(cmd,
        new Commands(CONF, { logger: console.log, colored: true }));

    return Promise
        .resolve()
        .then(() => {
            if (CONF.proxy.global) return cmd.launchGlobalProxy();
        })
        .then(() => {
            if (CONF.proxy.http) return cmd.launchHttpProxy();
        })
        .then(() => {
            if (CONF.chrome.launch) return cmd.launchChrome();
        })
        .then(() => interactive(cmd))
        .catch(U.exit("Promise error"));
};

process.on("uncaughtException", U.exit("Uncaught Exception"));
process.on("unhandledRejection", U.exit("Unhandled Rejection"));
