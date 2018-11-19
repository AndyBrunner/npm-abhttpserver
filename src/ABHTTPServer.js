"use strict";
exports.__esModule = true;
var tls_1 = require("tls");
/**
 * Simple HTTP Server Framework
*/
// Global constants
var CLASSNAME = 'ABHttpServer';
var VERSION = '2.2.0'; //TODO: Class version number
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
        this.isActive = false;
        // Server statistics object to be returned to the user via getStatistics()
        this.httpStatistics = {
            server: {
                className: CLASSNAME,
                classVersion: VERSION,
                startTime: new Date().toISOString(),
                startArguments: process.argv,
                nodeVersion: process.version,
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
        // Mark server active
        this.isActive = true;
    }
    /**
     * Return string of object
     * @param {-}
     * @returns {string} String representation of ABHttpServer object
     */
    ABHttpServer.prototype.toString = function () {
        var status = '';
        status += "Class: " + CLASSNAME + ", ";
        status += "Host: " + this.httpStatistics.server.hostname + ", ";
        status += "HTTP: " + (this.httpServer ? 'true' : 'false') + ", ";
        status += "HTTPS: " + (this.httpsServer ? 'true' : 'false') + ", ";
        status += "Active: " + (this.isActive ? 'true' : 'false') + ", ";
        status += "AB_DEBUG: " + (this.DEBUG ? 'true' : 'false');
        return "[" + status + "]";
    };
    /**
     * Return the server statistics
     * @param {-}
     * @returns {statistics} JSON object with server statistics
     */
    ABHttpServer.prototype.getStatistics = function () {
        // Update statistics
        var cpuUsage = process.cpuUsage();
        this.httpStatistics.server.cpuUsageUserSec = cpuUsage.user / 1000000;
        this.httpStatistics.server.cpuUsageSystemSec = cpuUsage.system / 1000000;
        return this.httpStatistics;
    };
    /**
     * Establish server events and start the server
     * @param {server}  Server
     * @param {port}    TCP/IP port number
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
            server.on('error', function (error) {
                _this.logDebug("HTTP" + (tlsConnection ? 'S' : '') + " error received: " + error);
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
     */
    ABHttpServer.prototype.processHttpRequest = function (request, response) {
        var _this = this;
        var url = require('url');
        var StringDecoder = require('string_decoder').StringDecoder;
        // Supported HTTP methods based upon HTTP Method Registry at
        // http://www.iana.org/assignments/http-methods/http-methods.xhtml
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
        // Build a container holding all the data of the request
        var requestData = {
            'server': {
                'hostname': this.httpStatistics.server.hostname,
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
                'data': ''
            },
            'ip': {
                'protocol': request.socket.remoteFamily.toLowerCase() || ''
            },
            'url': {
                'path': decodeURI(parsedUrl.pathname).replace(/^\/+|\/+$/g, '').trim() || '',
                'query': {}
            }
        };
        // Construct key/value object from HTTP querystring (if present)
        if (parsedUrl.query) {
            var keyvalues = parsedUrl.query.split('&');
            for (var index = 0; index < keyvalues.length; index++) {
                var keyvalue = keyvalues[index].split('=');
                requestData.url.query[keyvalue[0]] = keyvalue[1];
            }
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
            _this.DEBUG ? _this.logDebug("<= Client " + requestData.client.address + "\u00A0HTTP/" + requestData.http.version + " (" + (requestData.http.tls ? requestData.http.tlsVersion : 'Non-TLS') + ") - " + requestData.http.method.toUpperCase() + " - URL /" + requestData.url.path + " - " + contentLength + " bytes") : true;
            // Update statistics
            if (requestData.http.tls) {
                _this.httpStatistics.request.https.count++;
                _this.httpStatistics.request.https.bytes += contentLength;
            }
            else {
                _this.httpStatistics.request.http.count++;
                _this.httpStatistics.request.http.bytes += contentLength;
            }
            // Get the specific function to handle the HTTP method or the generic getMethods() function
            var allMethodsCall = false;
            var methodFunction = httpMethods[requestData.http.method];
            if (typeof (methodFunction) === 'undefined') {
                _this.DEBUG ? _this.logDebug("Client " + requestData.client.address + " sent unsupported HTTP Method " + requestData.http.method.toUpperCase() + " received") : true;
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
    */
    ABHttpServer.prototype.logDebug = function (message) {
        this.DEBUG ? console.debug(new Date().toISOString() + " " + CLASSNAME + ": " + message) : true;
    };
    /**
     * Terminate the HTTP/HTTPS server
     * @param {-}
     */
    ABHttpServer.prototype.terminate = function () {
        if (!this.isActive) {
            return;
        }
        this.DEBUG ? this.logDebug('Method terminate() called') : true;
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
        }
        if (this.httpsServer) {
            this.httpsServer.close();
            this.httpsServer = null;
        }
        // Mark server inactive
        this.isActive = false;
        // Call user method (if present)
        this.shutdown();
    };
    /**
     * Sends HTML data to the client
     * @param {response}    ServerResponse object
     * @param {text}        HTML to be sent
     * @param {httpStatus}  HTTP Status code (defaults to 200)
     */
    ABHttpServer.prototype.sendHTML = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'text/html', text, httpStatus);
    };
    /**
     * Sends plain text to the client
     * @param {response}    ServerResponse object
     * @param {text}        Text to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     */
    ABHttpServer.prototype.sendText = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'text/plain', text, httpStatus);
    };
    /**
     * Sends JSON data to the client
     * @param {response}    ServerResponse object
     * @param {jsonData}    JSON data to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     */
    ABHttpServer.prototype.sendJSON = function (response, jsonData, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'application/json', JSON.stringify(jsonData), httpStatus);
    };
    /**
     * Sends error message as JSON object to the client
     * @param {response}      ServerResponse object
     * @param {errorMessage}  Error message
     * @param {httpStatus}    HTTP status code (defaults to 200)
     */
    ABHttpServer.prototype.sendError = function (response, errorMessage, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendJSON(response, {
            'time': new Date().toISOString(),
            'httpStatus': httpStatus,
            'component': CLASSNAME,
            'error': errorMessage
        }, httpStatus);
    };
    /**
     * Redirect to new URL
     * @param {response}    ServerResponse object
     * @param {string}      URL to redirect
     */
    ABHttpServer.prototype.redirectUrl = function (response, redirectURL) {
        this.sendData(response, 'text/plain', '', 301, { 'Location': redirectURL });
    };
    /**
     * Send the specified file to the client
     * @param {response}    ServerResponse object
     * @param {filePath}    File name with path
     * @param {fileRoot}    Check sanitized path with this root directory, defaults to __dirname
     * @param {mimeType}    MIME Type, default is set based on file name extension
     */
    ABHttpServer.prototype.sendFile = function (response, filePath, fileRoot, mimeType) {
        var _this = this;
        if (fileRoot === void 0) { fileRoot = __dirname; }
        if (mimeType === void 0) { mimeType = ''; }
        var path = require('path');
        var fs = require('fs');
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
        // Check for poison null bytes attack - Return 400 Bad Request
        if (filePath.indexOf('\0') !== -1) {
            this.sendError(response, "The filename " + filePath + " contains invalid characters", 400);
            return;
        }
        // Normalize the filepath
        var filePathNormalized = path.resolve(filePath);
        // Check for empty or missing file name
        if (filePath === '') {
            this.sendError(response, "No filename specified", 400);
            return;
        }
        // Check if file path is outside of the base path - Return 400 Bad Request
        if (filePathNormalized.indexOf(fileRoot) === -1) {
            this.sendError(response, "The file " + filePath + " is outside of the base directory", 400);
            return;
        }
        // Get file statistics
        fs.stat(filePathNormalized, function (fileError, fileStats) {
            // Check if file exist - Return 404 Bad Request
            if (fileError) {
                _this.sendError(response, "The file " + filePath + " does not exist", 404);
                return;
            }
            // Check if file is a directory - Return 400 Bad Request
            if (fileStats.isDirectory()) {
                _this.sendError(response, "The file " + filePath + " specifies a directory", 400);
                return;
            }
            // Read content of file
            fs.readFile(filePathNormalized, function (readError, data) {
                // File can not be read - Return 500 (Internal Server Error)
                if (readError) {
                    _this.sendError(response, "The file " + filePath + " could not be read", 500);
                    return;
                }
                // Set the MIME type corresponding to the file name if not specified
                if (mimeType === '') {
                    var fileExtension = path.parse(filePathNormalized).ext.toLowerCase();
                    mimeType = mimeTypes[fileExtension] || 'text/plain';
                }
                // Send the file with a matching content type
                _this.sendData(response, mimeType, data);
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
     */
    ABHttpServer.prototype.setHeaders = function (httpHeaders) {
        this.DEBUG ? this.logDebug("Invoked method setHeaders(" + httpHeaders + ")") : true;
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
     */
    ABHttpServer.prototype.sendData = function (response, mimeType, text, httpStatus, headers) {
        if (httpStatus === void 0) { httpStatus = 200; }
        if (headers === void 0) { headers = {}; }
        // Get length of data to be sent
        var contentLength = text.length;
        this.DEBUG ? this.logDebug("=> Client " + response.connection.remoteAddress + " Status " + httpStatus + " - " + contentLength + " bytes - Type " + mimeType) : true;
        if (!this.isActive) {
            return;
        }
        // Send mandatory HTTP headers
        if (this.httpHeaders) {
            for (var key in this.httpHeaders) {
                response.setHeader(key, this.httpHeaders[key]);
            }
        }
        // Send passed HTTP headers
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
        return;
    };
    // Event method which can be implemented/overwritten by the users subclass
    ABHttpServer.prototype.clientError = function (err, socket) { };
    ABHttpServer.prototype.shutdown = function () { };
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
