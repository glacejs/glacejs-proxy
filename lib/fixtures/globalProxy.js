"use strict";

const U = require("glace-utils");

const beforeCb = ctx => async () => {
    ctx.isStarted = await $.startGlobalProxy();
};

const afterCb = ctx => async () => {
    if (!ctx.isStarted) return;
    await $.stopGlobalProxy();
};

/**
 * Fixture to launch global proxy.
 * 
 * @global
 * @function
 * @arg {function} func - Test funciton.
 */
module.exports = U.makeFixture({ before: beforeCb, after: afterCb });
