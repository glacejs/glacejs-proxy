"use strict";

var U = require("glace-utils");
var LOG = U.logger;

var HttpProxy = require("../../lib").HttpProxy;

scope("HttpProxy", () => {
    var httpProxy;

    beforeChunk(() => {
        httpProxy = new HttpProxy({ url: "https://ya.ru" });
        sinon.stub(LOG, "warn");
        sinon.stub(LOG, "error");
    });

    afterChunk(() => {
        LOG.warn.restore();
        LOG.error.restore();
    });

    test(".__onError()", () => {

        beforeChunk(() => {
            sinon.stub(U, "getReqKey");
            sinon.stub(httpProxy._proxy, "web");
            httpProxy._proxyOptions = "proxyOptions";
        });

        afterChunk(() => {
            U.getReqKey.restore();
            httpProxy._proxy.web.restore();
        });

        chunk("sends reconnect if there are attemptions and socket", () => {
            var req = {
                _reconnect: 1,
                socket: { destroyed: false },
            };
            httpProxy.__onError("err", req, "res");
            expect(req._reconnect).to.be.equal(0);
            expect(LOG.warn.calledOnce).to.be.true;
            expect(httpProxy._proxy.web.calledOnce).to.be.true;

            var args = httpProxy._proxy.web.args[0];
            expect(args[0]).to.be.equal(req);
            expect(args[1]).to.be.equal("res");
            expect(args[2]).to.be.equal("proxyOptions");
        });

        chunk("logs error if there is no reconnect attemptions", () => {
            var req = {
                _reconnect: 0,
                socket: { destroyed: false },
            };
            httpProxy.__onError("err", req, "res");
            expect(httpProxy._proxy.web.called).to.be.false;
            expect(LOG.error.calledOnce).to.be.true;
        });

        chunk("logs error if socket is destroyed", () => {
            var req = {
                _reconnect: 1,
                socket: { destroyed: true },
            };
            httpProxy.__onError("err", req, "res");
            expect(httpProxy._proxy.web.called).to.be.false;
            expect(req._reconnect).to.be.equal(1);
            expect(LOG.error.calledOnce).to.be.true;
        });
    });
});
