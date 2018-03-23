"use strict";
/**
 * Interactive console.
 *
 * @function
 * @name interactive
 * @arg {Commands} cmd - Commands instance.
 * @arg {Vorpal} [cli] - Vorpal instance.
 * @return {Vorpal} - Configured Vorpal instance.
 */

var vorpal = require("vorpal")();
var U = require("glace-utils");

// HACK to return colors back after vorpal import.
require("colors");
require("colors/lib/extendStringPrototype")();

var d = U.switchColor();

var interactive = (cmd, cli) => {

    cli = U.defVal(cli, vorpal);

    cli.command("url <url>")
        .description(d("Set proxied URL."))
        .action(function (args, cb) {

            if (!args.url.toString().startsWith("http")) {
                this.log("Invalid URL".red);
                return cb();
            };

            return cmd
                .setProxiedUrl(args.url)
                .then(isOk => {
                    if (!isOk) return;
                    this.log(`Proxied URL changed to ${args.url}`.green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy start http")
        .description(d("Start HTTP proxy."))
        .action(function (args, cb) {

            return cmd
                .launchHttpProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("HTTP proxy is launched".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy start global")
        .description(d("Start global proxy."))
        .action(function (args, cb) {

            return cmd
                .launchGlobalProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Global proxy is launched".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy stop http")
        .description(d("Stop HTTP proxy."))
        .action(function (args, cb) {

            return cmd
                .stopHttpProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("HTTP proxy is stopped".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy stop global")
        .description(d("Stop global proxy."))
        .action(function (args, cb) {

            return cmd
                .stopGlobalProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Global proxy is stopped".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy restart http")
        .description(d("Restart HTTP proxy."))
        .action(function (args, cb) {

            return cmd
                .restartHttpProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("HTTP proxy is restarted".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy restart global")
        .description(d("Restart global proxy."))
        .action(function (args, cb) {

            return cmd
                .restartGlobalProxy()
                .then(isOk => {
                    if (!isOk) return;
                    this.log("Global proxy is restarted".green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy speed <speed>")
        .description(d("Limit proxy speed, kb/s."))
        .action(function (args, cb) {

            if (+args.speed < 0) {
                this.log("Speed value should be a number".red);
                return cb();
            };

            return cmd
                .setProxySpeed(+args.speed)
                .then(isOk => {
                    if (!isOk) return;
                    this.log(
                        `Proxy speed is limited to ${args.speed} kb/s`.green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy requests speed <speed>")
        .description(d("Limit proxy requests speed, kb/s."))
        .action(function (args, cb) {

            if (+args.speed < 0) {
                this.log("Speed value should be a number".red);
                return cb();
            };

            return cmd
                .setProxySpeed({ req: +args.speed })
                .then(isOk => {
                    if (!isOk) return;
                    this.log(
                        `Proxy requests speed is limited to ${args.speed} kb/s`.green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy responses speed <speed>")
        .description(d("Limit proxy responses speed, kb/s."))
        .action(function (args, cb) {

            if (+args.speed < 0) {
                this.log("Speed value should be a number".red);
                return cb();
            };

            return cmd
                .setProxySpeed({ res: +args.speed })
                .then(isOk => {
                    if (!isOk) return;
                    this.log(
                        `Proxy responses speed is limited to ${args.speed} kb/s`.green);
                })
                .catch(e => this.log(e))
                .then(cb);
        });

    cli.command("proxy speed reset")
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

    cli.command("chrome")
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

    cli.command("chrome close")
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

    cli.command("chrome restart")
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

    cli.command("cache")
        .description(d("Cache server responses to disk.",
            "Cached responses will be replayed by proxy."))
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

    cli.command("cache disable")
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

    cli.command("cache clear")
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

    cli.delimiter(">".red.bold).show();

    var finalize = () => {
        if (cmd._isChromeLaunched()) cmd.closeChrome();
    };

    cli.on("client_prompt_submit", name => {
        if (name === "exit") finalize();
    });

    return cli;
};
module.exports = interactive;
