"use strict";
/**
 * Help description.
 *
 * @module
 */

require("colors");
var U = require("glace-utils");

var d = U.switchColor();

U.help(d)
    .usage("\nglace-proxy [options]".white.bold)
    .options({
        /* proxy */
        "web-url <URL>": {
            describe: d("Proxied URL for HTTP proxy.",
                "Required if HTTP proxy is used."),
            type: "string",
            group: "Proxy:",
        },
        "http-proxy": {
            describe: d("Activate HTTP proxy."),
            type: "boolean",
            group: "Proxy:",
        },
        "http-proxy-port [port-number]": {
            describe: d("Port for HTTP proxy. Default is random."),
            type: "number",
            group: "Proxy:",
        },
        "global-proxy": {
            describe: d("Activate transparent global proxy."),
            type: "boolean",
            group: "Proxy:",
        },
        "global-proxy-port [port-number]": {
            describe: d("Port for transparent global proxy. Default is random."),
            type: "number",
            group: "Proxy:",
        },
        "install-certificate": {
            describe: d("Install global proxy certificate as trusted.",
                "Requires administrator permissions.",
                "Windows only."),
            type: "boolean",
            group: "Proxy:",
        },
        "speed <value>": {
            describe: d("Responses speed from proxy to client (browser), kb/s.",
                "Default is unlimited."),
            type: "number",
            group: "Proxy:",
        },
        /* cache */
        "cache": {
            describe: d("Cache server responses to disk."),
            type: "boolean",
            group: "Cache:",
        },
        "existing-cache": {
            describe: d("Cache server responses to disk.",
                "Connect to existing cache if it exists."),
            type: "boolean",
            group: "Cache:",
        },
        "cache-folder [folder-path]": {
            describe: d("Folder to cache server responses.",
                "Default is 'cwd/.proxy-cache'"),
            type: "string",
            group: "Cache:",
        },
        /* chrome */
        "chrome": {
            describe: d("Launch google chrome and open proxied URL there.",
                "Pristine profile will be used."),
            type: "boolean",
            group: "Chrome:",
        },
        "chrome-incognito": {
            describe: d("Launch google chrome in incognito mode."),
            type: "boolean",
            group: "Chrome:",
        },
    })
    .argv;
