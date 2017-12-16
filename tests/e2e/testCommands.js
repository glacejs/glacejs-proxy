"use strict";

var Commands = require("../../lib").Commands;
var CONF = require("../../lib").config;

CONF.web.url = "https://yandex.ru";
var cmd = new Commands(CONF);

test("chrome", () => {

    afterChunk(async () => {
        await cmd.closeChrome();
        await cmd.stopGlobalProxy();
    });

    chunk("is launched and closed", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.closeChrome()).to.be.true;
    });

    chunk("can't be launched if it's already", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.launchChrome()).to.be.false;
    });

    chunk("can't be closed if it's already", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.closeChrome()).to.be.true;
        expect(await cmd.closeChrome()).to.be.false;
    });

    chunk("is restarted", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
    });

    chunk("is launched with global proxy", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.launchChrome()).to.be.true;
    });
});

test("http proxy", () => {

    afterChunk(async () => {
        await cmd.closeChrome();
        await cmd.stopHttpProxy();
    });

    chunk("is launched and stopped", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.stopHttpProxy()).to.be.true;
    });

    chunk("changes chrome url", async () => {
        expect(cmd._chromeUrl()).to.be.equal(CONF.web.url);
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(cmd._chromeUrl()).to.not.be.equal(CONF.web.url);
    });

    chunk("is launched with chrome restart", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.launchHttpProxy()).to.be.true;
    });

    chunk("is stopped with chrome restart", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.stopHttpProxy()).to.be.true;
    });

    chunk("can't be launched if it's already", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.launchHttpProxy()).to.be.false;
    });

    chunk("can't be stopped if it's already", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.stopHttpProxy()).to.be.true;
        expect(await cmd.stopHttpProxy()).to.be.false;
    });

    chunk("is restarted", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.restartHttpProxy()).to.be.true;
    });

    chunk("with proxied url update", async () => {
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.setProxiedUrl("https://github.com")).to.be.true;
    });
});

test("global proxy", () => {

    afterChunk(async () => {
        await cmd.closeChrome();
        await cmd.stopGlobalProxy();
    });

    chunk("is launched and stopped", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.stopGlobalProxy()).to.be.true;
    });

    chunk("is launched with chrome restart", async () => {
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.launchGlobalProxy()).to.be.true;
    });

    chunk("is stopped with chrome restart", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.launchChrome()).to.be.true;
        expect(await cmd.stopGlobalProxy()).to.be.true;
    });

    chunk("can't be launched if it's already", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.launchGlobalProxy()).to.be.false;
    });

    chunk("can't be stopped if it's already", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.stopGlobalProxy()).to.be.true;
        expect(await cmd.stopGlobalProxy()).to.be.false;
    });

    chunk("is restarted", async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.restartGlobalProxy()).to.be.true;
    });
});

test("proxies", () => {

    beforeChunk(async () => {
        expect(await cmd.launchGlobalProxy()).to.be.true;
        expect(await cmd.launchHttpProxy()).to.be.true;
        expect(await cmd.launchChrome()).to.be.true;
    });

    afterChunk(async () => {
        await cmd.closeChrome();
        await cmd.stopHttpProxy();
        await cmd.stopGlobalProxy();
    });

    chunk("speed is limited and unlimited", async () => {
        expect(await cmd.setProxySpeed(32)).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
        expect(await cmd.resetProxySpeed()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
    });

    chunk("cache is enabled and disabled", async () => {
        expect(await cmd.enableProxyCache()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
        expect(await cmd.disableProxyCache()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
    });

    chunk("cache is cleared", async () => {
        expect(await cmd.enableProxyCache()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
        expect(await cmd.clearProxyCache()).to.be.true;
        expect(await cmd.restartChrome()).to.be.true;
    });
});