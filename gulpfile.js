"use strict";
/**
 * Gulp tasks.
 *
 * @module
 */

var gulp = require("gulp");
var clean = require("gulp-clean");
var spawn = require("cross-spawn");

gulp.task("mk-docs", () => {
    spawn.sync("jsdoc", [ "-c", "jsdoc.json", "-d", "docs" ]);
});

gulp.task("rm-docs", () => {
    gulp.src("docs", { read: false }).pipe(clean());
});

gulp.task("test-unit", () => {

    var res = spawn.sync(
        "./tests/run",
        [
            "tests/unit",
        ],
        { stdio: "inherit" });

    if (res.error) {
        console.log(res.error);
        process.exit(1);
    };
    if (res.status) {
        process.exit(res.status);
    };
});

gulp.task("test-e2e", () => {

    var res = spawn.sync(
        "./tests/run",
        [
            "tests/e2e",
        ],
        { stdio: "inherit" });

    if (res.error) {
        console.log(res.error);
        process.exit(1);
    };
    if (res.status) {
        process.exit(res.status);
    };
});
