"use strict";

var speedMW = require("../../lib").mw.speed;

scope("speed middleware", () => {

    test(".__promisify()", () => {
        var promisify, prms, cb;

        beforeChunk(() => {
            promisify = speedMW.__promisify(1, 1);
            prms = Promise.resolve();
            cb = sinon.spy();
        });

        chunk("returns the same promise if no chunk", () => {
            expect(promisify(prms, null, cb)).to.equal(prms);
        });

        chunk("returns the same promise if no chunk length", () => {
            expect(promisify(prms, new Buffer(""), cb)).to.equal(prms);
        });

        chunk("involve callback if chunk has length", async () => {
            await promisify(prms, new Buffer("a"), cb);
            expect(cb.calledOnce).to.be.true;
        });
    });

    test(".__balance", () => {

        chunk("balances size and time", () => {
            var [size, timer] = speedMW.__balance(10000, 1000);
            expect(size).to.be.equal(5000);
            expect(timer).to.be.equal(500);
        });
    });

    test(".__changeReqSpeed()", () => {
        var req, emit, promisify;

        beforeChunk(() => {
            promisify = sinon.stub().returns(Promise.resolve());
            sinon.stub(speedMW, "__promisify").returns(promisify);

            emit = sinon.spy();
            req = { emit: emit };

            speedMW.__changeReqSpeed({
                req: req,
                reqSpeed: 512,
            });
        });

        afterChunk(() => {
            speedMW.__promisify.restore();
        });

        chunk("doesn't change request if no req speed", () => {
            var emit = sinon.spy();
            var req = { emit: emit };
            speedMW.__changeReqSpeed({ req: req });
            expect(req.emit).to.be.equal(emit);
        });

        chunk("stops request if speed is zero", async () => {
            var emit = sinon.spy();
            var req = { emit: emit };
            speedMW.__changeReqSpeed({ req: req, reqSpeed: 0 });

            await req.emit("data");
            expect(emit.calledOnce).to.be.false;
            expect(promisify.called).to.be.false;
        });

        chunk("just emit origin req event if not data or end event", async () => {
            await req.emit("test");
            expect(emit.calledOnce).to.be.true;
            expect(promisify.called).to.be.false;
        });

        chunk("promisify req event if data event", async () => {
            await req.emit("data");
            expect(emit.called).to.be.false;
            expect(promisify.calledOnce).to.be.true;
        });

        chunk("finalize req event if end event", async () => {
            await req.emit("end");
            expect(emit.called).to.be.true;
            expect(promisify.calledOnce).to.be.true;
        });
    });

    test(".__changeResSpeed()", () => {
        var res, write, end, promisify;

        beforeChunk(() => {
            promisify = sinon.stub().returns(Promise.resolve());
            sinon.stub(speedMW, "__promisify").returns(promisify);

            write = sinon.spy();
            end = sinon.spy();
            res = { write: write, end: end };

            speedMW.__changeResSpeed({
                res: res,
                resSpeed: 512,
            });
        });

        afterChunk(() => {
            speedMW.__promisify.restore();
        });

        chunk("doesn't change request if no req speed", () => {
            var write = sinon.spy();
            var end = sinon.spy();
            var res = { write: write, end: end };
            speedMW.__changeResSpeed({ res: res });
            expect(res.write).to.be.equal(write);
            expect(res.end).to.be.equal(end);
        });

        chunk("stops response if speed is zero", async () => {
            var write = sinon.spy();
            var end = sinon.spy();
            var res = { write: write, end: end };
            speedMW.__changeResSpeed({ res: res, resSpeed: 0 });

            await res.write();
            await res.end();

            expect(write.called).to.be.false;
            expect(end.called).to.be.false;
            expect(promisify.called).to.be.false;
        });

        chunk("promisify response write", async () => {
            await res.write();
            expect(write.called).to.be.false;
            expect(promisify.calledOnce).to.be.true;
        });

        chunk("promisify response end", async () => {
            await res.end();
            expect(end.called).to.be.true;
            expect(promisify.calledOnce).to.be.true;
        });
    });
});
