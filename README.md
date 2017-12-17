[![Build Status](https://travis-ci.org/glacejs/glace-proxy.svg?branch=master)](https://travis-ci.org/glacejs/glace-proxy)

[Release Notes](tutorial-release-notes.html)

# GlaceJS Proxy

## Annotation

`GlaceJS` proxy is nodejs interactive console application which launches http and global proxy to capture server responses and manage them.

## Features

- HTTP proxy launching
- Global transparent proxy launching
- Responses caching
- Responses speed management
- Chrome browser launching
- Interactive management
- Development and testing API

## Installation

Be sure that you have installed `nodejs >= v8.9`. Or [download](https://nodejs.org/en/download/) and install it.

```
npm i glacejs-proxy
```

After installation utility `glace-proxy` will be available in terminal. Use `glace-proxy -h` to get details about its usage or see section **Console Options**.

Installation for development:

```
git clone https://github.com/schipiga/glacejs-proxy
cd glacejs-proxy
npm i
```

## Quick Start

To start proxy server call the command in terminal:

```
glace-proxy [options]
```

Or create file `config.json` and fill it with content:

```
{
    "global-proxy": true or false,
    "global-proxy-port": "<port number>",
    "install-certificate": true,
    "existing-cache": true,
    "cache-folder": "</path/to/cache/folder>",
    "url": "<URL>",
    "speed": 128
}
```

And then just execute command in terminal:

```
glace-proxy
```

## Console Options

**Configuration:**

- `-c, --config [config-path]` - Path to JSON file with CLI arguments. Default is `cwd/config.json` (if it exists).
- `--web-url <URL>` - Proxied URL for HTTP proxy. Required if HTTP proxy is used.

(**Note!** All options below are may be used in `config.json`, see section **Quick Start**.)

**Proxy:**

- `--http-proxy` - Activate HTTP proxy.
- `--proxy-port [port-number]` - Port for HTTP proxy. Default is random. For example: `--proxy-port 3000`.
- `--global-proxy` - Activate transparent global proxy.
- `--global-proxy-port [port-number]` - Port for transparent global proxy. Default is `8080`. For example: `--global-proxy-port 3001`.
- `--install-certificate` - Install global proxy certificate as trusted. Requires administrator permissions. **Windows only!**
- `--speed <value>` - Responses speed from proxy to client (browser), kb/s. Default is unlimited. For example: `--speed 128`.

**Cache:**

- `--cache` - Cache server responses to disk.
- `--existing-cache` - Cache server responses to disk. Connect to existing cache if it exists.
- `--cache-folder [folder-path]` - Folder to cache server responses. Default is `cwd/.proxy-cache`. For example: `--cache-folder /path/to/my/cache`.

**Chrome:**

- `--chrome` - Launch google chrome and open proxied URL there. Pristine profile will be used.
- `--chrome-incognito` - Launch google chrome in incognito mode.

**Log:**

- `--log [file-path]` - Path to log file. Default is `cwd/glace-proxy.log`. For example: `--log /path/to/glace-proxy/log`.
- `--stdout-log` - Print log messages to stdout.

**Other:**

- `-h, --help` - Show help.

## GlaceJS Proxy commands

Commands will be available after `glace-proxy` launching:

- `url <url>` - Set proxied URL.
- `proxy start http` - Start HTTP proxy.
- `proxy start global` - Start global proxy.
- `proxy stop http` - Stop HTTP proxy.
- `proxy stop global` - Stop global proxy.
- `proxy restart http` - Restart HTTP proxy.
- `proxy restart global` - Restart global proxy.
- `proxy speed <speed>` - Limit proxy speed, **kb/s**.
- `proxy speed reset` - Unlimit proxy speed.
- `chrome` - Launch google chrome browser. Pristine profile will be used each time.
- `chrome close` - Close google chrome browser.
- `chrome restart` - Restart google chrome browser. Pristine profile will be used each time.
- `cache` - Cache server responses to disk. Cached responses will be replayed by proxy.
- `cache disable` - Disable proxy cache.
- `cache clear` - Remove cached responses from storage.
- `help [command...]` - Provide help for a given command.
- `exit` - Exit application.

## Development API

```javascript
var glaceProxy = require("glacejs-proxy");
```

More details about development and testing API [here](module-index.html).

## GlaceJS Proxy plugin

As [GlaceJS](https://glacejs.github.io/glace-core/) framework plugin it will be loaded automatically.

### Plugin CLI

- `--http-proxy` - Use http proxy.
- `--http-proxy-port` - Port for http proxy. Default is random.
- `--global-proxy` - Use transparent global proxy. Chromium browsers only.
- `--global-proxy-port` - Port for transparent global proxy. Default is 8888.
- `--install-certificate` - Install global proxy certificate as trusted. Requires administrator permissions.
- `--cache` - Enable middleware to cache proxy responses to disk.
- `--existing-cache` - Use existing cache if it exists.
- `--reconnect` - Number of proxy reconnects on request error. Default is 1.

### Plugin API

- [config](GlaceConfig.html)
- [fixtures](global.html)
- [steps](ProxySteps.html)

### Test examples

See [integration tests](https://github.com/glacejs/glace-js/blob/master/tests/integration/testProxy.js) in order to explore examples.
