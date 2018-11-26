"use strict";
exports.__esModule = true;
var tls_1 = require("tls");
/**
 * Simple HTTP Server Framework
 */
// Global constants
var CLASSNAME = 'ABHttpServer';
var VERSION = '2.4.0'; //TODO: Don't forget to update package.json, history.md and readme.md
/**
 * Abstract class to be implemented/subclassed by the user
*/
var ABHttpServer = /** @class */ (function () {
    /**
     * Create the HTTP server
     * @param {httpPort} Port number (1 - 65535) for the HTTP server or 0
     * @param {httpsPort} Port number (1 - 65535) for the HTTPS server or 0
     * @returns {ABHttpServer} Object
     */
    function ABHttpServer(httpPort, httpsPort) {
        if (httpPort === void 0) { httpPort = 0; }
        if (httpsPort === void 0) { httpsPort = 0; }
        var _this = this;
        this.DEBUG = (process.env.AB_DEBUG === 'true') ? true : false;
        this.httpServer = null;
        this.httpsServer = null;
        this.httpHeaders = {};
        this.pingEnabled = true;
        // Server statistics object to be returned to the user via getStatistics()
        this.httpStatistics = {
            server: {
                className: CLASSNAME,
                classVersion: VERSION,
                startTime: new Date().toISOString(),
                currentTime: new Date().toISOString(),
                startArguments: process.argv,
                nodeVersion: process.version,
                httpPort: 0,
                httpsPort: 0,
                hostname: '',
                osPlatform: '',
                osType: '',
                osRelease: '',
                cpuArchitecture: '',
                cpuUsageUserSec: 0.0,
                cpuUsageSystemSec: 0.0
            },
            request: {
                http: {
                    count: 0,
                    bytes: 0
                },
                https: {
                    count: 0,
                    bytes: 0
                }
            },
            response: {
                count: 0,
                bytes: 0
            }
        };
        this.DEBUG ? this.logDebug("Class version " + VERSION + "\u00A0constructor called (" + httpPort + ", " + httpsPort + ")") : true;
        var http = require('http');
        var https = require('http2');
        var fs = require('fs');
        var path = require('path');
        var os = require('os');
        // Complete statistic object
        this.httpStatistics.server.hostname = os.hostname();
        this.httpStatistics.server.cpuArchitecture = os.arch();
        this.httpStatistics.server.osPlatform = os.platform();
        this.httpStatistics.server.osType = os.type();
        this.httpStatistics.server.osRelease = os.release();
        // Check constructor arguments
        if (httpPort < 0 || httpPort > 65535 || httpsPort < 0 || httpsPort > 65535) {
            throw new RangeError(CLASSNAME + ": Both port arguments must be between 0 and 65535");
        }
        if (httpPort % 1 !== 0 || httpsPort % 1 !== 0) {
            throw new RangeError(CLASSNAME + ": Both port arguments must have integer values");
        }
        if (httpPort === httpsPort) {
            throw new RangeError(CLASSNAME + ": Both ports must not be equal");
        }
        if (httpPort === 0 && httpsPort === 0) {
            throw new RangeError(CLASSNAME + ": At least one port must be non-zero");
        }
        // Save the HTTP/S port numbers
        this.httpStatistics.server.httpPort = httpPort;
        this.httpStatistics.server.httpsPort = httpsPort;
        // Start the HTTP server
        if (httpPort !== 0) {
            this.DEBUG ? this.logDebug("Creating HTTP server on port " + httpPort) : true;
            this.httpServer = http.createServer(function (request, response) {
                _this.processHttpRequest(request, response);
            });
            this.startServer(this.httpServer, httpPort);
        }
        // Start the HTTPS server
        if (httpsPort !== 0) {
            this.DEBUG ? this.logDebug("Creating HTTPS server on port " + httpsPort) : true;
            var httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, 'key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
                allowHTTP1: true
            };
            this.httpsServer = https.createSecureServer(httpsOptions, function (request, response) {
                _this.processHttpRequest(request, response);
            });
            this.startServer(this.httpsServer, httpsPort);
        }
    }
    /**
     * Disable /api/ping support
     * @param {void}
     * @returns {void}
     */
    ABHttpServer.prototype.disablePing = function () {
        this.pingEnabled = false;
    };
    /**
     * Return string of object
     * @param {void}
     * @returns {string} String representation of ABHttpServer object
     */
    ABHttpServer.prototype.toString = function () {
        this.DEBUG ? this.logDebug("Method toString() called") : true;
        var status = {
            'Class': CLASSNAME,
            'Version': VERSION,
            'Host': this.httpStatistics.server.hostname,
            'Http': this.httpStatistics.server.httpPort,
            'Https': this.httpStatistics.server.httpsPort,
            'Debug': this.DEBUG
        };
        return JSON.stringify(status);
    };
    /**
     * Return the server statistics
     * @param {void}
     * @returns {statistics} JSON object with server statistics
     */
    ABHttpServer.prototype.getStatistics = function () {
        this.DEBUG ? this.logDebug("Method getStatistics() called") : true;
        // Update statistics and return it to the caller
        var cpuUsage = process.cpuUsage();
        this.httpStatistics.server.cpuUsageUserSec = cpuUsage.user / 1000000;
        this.httpStatistics.server.cpuUsageSystemSec = cpuUsage.system / 1000000;
        this.httpStatistics.server.currentTime = new Date().toISOString();
        return this.httpStatistics;
    };
    /**
     * Establish server events and start the server
     * @param {server}  Server
     * @param {port}    TCP/IP port number
     * @returns {void}
     */
    ABHttpServer.prototype.startServer = function (server, port) {
        var _this = this;
        // Get TLS state
        var tlsConnection = (server.constructor.name === 'Http2SecureServer') ? true : false;
        // Establish <net.Server/http.Server> events
        server.on('clientError', function (error, socket) {
            _this.DEBUG ? _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + socket.remoteAddress + "\u00A0error: " + error) : true;
            _this.clientError(error, socket);
        });
        server.on('error', function (error) {
            _this.DEBUG ? _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " error received: " + error) : true;
            _this.clientError(error, undefined);
        });
        if (this.DEBUG) {
            server.on('checkContinue', function (request, response) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + request.connection.remoteAddress + " \"100-continue\" received");
            });
            server.on('checkExpectation', function (request, response) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + request.connection.remoteAddress + " expect header received");
            });
            server.on('close', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " server closed");
            });
            server.on('connect', function (request, socket, head) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + request.connection.remoteAddress + " connect received");
            });
            server.on('connection', function (socket) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + socket.remoteAddress + "\u00A0connected");
            });
            server.on('listening', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " server is listening");
            });
            server.on('request', function (request, response) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + request.connection.remoteAddress + " request received");
            });
            server.on('upgrade', function (request, socket, head) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + request.connection.remoteAddress + " upgrade received");
            });
        }
        // Establish <tls.Server/Http2SecureServer> events
        server.on('tlsClientError', function (error, socket) {
            _this.DEBUG ? _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + socket.remoteAddress + "\u00A0error received before successful connection: " + error) : true;
            _this.clientError(error, socket);
        });
        if (this.DEBUG) {
            server.on('newSession', function (sessionId, sessionData, callback) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " TLS session established");
                callback();
            });
            server.on('OCSPRequest', function (certificate, issuer, callback) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client sent certificate status request");
                callback();
            });
            server.on('resumeSession', function (sessionId, callback) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client sent TLS session resume request");
                callback();
            });
            server.on('secureConnection', function (socket) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client " + socket.remoteAddress + " completed TLS handshaking");
            });
            server.on('session', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " HTTP2 session created");
            });
            server.on('sessionError', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " session error occurred");
            });
            server.on('stream', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " stream event occurred");
            });
            server.on('timeout', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " server is idle");
            });
            server.on('unknownProtocol', function () {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " client failed protocol negotiation");
            });
        }
        // Start the server
        server.listen(port, function () {
            _this.DEBUG ? _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " server started on port " + port) : true;
        });
    };
    /**
     * Handle all HTTP requests
     * @param {request}   IncomingMessage object
     * @param {response}  ServerResponse object
     * @returns {void}
     */
    ABHttpServer.prototype.processHttpRequest = function (request, response) {
        var _this = this;
        var url = require('url');
        var StringDecoder = require('string_decoder').StringDecoder;
        var crypto = require('crypto');
        // Supported HTTP methods (see www.iana.org/assignments/http-methods/http-methods.xhtml)
        var httpMethods = {
            'acl': function () { return (_this.acl(requestData, response)); },
            'baseline-control': function () { return (_this.baselinecontrol(requestData, response)); },
            'bind': function () { return (_this.bind(requestData, response)); },
            'checkin': function () { return (_this.checkin(requestData, response)); },
            'checkout': function () { return (_this.checkout(requestData, response)); },
            'connect': function () { return (_this.connect(requestData, response)); },
            'copy': function () { return (_this.copy(requestData, response)); },
            'delete': function () { return (_this["delete"](requestData, response)); },
            'get': function () { return (_this.get(requestData, response)); },
            'head': function () { return (_this.head(requestData, response)); },
            'label': function () { return (_this.label(requestData, response)); },
            'link': function () { return (_this.link(requestData, response)); },
            'lock': function () { return (_this.lock(requestData, response)); },
            'merge': function () { return (_this.merge(requestData, response)); },
            'mkactivity': function () { return (_this.mkactivity(requestData, response)); },
            'mkcalendar': function () { return (_this.mkcalendar(requestData, response)); },
            'mkcol': function () { return (_this.mkcol(requestData, response)); },
            'mkredirectref': function () { return (_this.mkredirectref(requestData, response)); },
            'mkworkspace': function () { return (_this.mkworkspace(requestData, response)); },
            'move': function () { return (_this.move(requestData, response)); },
            'options': function () { return (_this.options(requestData, response)); },
            'orderpatch': function () { return (_this.orderpatch(requestData, response)); },
            'patch': function () { return (_this.patch(requestData, response)); },
            'post': function () { return (_this.post(requestData, response)); },
            'pri': function () { return (_this.pri(requestData, response)); },
            'propfind': function () { return (_this.propfind(requestData, response)); },
            'proppatch': function () { return (_this.proppatch(requestData, response)); },
            'put': function () { return (_this.put(requestData, response)); },
            'rebind': function () { return (_this.rebind(requestData, response)); },
            'report': function () { return (_this.report(requestData, response)); },
            'search': function () { return (_this.search(requestData, response)); },
            'trace': function () { return (_this.trace(requestData, response)); },
            'unbind': function () { return (_this.unbind(requestData, response)); },
            'uncheckout': function () { return (_this.uncheckout(requestData, response)); },
            'unlink': function () { return (_this.unlink(requestData, response)); },
            'unlock': function () { return (_this.unlock(requestData, response)); },
            'update': function () { return (_this.update(requestData, response)); },
            'updateredirectref': function () { return (_this.updateredirectref(requestData, response)); },
            'version-control': function () { return (_this.versioncontrol(requestData, response)); },
            '?': function () { return (_this.allMethods(requestData, response)); }
        };
        // Parse the url
        var parsedUrl = url.parse(request.url);
        // Build an object holding all the data of the request
        var requestData = {
            'server': {
                'hostname': request.headers.host || this.httpStatistics.server.hostname,
                'address': request.socket.localAddress || '',
                'port': request.socket.localPort.toString() || ''
            },
            'client': {
                'address': request.socket.remoteAddress || '',
                'port': request.socket.remotePort.toString() || ''
            },
            'http': {
                'version': request.httpVersion || '',
                'tls': (request.socket instanceof tls_1.TLSSocket) ? true : false,
                'tlsVersion': '',
                'tlsCipher': '',
                'method': request.method.toLowerCase() || '',
                'headers': request.headers || '',
                'cookies': {},
                'data': ''
            },
            'ip': {
                'protocol': request.socket.remoteFamily.toLowerCase() || ''
            },
            'url': {
                'path': decodeURI(parsedUrl.pathname).replace(/^\/+|\/+$/g, '').trim() || '',
                'query': {}
            },
            'sessionId': ''
        };
        // Set hostname
        if (request.headers.host) {
            requestData.server.hostname = request.headers.host.substr(0, request.headers.host.indexOf(':'));
        }
        else {
            requestData.server.hostname = this.httpStatistics.server.hostname;
        }
        // Construct key/value object from URL querystring (if present)
        if (parsedUrl.query) {
            var keyvalues = parsedUrl.query.split('&');
            for (var index = 0; index < keyvalues.length; index++) {
                var keyvalue = keyvalues[index].split('=');
                requestData.url.query[keyvalue[0]] = keyvalue[1];
            }
        }
        // Save all cookies as key/value pairs for easier access
        var httpCookies = request.headers['cookie'] || '';
        if (httpCookies.length > 0) {
            var httpCookieValues = httpCookies.toString().trim().split(';');
            // Split the "Key=Value" ('=' sign may also appear in value or is missing completely)
            for (var index = 0; index < httpCookieValues.length; index++) {
                var cookie = httpCookieValues[index].trim();
                var stringPosition = cookie.indexOf('=');
                if (stringPosition === -1) {
                    requestData.http.cookies[cookie] = '';
                }
                else {
                    var key = cookie.substr(0, stringPosition).trim().toLowerCase();
                    var value = cookie.substr(stringPosition + 1).trim();
                    requestData.http.cookies[key] = value;
                }
            }
        }
        // Get the previous ABSession identifier or create a new one
        requestData.sessionId = requestData.http.cookies['absession'] || '';
        if (requestData.sessionId === '') {
            requestData.sessionId = crypto.randomBytes(32).toString('base64');
            response.setHeader('Set-Cookie', "ABSession=" + requestData.sessionId);
        }
        // Get TLS version and cipher
        if (requestData.http.tls) {
            requestData.http.tlsVersion = request.socket.getProtocol() || 'unknown';
            requestData.http.tlsCipher = request.socket.getCipher().name;
        }
        // Get the http payload (if present)
        var decoder = new StringDecoder('utf8');
        request.on('data', function (dataChunk) {
            requestData.http.data += decoder.write(dataChunk);
        });
        request.on('end', function () {
            requestData.http.data += decoder.end();
            var contentLength = requestData.http.data.length;
            _this.DEBUG ? _this.logDebug("<= Client " + requestData.client.address + ", HTTP/" + requestData.http.version + " " + (requestData.http.tls ? requestData.http.tlsVersion : 'Non-TLS') + ", " + requestData.http.method.toUpperCase() + " /" + requestData.url.path + ", Data " + contentLength + " bytes") : true;
            // Update statistics
            if (requestData.http.tls) {
                _this.httpStatistics.request.https.count++;
                _this.httpStatistics.request.https.bytes += contentLength;
            }
            else {
                _this.httpStatistics.request.http.count++;
                _this.httpStatistics.request.http.bytes += contentLength;
            }
            // Send automatic response for "GET /api/ping" 
            if (_this.pingEnabled) {
                if (requestData.http.method === 'get' && requestData.url.path.toLowerCase() === 'api/ping') {
                    _this.sendJSON(response, { "response": "ok" });
                    return;
                }
            }
            // Get the specific function to handle the HTTP method or the generic getMethods() function
            var allMethodsCall = false;
            var methodFunction = httpMethods[requestData.http.method];
            if (typeof (methodFunction) === 'undefined') {
                _this.DEBUG ? _this.logDebug("Client " + requestData.client.address + " sent unsupported HTTP Method " + requestData.http.method.toUpperCase()) : true;
                methodFunction = httpMethods['?'];
                allMethodsCall = true;
            }
            // Call the HTTP method function which should be overwitten/implemented by the users subclass
            var returnData = methodFunction(requestData, response);
            // Return if anything other than true/false returned from subclass implementation
            if (typeof (returnData) !== 'boolean') {
                return;
            }
            // Return if the user implemented the subclass (default implementations return false)
            if (returnData) {
                return;
            }
            // Call the allMethods() if not already done
            if (!allMethodsCall) {
                methodFunction = httpMethods['?'];
                returnData = methodFunction(requestData, response);
                // Return if anything other than true/false returned from subclass implementation
                if (typeof (returnData) !== 'boolean') {
                    return;
                }
                // Return if the user implemented the subclass (default implementations return false)
                if (returnData) {
                    return;
                }
            }
            // No method implementation in user subclass - Return 501 error
            _this.sendError(response, "Missing server implementation for HTTP method " + requestData.http.method.toUpperCase(), 501);
        });
    };
    /**
    * Write debugging data to the console
    * @param {message}  Debug message to be written
    * @returns {void}
    */
    ABHttpServer.prototype.logDebug = function (message) {
        this.DEBUG ? console.debug(new Date().toISOString() + " " + CLASSNAME + ": " + message) : true;
    };
    /**
     * Sends HTML data to the client
     * @param {response}    ServerResponse object
     * @param {text}        HTML to be sent
     * @param {httpStatus}  HTTP Status code (defaults to 200)
     * @returns {void}
     */
    ABHttpServer.prototype.sendHTML = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.DEBUG ? this.logDebug("Method sendHTML(*, *, " + httpStatus + ") called") : true;
        this.sendData(response, 'text/html', text, httpStatus);
    };
    /**
     * Sends plain text to the client
     * @param {response}    ServerResponse object
     * @param {text}        Text to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     * @returns {void}
     */
    ABHttpServer.prototype.sendText = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.DEBUG ? this.logDebug("Method sendText(*, *, " + httpStatus + ") called") : true;
        this.sendData(response, 'text/plain', text, httpStatus);
    };
    /**
     * Sends JSON data to the client
     * @param {response}    ServerResponse object
     * @param {jsonData}    JSON data to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     * @returns {void}
     */
    ABHttpServer.prototype.sendJSON = function (response, jsonData, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.DEBUG ? this.logDebug("Method sendJSON(*, *, " + httpStatus + ") called") : true;
        this.sendData(response, 'application/json', JSON.stringify(jsonData), httpStatus);
    };
    /**
     * Sends error message as JSON object to the client
     * @param {response}      ServerResponse object
     * @param {errorMessage}  Error message
     * @param {httpStatus}    HTTP status code (defaults to 200)
     * @returns {void}
     */
    ABHttpServer.prototype.sendError = function (response, errorMessage, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendJSON(response, {
            'httpStatus': httpStatus,
            'error': errorMessage,
            'component': CLASSNAME,
            'version:': VERSION,
            'time': new Date().toISOString()
        }, httpStatus);
    };
    /**
     * Redirect to new URL
     * @param {response}    ServerResponse object
     * @param {string}      URL to redirect
     * @returns {void}
     */
    ABHttpServer.prototype.redirectUrl = function (response, redirectUrl) {
        this.DEBUG ? this.logDebug("Method redirectUrl(*, " + redirectUrl + ") called") : true;
        this.sendData(response, 'text/plain', '', 301, { 'Location': redirectUrl });
    };
    /**
     * Send the specified file to the client
     * @param {response}    ServerResponse object
     * @param {filePath}    File name with path
     * @param {fileRoot}    Check sanitized path with this root directory, defaults to __dirname
     * @param {mimeType}    MIME Type, default is set based on file name extension
     * @returns {void}
     */
    ABHttpServer.prototype.sendFile = function (response, filePath, fileRoot, mimeType) {
        var _this = this;
        if (fileRoot === void 0) { fileRoot = __dirname; }
        if (mimeType === void 0) { mimeType = ''; }
        this.DEBUG ? this.logDebug("Method sendFile(*, " + filePath + ", *, " + mimeType + ") called") : true;
        var path = require('path');
        // File extention to MIME types mapping
        var mimeTypes = {
            '.aac': 'audio/aac',
            '.abw': 'application/x-abiword',
            '.arc': 'application/octet-stream',
            '.avi': 'video/x-msvideo',
            '.azw': 'application/vnd.amazon.ebook',
            '.bin': 'application/octet-stream',
            '.bmp': 'image/bmp',
            '.bz': 'application/x-bzip',
            '.bz2': 'application/x-bzip2',
            '.csh': 'application/x-csh',
            '.css': 'text/css',
            '.csv': 'text/csv',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.eot': 'application/vnd.ms-fontobject',
            '.epub': 'application/epub+zip',
            '.es': 'application/ecmascript',
            '.gif': 'image/gif',
            '.htm': 'text/html',
            '.html': 'text/html',
            '.ico': 'image/x-icon',
            '.ics': 'text/calendar',
            '.jar': 'application/java-archive',
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.mid': 'audio/midi audio/x-midi',
            '.midi': 'audio/midi audio/x-midi',
            '.mpeg': 'video/mpeg',
            '.mpkg': 'application/vnd.apple.installer+xml',
            '.odp': 'application/vnd.oasis.opendocument.presentation',
            '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
            '.odt': 'application/vnd.oasis.opendocument.text',
            '.oga': 'audio/ogg',
            '.ogv': 'video/ogg',
            '.ogx': 'application/ogg',
            '.otf': 'font/otf',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.rar': 'application/x-rar-compressed',
            '.rtf': 'application/rtf',
            '.sh': 'application/x-sh',
            '.svg': 'image/svg+xml',
            '.swf': 'application/x-shockwave-flash',
            '.tar': 'application/x-tar',
            '.tif': 'image/tiff',
            '.tiff': 'image/tiff',
            '.ts': 'application/typescript',
            '.ttf': 'font/ttf',
            '.txt': 'text/plain',
            '.vsd': 'application/vnd.visio',
            '.wav': 'audio/wav',
            '.weba': 'audio/webm',
            '.webm': 'video/webm',
            '.webp': 'image/webp',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.xhtml': 'application/xhtml+xml',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xml': 'application/xml',
            '.xul': 'application/vnd.mozilla.xul+xml',
            '.zip': 'application/zip',
            '.3gp': 'video/3gpp',
            '.3g2': 'video/3gpp2',
            '.7z': 'application/x-7z-compressed'
        };
        // Get content of the file
        this.readFile(filePath, fileRoot = __dirname, function (readError, data) {
            // Check if file could be read
            if (readError) {
                _this.sendError(response, readError.message, 500);
                return;
            }
            // Set the MIME type corresponding to the file name if not specified
            if (mimeType === '') {
                var fileExtension = path.parse(filePath).ext.toLowerCase();
                mimeType = mimeTypes[fileExtension] || 'text/plain';
            }
            // Send the file with a matching content type
            _this.sendData(response, mimeType, data);
        });
    };
    /**
     * Return content of a given file
     * @param {filePath}    File name with path
     * @param {fileRoot}    Check path with this root directory, defaults to __dirname
     * @param {callback}    Callback function (Error, Buffer)
     * @returns {void}
     */
    ABHttpServer.prototype.readFile = function (filePath, fileRoot, callback) {
        if (fileRoot === void 0) { fileRoot = __dirname; }
        this.DEBUG ? this.logDebug("Method readFile(" + filePath + ", *, *) called") : true;
        var path = require('path');
        var fs = require('fs');
        // Check for poison null bytes attack
        if (filePath.indexOf('\0') !== -1) {
            callback(new Error("The filename " + filePath + " contains invalid characters"));
            return;
        }
        // Normalize the filepath
        var filePathNormalized = path.resolve(filePath);
        // Check for empty or missing file name
        if (filePath === '') {
            callback(new Error("No filename specified"));
            return;
        }
        // Check if file path is outside of the base path
        if (filePathNormalized.indexOf(fileRoot) === -1) {
            callback(new Error("The file " + filePath + " is outside of the base directory"));
            return;
        }
        // Get file statistics
        fs.stat(filePathNormalized, function (fileError, fileStats) {
            // Check if file exist
            if (fileError) {
                callback(new Error("The file " + filePath + " does not exist"));
                return;
            }
            // Check if file is a directory
            if (fileStats.isDirectory()) {
                callback(new Error("The file " + filePath + " specifies a directory"));
                return;
            }
            // Read content of file
            fs.readFile(filePathNormalized, function (readError, data) {
                // File can not be read
                if (readError) {
                    callback(new Error("The file " + filePath + " could not be read"));
                    return;
                }
                // Return the file content to the caller
                callback(false, data);
            });
        });
    };
    /**
     * Set HTTP headers to be added to every response
     *
     * Example:
     * this.setHeaders({'Access-Control-Allow-Origin': '*',
     *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
     *
     * @param {httpHeaders} HTTP Headers to be added
     * @returns {void}
     */
    ABHttpServer.prototype.setHeaders = function (httpHeaders) {
        this.DEBUG ? this.logDebug("Method setHeaders() called") : true;
        this.httpHeaders = httpHeaders;
        return;
    };
    /**
     * Writes the data with HTTP headers
     * @param {response}      ServerResponse
     * @param {mimeType}      HTTP Content-Type
     * @param {text}          Data to be written
     * @param {httpStatus}    HTTP Status code (default = 200)
     * @param {headers}       Additional HTTP headers (default = {})
     * @returns{void}
     */
    ABHttpServer.prototype.sendData = function (response, mimeType, text, httpStatus, headers) {
        if (httpStatus === void 0) { httpStatus = 200; }
        if (headers === void 0) { headers = {}; }
        // Get length of data to be sent
        var contentLength = text.length;
        this.DEBUG ? this.logDebug("=> Client " + response.connection.remoteAddress + ", HTTP " + httpStatus + ", Data " + mimeType + " " + contentLength + " bytes") : true;
        // Send mandatory HTTP headers
        if (this.httpHeaders) {
            for (var key in this.httpHeaders) {
                response.setHeader(key, this.httpHeaders[key]);
            }
        }
        // Send passed additional HTTP headers
        if (headers) {
            for (var key in headers) {
                response.setHeader(key, headers[key]);
            }
        }
        // Set standard HTTP headers
        response.writeHead(httpStatus, {
            'Content-Type': mimeType,
            'Content-Length': contentLength,
            'Server': CLASSNAME + "/" + VERSION + " (Node.js " + process.version + ")"
        });
        // Send the HTTP headers with the data and terminate the response
        response.end(text);
        // Update the statistics
        this.httpStatistics.response.count++;
        this.httpStatistics.response.bytes += contentLength;
    };
    // Event method which can be implemented/overwritten by the users subclass
    ABHttpServer.prototype.clientError = function (err, socket) { };
    // HTTP methods which can be implemented/overwritten by the users subclass
    ABHttpServer.prototype.acl = function (request, response) { return false; };
    ABHttpServer.prototype.baselinecontrol = function (request, response) { return false; };
    ABHttpServer.prototype.bind = function (request, response) { return false; };
    ABHttpServer.prototype.checkin = function (request, response) { return false; };
    ABHttpServer.prototype.checkout = function (request, response) { return false; };
    ABHttpServer.prototype.connect = function (request, response) { return false; };
    ABHttpServer.prototype.copy = function (request, response) { return false; };
    ABHttpServer.prototype["delete"] = function (request, response) { return false; };
    ABHttpServer.prototype.get = function (request, response) { return false; };
    ABHttpServer.prototype.head = function (request, response) { return false; };
    ABHttpServer.prototype.label = function (request, response) { return false; };
    ABHttpServer.prototype.link = function (request, response) { return false; };
    ABHttpServer.prototype.lock = function (request, response) { return false; };
    ABHttpServer.prototype.merge = function (request, response) { return false; };
    ABHttpServer.prototype.mkactivity = function (request, response) { return false; };
    ABHttpServer.prototype.mkcalendar = function (request, response) { return false; };
    ABHttpServer.prototype.mkcol = function (request, response) { return false; };
    ABHttpServer.prototype.mkredirectref = function (request, response) { return false; };
    ABHttpServer.prototype.mkworkspace = function (request, response) { return false; };
    ABHttpServer.prototype.move = function (request, response) { return false; };
    ABHttpServer.prototype.options = function (request, response) { return false; };
    ABHttpServer.prototype.orderpatch = function (request, response) { return false; };
    ABHttpServer.prototype.patch = function (request, response) { return false; };
    ABHttpServer.prototype.post = function (request, response) { return false; };
    ABHttpServer.prototype.pri = function (request, response) { return false; };
    ABHttpServer.prototype.propfind = function (request, response) { return false; };
    ABHttpServer.prototype.proppatch = function (request, response) { return false; };
    ABHttpServer.prototype.put = function (request, response) { return false; };
    ABHttpServer.prototype.rebind = function (request, response) { return false; };
    ABHttpServer.prototype.report = function (request, response) { return false; };
    ABHttpServer.prototype.search = function (request, response) { return false; };
    ABHttpServer.prototype.trace = function (request, response) { return false; };
    ABHttpServer.prototype.unbind = function (request, response) { return false; };
    ABHttpServer.prototype.uncheckout = function (request, response) { return false; };
    ABHttpServer.prototype.unlink = function (request, response) { return false; };
    ABHttpServer.prototype.unlock = function (request, response) { return false; };
    ABHttpServer.prototype.update = function (request, response) { return false; };
    ABHttpServer.prototype.updateredirectref = function (request, response) { return false; };
    ABHttpServer.prototype.versioncontrol = function (request, response) { return false; };
    ABHttpServer.prototype.allMethods = function (request, response) { return false; };
    return ABHttpServer;
}());
exports.ABHttpServer = ABHttpServer;
