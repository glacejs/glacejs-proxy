"use strict";
/**
 * Interactive console interface.
 *
 * @module
 */

var _ = require("lodash");
var vorpal = require("vorpal")();
require("colors");  // should be imported after vorpal
var U = require("glacejs-utils");

var d = U.switchColor();
/**
 * Interactive console.
 *
 * @function
 * @arg {Commands} cmd - Commands instance.
 */
var interactive = module.exports = cmd => {

    vorpal
        .command("chrome")
        .description(d("Launch google chrome browser.",
                       "Pristine profile will be used each time."))
        .action(function (args, cb) {

            return cmd
                .launchChrome()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Chrome browser is launched".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("chrome close")
        .description(d("Close google chrome browser."))
        .action(function (args, cb) {

            return cmd
                .closeChrome()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Chrome browser is closed".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("chrome restart")
        .description(d("Restart google chrome browser.",
                       "Pristine profile will be used each time."))
        .action(function (args, cb) {

            return cmd
                .restartChrome()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Chrome browser is launched".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("proxy speed <speed>")
        .description(d("Limit proxy speed, kb/s."))
        .action(function (args, cb) {

            if (!parseInt(args.speed)) {
                this.log("Speed value should be a number".red);
                return cb();
            };

            return cmd
                .setProxySpeed(args.speed)
                .then(isOk => {
                    if (!isOk) return;
                    this.log(
                        `Proxy speed is limited to ${args.speed} kb/s`.green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("proxy speed reset")
        .description(d("Unlimit proxy speed."))
        .action(function (args, cb) {

            return cmd
                .resetProxySpeed()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Proxy speed is unlimited".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("cache")
        .description(d("Cache server responses to disk.\nCached responses",
                       "will be replayed by proxy."))
        .action(function (args, cb) {

            return cmd
                .enableProxyCache()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Proxy cache is enabled".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("cache disable")
        .description(d("Disable proxy cache."))
        .action(function (args, cb) {

            return cmd
                .disableProxyCache()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Proxy cache is disabled".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    vorpal
        .command("cache clear")
        .description(d("Remove cached responses from storage."))
        .action(function (args, cb) {

            return this.prompt({
                type: "confirm",
                name: "continue",
                default: false,
                message: "Proxy cache will be cleaned. It won't be undo. Continue?".yellow,
            }, result => {
                if (!result.continue) {
                    this.log("Cancelled by user".green);
                    return cb();
                };

                return cmd.clearProxyCache()
                    .then(() => this.log("Proxy cache is cleaned".green))
                    .catch(e => this.log(e))
                    .then(cb);
            });
        });

    vorpal.delimiter(">".red.bold).show();

    var finalize = () => {
        if (cmd._isChromeLaunched()) cmd.closeChrome();
    };

    vorpal.on("client_prompt_submit", name => {
        if (name === "exit") finalize();
    });
};
