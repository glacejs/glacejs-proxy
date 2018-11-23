"use strict";

const U = require("glace-utils");

const beforeCb = ctx => async () => {
    ctx.isStarted = await $.startHttpProxy();
};

const afterCb = ctx => async () => {
    if (!ctx.isStarted) return;
    await $.stopHttpProxy();
};

/**
 * Fixture to launch http proxy.
 * 
 * @global
 * @function
 * @arg {function} func - Test funciton.
 */
module.exports = U.makeFixture({ before: beforeCb, after: afterCb });
