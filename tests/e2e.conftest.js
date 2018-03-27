"use strict";

var glace = require("glace-core");

var Commands = require("../lib").Commands;
var CONF = require("../lib").config;

CONF.web.url = "https://yandex.ru";
var cmd = new Commands(CONF);

var glaceTest = global.test;
global.test = (name, opts, fixtures, func) => {

    if (opts instanceof Function) {
        func = opts;
        opts = {};
        fixtures = [];
    }
    if (fixtures instanceof Function) {
        func = fixtures;
        fixtures = [];
    }
    opts = opts || {};
    fixtures = fixtures || [];

    glaceTest(name, opts, fixtures, ctx => {
        before(async () => {
            await cmd.closeChrome();
            await cmd.stopHttpProxy();
            await cmd.stopGlobalProxy();
        });
        func(ctx);
    });
};

glace.Steps.register({

    launch_chrome: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.launchChrome()).to.be.true;
    },

    close_chrome: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.closeChrome()).to.be.true;
    },
    
    restart_chrome: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.restartChrome()).to.be.true;
    },

    launch_global_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.launchGlobalProxy()).to.be.true;
    },

    stop_global_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.stopGlobalProxy()).to.be.true;
    },

    restart_global_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.restartGlobalProxy()).to.be.true;
    },

    launch_http_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.launchHttpProxy()).to.be.true;
    },

    stop_http_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.stopHttpProxy()).to.be.true;
    },

    restart_http_proxy: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.restartHttpProxy()).to.be.true;
    },

    set_proxied_url: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.setProxiedUrl("https://github.com")).to.be.true;
    },

    set_proxy_speed: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.setProxySpeed(32)).to.be.true;
    },

    reset_proxy_speed: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.resetProxySpeed()).to.be.true;
    },

    enable_proxy_cache: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.enableProxyCache()).to.be.true;
    },

    disable_proxy_cache: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.disableProxyCache()).to.be.true;
    },

    clear_proxy_cache: async function () {
        if (this.isTestFailed()) return;
        expect(await cmd.clearProxyCache()).to.be.true;
    },
});
