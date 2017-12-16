"use strict";

CONF.web.url = "https://yandex.ru";

test("it provides steps to", () => {

    afterChunk(async () => {
        await SS.stopHttpProxy();
        await SS.stopGlobalProxy();
    });

    chunk("start and stop http proxy", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(await SS.stopHttpProxy()).to.be.true;
    });

    chunk("get proxy url", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(SS.getProxyUrl()).to.exist;
    });

    chunk("start and stop global proxy", async () => {
        expect(await SS.startGlobalProxy()).to.true;
        expect(await SS.stopGlobalProxy()).to.be.true;
    });

    chunk("limit and unlimit proxies speed", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(await SS.startGlobalProxy()).to.true;
        expect(SS.limitProxySpeed(32)).to.be.true;
        expect(SS.unlimitProxySpeed()).to.be.true;
    });

    chunk("measure and unmeasure proxy responses", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(await SS.startGlobalProxy()).to.true;
        expect(SS.measureResponses()).to.be.true;
        expect(SS.unmeasureResponses()).to.be.true;
    });

    chunk("get responses data", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(await SS.startGlobalProxy()).to.true;
        expect(SS.measureResponses()).to.be.true;
        expect(() => SS.getResponsesData()).to.throw("data are absent");
    });

    chunk("enable and disable cache", async () => {
        expect(await SS.startHttpProxy()).to.not.be.false;
        expect(await SS.startGlobalProxy()).to.true;
        expect(SS.enableCache()).to.be.true;
        expect(SS.disableCache()).to.be.true;
    });
});
