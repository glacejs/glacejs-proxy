"use strict";

var BaseProxy = require("../../lib/baseProxy");
var Steps = require("../../lib").Steps;

scope("Steps", () => {
    var ctx;

    beforeChunk(() => {
        ctx = {};
    });

    test(".limitProxySpeed()", () => {

        beforeChunk(() => {
            ctx.limitProxySpeed = Steps.limitProxySpeed;
            ctx.httpProxy = new BaseProxy();
            ctx.globalProxy = new BaseProxy();
            ctx._checkProxy = sinon.spy();
        });

        chunk("limits both speeds", () => {
            ctx.limitProxySpeed(5);
            expect(ctx._checkProxy.calledOnce).to.be.true;
        });

        chunk("limits req speed", () => {
            ctx.limitProxySpeed({ req: 5 });
        });

        chunk("limits res speed", () => {
            ctx.limitProxySpeed({ res: 5 });
        });
    });

    test(".unlimitProxySpeed()", () => {

        beforeChunk(() => {
            ctx.limitProxySpeed = Steps.limitProxySpeed;
            ctx.unlimitProxySpeed = Steps.unlimitProxySpeed;
            ctx.httpProxy = new BaseProxy();
            ctx.globalProxy = new BaseProxy();
            ctx._checkProxy = sinon.spy();
        });

        chunk("unlimits both speeds", () => {
            ctx.limitProxySpeed(5);
            ctx.unlimitProxySpeed();
        });
    });
});
