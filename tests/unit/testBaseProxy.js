"use strict";

var BaseProxy = require("../../lib/baseProxy");

scope("BaseProxy", () => {
    var proxy;

    beforeChunk(() => {
        proxy = new BaseProxy();
        expect(proxy.reqSpeed).to.not.exist;
        expect(proxy.resSpeed).to.not.exist;
    });

    test("base proxy instance", () => {

        chunk("set both speed", () => {
            proxy = new BaseProxy({ speed: 5 });
            expect(proxy.reqSpeed).to.be.equal(5);
            expect(proxy.resSpeed).to.be.equal(5);
        });

        chunk("set req speed only", () => {
            proxy = new BaseProxy({ reqSpeed: 5 });
            expect(proxy.reqSpeed).to.be.equal(5);
        });

        chunk("set res speed only", () => {
            proxy = new BaseProxy({ resSpeed: 5 });
            expect(proxy.resSpeed).to.be.equal(5);
        });

        chunk("set res & res speed separately even speed option present", () => {
            proxy = new BaseProxy({ speed: 3, reqSpeed: 4, resSpeed: 5 });
            expect(proxy.reqSpeed).to.be.equal(4);
            expect(proxy.resSpeed).to.be.equal(5);
        });
    });

    test(".setSpeed()", () => {

        chunk("for both speeds", () => {
            proxy.setSpeed(5);
            expect(proxy.reqSpeed).to.be.equal(5);
            expect(proxy.resSpeed).to.be.equal(5);
        });

        chunk("for req speed", () => {
            proxy.setSpeed({ req: 5 });
            expect(proxy.reqSpeed).to.be.equal(5);
            expect(proxy.resSpeed).to.not.exist;
        });

        chunk("for res speed", () => {
            proxy.setSpeed({ res: 5 });
            expect(proxy.reqSpeed).to.not.exist;
            expect(proxy.resSpeed).to.be.equal(5);
        });

        chunk("to zero for both speeds", () => {
            proxy.setSpeed({ req: 0, res: 0 });
            expect(proxy.reqSpeed).to.be.equal(0);
            expect(proxy.resSpeed).to.be.equal(0);
        });
    });

    test(".resetSpeed()", () => {

        chunk("resets both speeds", () => {
            proxy.setSpeed(5);
            proxy.resetSpeed();
            expect(proxy.reqSpeed).to.be.null;
            expect(proxy.resSpeed).to.be.null;
        });
    });
});
