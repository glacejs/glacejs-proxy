"use strict";

var pluginHelp = require("../../lib").pluginHelp;

test("plugin help contains option", () => {

    var opts = pluginHelp({ options: opts => opts }, d => d);

    chunk("http-proxy", () => {
        expect(opts["http-proxy"]).to.exist;
    });

    chunk("http-proxy-port", () => {
        expect(opts["http-proxy-port"]).to.exist;
    });

    chunk("global-proxy", () => {
        expect(opts["global-proxy"]).to.exist;
    });

    chunk("global-proxy-port", () => {
        expect(opts["global-proxy-port"]).to.exist;
    });

    chunk("install-certificate", () => {
        expect(opts["install-certificate"]).to.exist;
    });

    chunk("cache", () => {
        expect(opts["cache"]).to.exist;
    });

    chunk("existing-cache", () => {
        expect(opts["existing-cache"]).to.exist;
    });

    chunk("reconnect", () => {
        expect(opts["reconnect"]).to.exist;
    });
});
