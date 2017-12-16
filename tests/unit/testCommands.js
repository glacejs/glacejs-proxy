"use strict";

var U = require("glace-utils");

var Commands = require("../../lib").Commands;
var CONF = require("../../lib").config;

scope("commands", () => {
    var cmd;
    
    beforeChunk(() => {
        cmd = new Commands(CONF, { logger: () => {},
                                   isRunning: sinon.stub(),
                                  });
    });

    test(".setProxiedUrl()", () => {

        chunk("updates url in config", async () => {
            var url = "https://yandex.ru";
            expect(CONF.web.url).to.not.be.equal(url);
            expect(await cmd.setProxiedUrl(url)).to.be.true;
            expect(CONF.web.url).to.be.equal(url);
        });

        chunk("updates url in http proxy if it's running", async () => {
            cmd._httpProxy = { isRunning: true,
                                 setUrl: sinon.spy() };
            expect(await cmd.setProxiedUrl()).to.be.true;
            expect(cmd._httpProxy.setUrl.calledOnce).to.be.true;
        });

        chunk("restarts chrome browser if it's running", async () => {
            cmd._chrome = { pid: 1 };
            cmd.__isRunning.returns(true);
            cmd.restartChrome = sinon.stub().returns(true);
            expect(await cmd.setProxiedUrl()).to.be.true;
            expect(cmd.restartChrome.calledOnce).to.be.true;
        });
    });

    test(".launchHttpProxy()", () => {

        beforeChunk(() => {
            CONF.web.url = "https://yandex.ru";
            cmd._isHttpProxyLaunched = sinon.stub().returns(false);
            cmd._httpProxy = null;
        });

        chunk("skipped if http proxy already launched", async () => {
            cmd._isHttpProxyLaunched = sinon.stub().returns(true);
            expect(await cmd.launchHttpProxy()).to.be.false;
        });

        chunk("skipped if proxied url isn't defined", async () => {
            CONF.web.url = null;
            expect(await cmd.launchHttpProxy()).to.be.false;
        });

        chunk("starts new http proxy instance", async () => {
            var proxyOpts;

            CONF.proxy.port = 3000;
            CONF.proxy.timeout = 1000;
            CONF.proxy.reconnect = 10;
            CONF.cache.use = true;
            CONF.proxy.speed = 128;

            cmd.__HttpProxy = function (opts) {
                proxyOpts = opts;
                this.start = () => Promise.resolve();
            };

            expect(await cmd.launchHttpProxy()).to.be.true;
            expect(proxyOpts.port).to.be.equal(3000);
            expect(proxyOpts.timeout).to.be.equal(1000);
            expect(proxyOpts.reconnect).to.be.equal(10);
            expect(proxyOpts.useCache).to.be.true;
            expect(proxyOpts.url).to.be.equal("https://yandex.ru");
            expect(proxyOpts.speed).to.be.equal(128);
        });

        chunk("starts existing http proxy instance", async () => {
            cmd._httpProxy = {
                start: () => Promise.resolve(),
            };

            expect(await cmd.launchHttpProxy()).to.be.true;
        });

        chunk("restarts chrome browser", async () => {
            cmd.__HttpProxy = function () {
                this.start = () => Promise.resolve();
            };
            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.launchHttpProxy()).to.be.true;
            expect(cmd.restartChrome.calledOnce).to.be.true;
        });
    });

    test(".stopHttpProxy()", () => {

        chunk("stops http proxy", async () => {
            cmd._httpProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };
            expect(await cmd.stopHttpProxy()).to.be.true;
            expect(cmd._httpProxy.stop.calledOnce).to.be.true;
        });

        chunk("stops http proxy with chrome restart", async () => {
            cmd._httpProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };

            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.stopHttpProxy()).to.be.true;
            expect(cmd._httpProxy.stop.calledOnce).to.be.true;
            expect(cmd.restartChrome.calledOnce).to.be.true;
        });

        chunk("stops http proxy without chrome restart if flag is set", async () => {
            cmd._httpProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };

            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.stopHttpProxy({ restartChrome: false })).to.be.true;
            expect(cmd._httpProxy.stop.calledOnce).to.be.true;
            expect(cmd.restartChrome.called).to.be.false;
        });

        chunk("is skipped if http proxy isn't launched", async () => {
            expect(await cmd.stopHttpProxy()).to.be.false;
        });
    });

    test(".restartHttpProxy()", () => {

        chunk("restarts http proxy", async () => {
            cmd.stopHttpProxy = sinon.stub().returns(Promise.resolve());
            cmd.launchHttpProxy = sinon.stub().returns(Promise.resolve());
            await cmd.restartHttpProxy();

            expect(cmd.stopHttpProxy.calledOnce).to.be.true;
            expect(cmd.stopHttpProxy.args[0][0].restartChrome).to.be.false;
            expect(cmd.launchHttpProxy.calledOnce).to.be.true;
        });
    });

    test(".launchGlobalProxy()", () => {

        beforeChunk(() => {
            cmd._isGlobalProxyLaunched = sinon.stub().returns(false);
            cmd._globalProxy = null;
        });

        chunk("skipped if global proxy already launched", async () => {
            cmd._isGlobalProxyLaunched = sinon.stub().returns(true);
            expect(await cmd.launchGlobalProxy()).to.be.false;
        });

        chunk("starts new global proxy instance", async () => {
            var proxyOpts;

            CONF.proxy.globalPort = 3000;
            CONF.proxy.timeout = 1000;
            CONF.proxy.reconnect = 10;
            CONF.proxy.installCertificate = true;
            CONF.proxy.sslCaDir = ".";
            CONF.cache.use = true;
            CONF.proxy.speed = 128;

            cmd.__GlobalProxy = function (opts) {
                proxyOpts = opts;
                this.start = () => Promise.resolve();
            };

            expect(await cmd.launchGlobalProxy()).to.be.true;
            expect(proxyOpts.port).to.be.equal(3000);
            expect(proxyOpts.timeout).to.be.equal(1000);
            expect(proxyOpts.reconnect).to.be.equal(10);
            expect(proxyOpts.installCertificate).to.be.true;
            expect(proxyOpts.sslCaDir).to.be.equal(".");
            expect(proxyOpts.useCache).to.be.true;
            expect(proxyOpts.speed).to.be.equal(128);
        });

        chunk("starts existing global proxy instance", async () => {
            cmd._globalProxy = {
                start: () => Promise.resolve(),
            };

            expect(await cmd.launchGlobalProxy()).to.be.true;
        });

        chunk("restarts chrome browser", async () => {
            cmd.__GlobalProxy = function () {
                this.start = () => Promise.resolve();
            };
            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.launchGlobalProxy()).to.be.true;
            expect(cmd.restartChrome.calledOnce).to.be.true;
        });
    });

    test(".stopGlobalProxy()", () => {

        chunk("stops global proxy", async () => {
            cmd._globalProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };
            expect(await cmd.stopGlobalProxy()).to.be.true;
            expect(cmd._globalProxy.stop.calledOnce).to.be.true;
        });

        chunk("stops global proxy with chrome restart", async () => {
            cmd._globalProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };

            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.stopGlobalProxy()).to.be.true;
            expect(cmd._globalProxy.stop.calledOnce).to.be.true;
            expect(cmd.restartChrome.calledOnce).to.be.true;
        });

        chunk("stops global proxy without chrome restart if flag is set", async () => {
            cmd._globalProxy = {
                isRunning: true,
                stop: sinon.spy(),
            };

            cmd._isChromeLaunched = () => true;
            cmd.restartChrome = sinon.spy();

            expect(await cmd.stopGlobalProxy({ restartChrome: false })).to.be.true;
            expect(cmd._globalProxy.stop.calledOnce).to.be.true;
            expect(cmd.restartChrome.called).to.be.false;
        });

        chunk("is skipped if global proxy isn't launched", async () => {
            expect(await cmd.stopGlobalProxy()).to.be.false;
        });
    });

    test(".restartGlobalProxy()", () => {

        chunk("restarts global proxy", async () => {
            cmd.stopGlobalProxy = sinon.stub().returns(Promise.resolve());
            cmd.launchGlobalProxy = sinon.stub().returns(Promise.resolve());
            await cmd.restartGlobalProxy();

            expect(cmd.stopGlobalProxy.calledOnce).to.be.true;
            expect(cmd.stopGlobalProxy.args[0][0].restartChrome).to.be.false;
            expect(cmd.launchGlobalProxy.calledOnce).to.be.true;
        });
    });

    test(".launchChrome()", () => {

        chunk("skipped if chrome is launched already", async () => {
            cmd._isChromeLaunched = () => true;
            expect(await cmd.launchChrome()).to.be.false;
        });

        scope("launches chrome", () => {
            var launchOpts;

            beforeChunk(() => {
                cmd._chromeUrl = sinon.stub();
                cmd.__chromeLauncher = {
                    launch: opts => {
                        launchOpts = opts;
                        return Promise.resolve({ pid: 1, port: 2 });
                    },
                };
            });

            chunk("only", async () => {
                expect(await cmd.launchChrome()).to.be.true;
                expect(cmd._chromeUrl.calledOnce).to.be.true;
                expect(cmd._chrome.pid).to.be.equal(1);
                expect(cmd._chrome.port).to.be.equal(2);
            });

            chunk("in incognito mode if flag is set", async () => {
                CONF.chrome.incognito = true;
                expect(await cmd.launchChrome()).to.be.true;
                expect(launchOpts.chromeFlags).to.include("--incognito");
            });

            chunk("with global proxy options if it's started", async () => {
                CONF.proxy.globalPort = 3333
                cmd._isGlobalProxyLaunched = () => true;
                expect(await cmd.launchChrome()).to.be.true;
                expect(launchOpts.chromeFlags).to.include(
                    `--proxy-server=${U.hostname}:3333`);
            });

            chunk("with custom option", async () => {
                expect(await cmd.launchChrome(
                    { chromeOpts: [ "my-option" ] })).to.be.true;
                expect(launchOpts.chromeFlags).to.include("--my-option");
            });
        });
    });

    test(".closeChrome()", () => {

        chunk("skipped if chrome is closed already", async () => {
            cmd._isChromeLaunched = sinon.stub().returns(false);
            expect(await cmd.closeChrome()).to.be.false;
            expect(cmd._isChromeLaunched.calledOnce).to.be.true;
        });

        chunk("closes chrome", async () => {
            cmd._isChromeLaunched = sinon.stub().returns(true);
            var chrome = cmd._chrome = { kill: sinon.spy() };
            expect(await cmd.closeChrome()).to.be.true;
            expect(cmd._isChromeLaunched.calledOnce).to.be.true;
            expect(cmd._chrome).to.not.exist;
            expect(chrome.kill.calledOnce).to.be.true;
        });
    });

    test(".restartChrome()", () => {
        chunk("restarts chrome", async () => {
            cmd.launchChrome = sinon.stub().returns(Promise.resolve());
            cmd.closeChrome = sinon.stub().returns(Promise.resolve());
            await cmd.restartChrome();

            expect(cmd.launchChrome.calledOnce).to.be.true;
            expect(cmd.closeChrome.calledOnce).to.be.true;
        });
    });

    test(".setProxySpeed()", () => {

        chunk("skipped if not proxy is launched", async () => {
            cmd._checkProxy = sinon.stub().returns(false);
            expect(await cmd.setProxySpeed(10)).to.be.false;
            expect(cmd._checkProxy.calledOnce).to.be.true;
        });

        chunk("sets proxy speed", async () => {
            cmd._checkProxy = sinon.stub().returns(true);
            cmd._httpProxy = { setSpeed: sinon.spy() };
            cmd._globalProxy = { setSpeed: sinon.spy() };

            expect(await cmd.setProxySpeed(10)).to.be.true;
            expect(cmd._checkProxy.calledOnce).to.be.true;
            expect(cmd._httpProxy.setSpeed.calledOnce).to.be.true;
            expect(cmd._httpProxy.setSpeed.args[0][0]).to.be.equal(10);
            expect(cmd._globalProxy.setSpeed.calledOnce).to.be.true;
            expect(cmd._globalProxy.setSpeed.args[0][0]).to.be.equal(10);
        });
    });

    test(".resetProxySpeed()", () => {

        chunk("skipped if not proxy is launched", async () => {
            cmd._checkProxy = sinon.stub().returns(false);
            expect(await cmd.resetProxySpeed()).to.be.false;
            expect(cmd._checkProxy.calledOnce).to.be.true;
        });

        chunk("resets proxy speed", async () => {
            cmd._checkProxy = sinon.stub().returns(true);
            cmd._httpProxy = { resetSpeed: sinon.spy() };
            cmd._globalProxy = { resetSpeed: sinon.spy() };

            expect(await cmd.resetProxySpeed()).to.be.true;
            expect(cmd._checkProxy.calledOnce).to.be.true;
            expect(cmd._httpProxy.resetSpeed.calledOnce).to.be.true;
            expect(cmd._globalProxy.resetSpeed.calledOnce).to.be.true;
        });
    });

    test(".enableProxyCache()", () => {

        chunk("skipped if not proxy is launched", async () => {
            cmd._checkProxy = sinon.stub().returns(false);
            expect(await cmd.enableProxyCache()).to.be.false;
            expect(cmd._checkProxy.calledOnce).to.be.true;
        });

        chunk("enables proxy cache", async () => {
            cmd._checkProxy = sinon.stub().returns(true);
            cmd._httpProxy = {};
            cmd._globalProxy = {};

            expect(await cmd.enableProxyCache()).to.be.true;
            expect(cmd._checkProxy.calledOnce).to.be.true;
            expect(cmd._httpProxy.useCache).to.be.true;
            expect(cmd._globalProxy.useCache).to.be.true;
        });
    });

    test(".disableProxyCache()", () => {

        chunk("skipped if not proxy is launched", async () => {
            cmd._checkProxy = sinon.stub().returns(false);
            expect(await cmd.disableProxyCache()).to.be.false;
            expect(cmd._checkProxy.calledOnce).to.be.true;
        });

        chunk("disables proxy cache", async () => {
            cmd._checkProxy = sinon.stub().returns(true);
            cmd._httpProxy = {};
            cmd._globalProxy = {};

            expect(await cmd.disableProxyCache()).to.be.true;
            expect(cmd._checkProxy.calledOnce).to.be.true;
            expect(cmd._httpProxy.useCache).to.be.false;
            expect(cmd._globalProxy.useCache).to.be.false;
        });
    });

    test(".clearProxyCache()", () => {

        chunk("clears cache", async () => {
            cmd.__fs = { existsSync: sinon.stub().returns(true) };
            cmd.__fse = { removeSync: sinon.spy() };
            cmd.__cache = { init: sinon.spy() };
            CONF.cache.folder = "/path/to/cache";

            expect(await cmd.clearProxyCache()).to.be.true;
            expect(cmd.__fs.existsSync.calledOnce).to.be.true;
            expect(cmd.__fse.removeSync.calledOnce).to.be.true;
            expect(cmd.__fse.removeSync.args[0][0]).to.be.equal("/path/to/cache");
            expect(cmd.__cache.init.calledOnce).to.be.true;
            expect(cmd.__cache.init.args[0][0].force).to.be.true;
        });
    });

    test("._isHttpProxyLaunched()", () => {

        chunk("returns false if http proxy doesn't exit", () => {
            expect(cmd._isHttpProxyLaunched()).to.be.false;
        });

        chunk("returns false if http proxy isn't running", () => {
            cmd._httpProxy = { isRunning: false };
            expect(cmd._isHttpProxyLaunched()).to.be.false;
        });

        chunk("returns true if http proxy is running", () => {
            cmd._httpProxy = { isRunning: true };
            expect(cmd._isHttpProxyLaunched()).to.be.true;
        });
    });

    test("._isGlobalProxyLaunched()", () => {

        chunk("returns false if global proxy doesn't exit", () => {
            expect(cmd._isGlobalProxyLaunched()).to.be.false;
        });

        chunk("returns false if global proxy isn't running", () => {
            cmd._globalProxy = { isRunning: false };
            expect(cmd._isGlobalProxyLaunched()).to.be.false;
        });

        chunk("returns true if global proxy is running", () => {
            cmd._globalProxy = { isRunning: true };
            expect(cmd._isGlobalProxyLaunched()).to.be.true;
        });
    });

    test("._isChromeLaunched()", () => {

        chunk("returns false if chrome doesn't exit", () => {
            expect(cmd._isChromeLaunched()).to.be.false;
        });

        chunk("returns false if chrome isn't running", () => {
            cmd._chrome = { pid: 1 };
            cmd.__isRunning.returns(false);
            expect(cmd._isChromeLaunched()).to.be.false;
        });

        chunk("returns true if chrome is running", () => {
            cmd._chrome = { pid: 1 };
            cmd.__isRunning.returns(true);
            expect(cmd._isChromeLaunched()).to.be.true;
        });
    });

    test("._checkProxy()", () => {

        chunk("returns true if http proxy is running", () => {
            cmd._httpProxy = { isRunning: true };
            expect(cmd._checkProxy()).to.be.true;
        });

        chunk("returns true if global proxy is running", () => {
            cmd._httpProxy = { isRunning: true };
            expect(cmd._checkProxy()).to.be.true;
        });

        chunk("returns false if no proxy is running", () => {
            expect(cmd._checkProxy()).to.be.false;
        });
    });
});
