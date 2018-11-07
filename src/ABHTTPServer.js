"use strict";
exports.__esModule = true;
var tls_1 = require("tls");
/**
 * Simple HTTP Server Framework
*/
// Global constants
var CLASSNAME = 'ABHttpServer';
var VERSION = '2.0.2'; //TODO: Class version number
/**
 * Abstract class to be implemented/subclassed by the user
*/
var ABHttpServer = /** @class */ (function () {
    /**
     * Create the HTTP server
     * @param {httpPort} Port number (1 - 65535) for the HTTP server or 0
     * @param {httpsPort} Port number (1 - 65535) for the HTTPS server or 0
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
        // Collect some HTTP statistics
        this.httpStatistics = {
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
        this.DEBUG ? this.logDebug("Object constructor called (" + httpPort + ", " + httpsPort + ")") : true;
        var http = require('http');
        var https = require('http2');
        var fs = require('fs');
        var path = require('path');
        // Check constructor arguments
        if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
            throw new RangeError(CLASSNAME + ': Both port arguments must be between 0 and 65535');
        }
        if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
            throw new RangeError(CLASSNAME + ': Both port arguments must have integer values');
        }
        if (arguments[0] === arguments[1]) {
            throw new RangeError(CLASSNAME + ': Both ports must not be equal');
        }
        if (arguments[0] === 0 && arguments[1] === 0) {
            throw new RangeError(CLASSNAME + ': At least one port must be non-zero');
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
            this.startServer(this.httpsServer, httpsPort, true);
        }
        // Mark server active
        this.isActive = true;
    }
    /**
     * Return string of object
     * @param {-}
     * @returns {string} String representation of object
     */
    ABHttpServer.prototype.toString = function () {
        var status = '';
        status += "HTTP: " + (this.httpServer ? 'true' : 'false') + ", ";
        status += "HTTPS: " + (this.httpsServer ? 'true' : 'false') + ", ";
        status += "Active: " + (this.isActive ? 'true' : 'false') + ", ";
        status += "AB_DEBUG: " + (this.DEBUG ? 'true' : 'false');
        return CLASSNAME + "[" + status + "]";
    };
    /**
     * Return the server statistics
     * @param {-}
     * @returns {statistics} JSON object with server statistics
     */
    ABHttpServer.prototype.getStatistics = function () {
        return this.httpStatistics;
    };
    /**
     * Establish server events and start the server
     * @param {server}  Server
     * @param {port}    TCP/IP port number
     * @param {secure}  TLS flag (default = false)
     */
    ABHttpServer.prototype.startServer = function (server, port, secure) {
        var _this = this;
        if (secure === void 0) { secure = false; }
        // Establish server event
        server.on('clientError', function (err, socket) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" http.Server client error: " + err)) : true;
            _this.clientError(err, socket);
        });
        // Establish server events for debugging
        if (this.DEBUG) {
            // Establish net.Server event handlers
            server.on('error', function (error) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" net.Server received error: " + error)) : true;
            });
            server.on('listening', function () {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + " net.Server server is in listen mode") : true;
            });
            // Establish http.Server event handlers
            server.on('checkContinue', function (request, response) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received <HTTP 100 continue>') : true;
                response.writeContinue();
            });
            server.on('checkExpectation', function (request, response) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received HTTP expect header') : true;
            });
            server.on('close', function () {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server closed') : true;
            });
            server.on('connect', function (request, socket, head) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server accepted connection') : true;
            });
            server.on('connection', function (socket) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server established connection') : true;
            });
            server.on('request', function (request, response) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received client request') : true;
            });
            server.on('upgrade', function (request, socket, head) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received upgrade request') : true;
            });
            // Establish tls.server event handlers
            server.on('newSession', function (sessionId, sessionData, callback) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server started TLS session') : true;
                callback();
            });
            server.on('OCSPRequest', function (certificate, issuer, callback) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server received certificate status request') : true;
                callback();
            });
            server.on('resumeSession', function (sessionId, callback) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server received TLS resume session status request') : true;
                callback();
            });
            server.on('secureConnection', function (tlsSocket) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server completed TLS handshaking process') : true;
            });
            server.on('tlsClientError', function (exception, tlsSocket) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server received an error before successful connection') : true;
            });
        }
        // Start the server
        server.listen(port, function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" server started on port " + port)) : true;
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
            'acl': function () { _this.acl(requestData, response); },
            'baseline-control': function () { _this.baselinecontrol(requestData, response); },
            'bind': function () { _this.bind(requestData, response); },
            'checkin': function () { _this.checkin(requestData, response); },
            'checkout': function () { _this.checkout(requestData, response); },
            'connect': function () { _this.connect(requestData, response); },
            'copy': function () { _this.copy(requestData, response); },
            'delete': function () { _this["delete"](requestData, response); },
            'get': function () { _this.get(requestData, response); },
            'head': function () { _this.head(requestData, response); },
            'label': function () { _this.label(requestData, response); },
            'link': function () { _this.link(requestData, response); },
            'lock': function () { _this.lock(requestData, response); },
            'merge': function () { _this.merge(requestData, response); },
            'mkactivity': function () { _this.mkactivity(requestData, response); },
            'mkcalendar': function () { _this.mkcalendar(requestData, response); },
            'mkcol': function () { _this.mkcol(requestData, response); },
            'mkredirectref': function () { _this.mkredirectref(requestData, response); },
            'mkworkspace': function () { _this.mkworkspace(requestData, response); },
            'move': function () { _this.move(requestData, response); },
            'options': function () { _this.options(requestData, response); },
            'orderpatch': function () { _this.orderpatch(requestData, response); },
            'patch': function () { _this.patch(requestData, response); },
            'post': function () { _this.post(requestData, response); },
            'pri': function () { _this.pri(requestData, response); },
            'propfind': function () { _this.propfind(requestData, response); },
            'proppatch': function () { _this.proppatch(requestData, response); },
            'put': function () { _this.put(requestData, response); },
            'rebind': function () { _this.rebind(requestData, response); },
            'report': function () { _this.report(requestData, response); },
            'search': function () { _this.search(requestData, response); },
            'trace': function () { _this.trace(requestData, response); },
            'unbind': function () { _this.unbind(requestData, response); },
            'uncheckout': function () { _this.uncheckout(requestData, response); },
            'unlink': function () { _this.unlink(requestData, response); },
            'unlock': function () { _this.unlock(requestData, response); },
            'update': function () { _this.update(requestData, response); },
            'updateredirectref': function () { _this.updateredirectref(requestData, response); },
            'version-control': function () { _this.versioncontrol(requestData, response); }
        };
        // Parse the url
        var parsedUrl = url.parse(request.url);
        // Build a container holding all the data of the request
        var requestData = {
            'version': VERSION,
            'server': {
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
        // Get the http payload (if present)
        var decoder = new StringDecoder('utf8');
        request.on('data', function (dataChunk) {
            requestData.http.data += decoder.write(dataChunk);
        });
        request.on('end', function () {
            requestData.http.data += decoder.end();
            var contentLength = requestData.http.data.length;
            _this.DEBUG ? _this.logDebug("<= HTTP/" + requestData.http.version + " (" + (requestData.http.tls ? '' : 'Non-') + "TLS) - Method " + requestData.http.method.toUpperCase() + " - URL /" + requestData.url.path + " - Content-Length " + contentLength) : true;
            // Update statistics
            if (requestData.http.tls) {
                _this.httpStatistics.request.https.count++;
                _this.httpStatistics.request.https.bytes += contentLength;
            }
            else {
                _this.httpStatistics.request.http.count++;
                _this.httpStatistics.request.http.bytes += contentLength;
            }
            // Get the specific function to handle the HTTP method
            var methodFunction = httpMethods[requestData.http.method];
            // Return an HTTP 501 error if the HTTP method is not defined 
            if (typeof (methodFunction) === 'undefined') {
                _this.sendError(response, "The server does not support the HTTP method " + requestData.http.method.toUpperCase(), 501);
                return;
            }
            // Call the HTTP method function which should be overwitten/implemented by the users subclass
            // If the user does not overwrite the default function, an HTTP 501 error will be sent
            methodFunction();
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
     * Sends not-implemented error message to the client
     * @param {request}       ABRequest object
     * @param {response}      ServerResponse object
     */
    ABHttpServer.prototype.sendNotImplementedError = function (request, response) {
        this.sendError(response, "No user subclass implementation for HTTP method " + request.http.method.toUpperCase(), 501);
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
            this.sendError(response, "The file " + filePathNormalized + " is outside of the base file path", 400);
            return;
        }
        // Get file statistics
        fs.stat(filePathNormalized, function (fileError, fileStats) {
            // Check if file exist - Return 404 Bad Request
            if (fileError) {
                _this.sendError(response, "The file " + filePathNormalized + " does not exist", 404);
                return;
            }
            // Check if file is a directory - Return 400 Bad Request
            if (fileStats.isDirectory()) {
                _this.sendError(response, "The file " + filePathNormalized + " specifies a directory", 400);
                return;
            }
            // Read content of file
            fs.readFile(filePathNormalized, function (readError, data) {
                // File can not be read - Return 500 (Internal Server Error)
                if (readError) {
                    _this.sendError(response, "The file " + filePathNormalized + " could not be read", 500);
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
     */
    ABHttpServer.prototype.sendData = function (response, mimeType, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        // Get length of data to be sent
        var contentLength = text.length;
        this.DEBUG ? this.logDebug("=> HTTP Status " + httpStatus + " - Content-Length " + contentLength + " - Content-Type " + mimeType) : true;
        if (!this.isActive) {
            return;
        }
        // Send additional HTTP headers
        if (this.httpHeaders) {
            for (var key in this.httpHeaders) {
                response.setHeader(key, this.httpHeaders[key]);
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
    ABHttpServer.prototype.acl = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.baselinecontrol = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.bind = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.checkin = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.checkout = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.connect = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.copy = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype["delete"] = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.get = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.head = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.label = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.link = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.lock = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.merge = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.mkactivity = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.mkcalendar = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.mkcol = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.mkredirectref = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.mkworkspace = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.move = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.options = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.orderpatch = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.patch = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.post = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.pri = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.propfind = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.proppatch = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.put = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.rebind = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.report = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.search = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.trace = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.unbind = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.uncheckout = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.unlink = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.unlock = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.update = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.updateredirectref = function (request, response) { this.sendNotImplementedError(request, response); };
    ABHttpServer.prototype.versioncontrol = function (request, response) { this.sendNotImplementedError(request, response); };
    return ABHttpServer;
}());
exports.ABHttpServer = ABHttpServer;
