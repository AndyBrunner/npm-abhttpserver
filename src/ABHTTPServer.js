"use strict";
exports.__esModule = true;
var tls_1 = require("tls");
// Overall constants
var CLASSNAME = 'ABHttpServer';
/**
 * Simple HTTP Server Framework
*/
var ABHttpServer = /** @class */ (function () {
    /**
     * Create the HTTP server
     * @param httpPort Port number (1 - 65535) for the HTTP server or 0
     * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
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
        this.DEBUG ? this.logDebug("Constructor called (" + httpPort + ", " + httpsPort + ")") : true;
        var http = require('http');
        var https = require('http2');
        var fs = require('fs');
        var path = require('path');
        // Check constructor arguments
        if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
            throw new Error(CLASSNAME + ': Both port arguments must be between 0 and 65535');
        }
        if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
            throw new Error(CLASSNAME + ': Both port arguments must have integer values');
        }
        if (arguments[0] === arguments[1]) {
            throw new Error(CLASSNAME + ': Both ports must not be equal');
        }
        if (arguments[0] === 0 && arguments[1] === 0) {
            throw new Error(CLASSNAME + ': At least one port must be non-zero');
        }
        // Start the HTTP server
        if (httpPort != 0) {
            this.DEBUG ? this.logDebug("Creating HTTP server on port " + httpPort) : true;
            this.httpServer = http.createServer(function (request, response) {
                _this.processHttpRequest(request, response);
            });
            this.startServer(this.httpServer, httpPort);
        }
        // Start the HTTPS server
        if (httpsPort != 0) {
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
     * Establish server events and start the server
     * @param server  Server
     * @param port    TCP/IP port number
     * @param secure  TLS flag (default = false)
     */
    ABHttpServer.prototype.startServer = function (server, port, secure) {
        var _this = this;
        if (secure === void 0) { secure = false; }
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
            server.on('clientError', function (err, socket) {
                _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" http.Server client error: " + err)) : true;
                _this.clientError(err, socket);
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
    // Handle all HTTP/HTTPS requests
    ABHttpServer.prototype.processHttpRequest = function (request, response) {
        var _this = this;
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
        var url = require('url');
        var StringDecoder = require('string_decoder').StringDecoder;
        // Parse the url
        var parsedUrl = url.parse(request.url);
        // Build a container holding all the data of the request
        var requestData = {
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
                'path': parsedUrl.pathname.replace(/^\/+|\/+$/g, '') || '',
                'query': {}
            }
        };
        // Construct key/value object from HTTP querystring
        if (parsedUrl.query) {
            var keyvalues = parsedUrl.query.split('&');
            for (var index = 0; index < keyvalues.length; index++) {
                var keyvalue = keyvalues[index].split('=');
                requestData.url.query[keyvalue[0]] = keyvalue[1];
            }
        }
        // Get the http payload (if any)
        var decoder = new StringDecoder('utf8');
        request.on('data', function (dataChunk) {
            requestData.http.data += decoder.write(dataChunk);
        });
        request.on('end', function () {
            requestData.http.data += decoder.end();
            _this.DEBUG ? _this.logDebug("HTTP/" + requestData.http.version + " " + requestData.http.method.toUpperCase() + " /" + requestData.url.path) : true;
            // After we have collected all information, we now call the overwritten methods from the user
            var methodFunction = httpMethods[requestData.http.method]; //TODO
            if (typeof (methodFunction) == 'undefined') {
                var errorMessage = {
                    component: CLASSNAME,
                    error: "Unsupported HTTP method " + requestData.http.method.toLocaleUpperCase()
                };
                _this.DEBUG ? _this.logDebug(errorMessage.error) : true;
                _this.sendJSON(response, errorMessage, 501);
            }
            else {
                methodFunction();
            }
        });
    };
    /**
    * Write debugging data to the console
    * @param message Debug message to be written
    */
    ABHttpServer.prototype.logDebug = function (message) {
        if (this.DEBUG) {
            var date = new Date();
            var timestamp = date.getFullYear() + '-' +
                this.dateTimePad((date.getMonth() + 1).toString(), 2) + '-' +
                this.dateTimePad(date.getDate().toString(), 2) + ' ' +
                this.dateTimePad(date.getHours().toString(), 2) + ':' +
                this.dateTimePad(date.getMinutes().toString(), 2) + ':' +
                this.dateTimePad(date.getSeconds().toString(), 2) + '.' +
                this.dateTimePad(date.getMilliseconds().toString(), 3);
            console.debug(timestamp + " " + CLASSNAME + (" " + message));
        }
    };
    /**
     * Right pad number
     * @param value
     * @param digits
     */
    ABHttpServer.prototype.dateTimePad = function (value, digits) {
        var number = value;
        while (number.toString().length < digits) {
            number = "0" + number;
        }
        return (number);
    };
    /**
     * Terminate the HTTP/HTTPS server
     */
    ABHttpServer.prototype.terminate = function () {
        if (!this.isActive) {
            return;
        }
        this.DEBUG ? this.logDebug('Invoked method terminate()') : true;
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
    };
    /**
     * Sends HTML data to the client
     * @param response    ServerResponse object
     * @param text        HTML to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    ABHttpServer.prototype.sendHTML = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'text/html', text, httpStatus);
    };
    /**
     * Sends plain text to the client
     * @param response
     * @param text      Text to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    ABHttpServer.prototype.sendText = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'text/plain', text, httpStatus);
    };
    /**
     * Sends json text to the client
     * @param response
     * @param jsonData    JSON data to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    ABHttpServer.prototype.sendJSON = function (response, jsonData, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.sendData(response, 'application/json', JSON.stringify(jsonData), httpStatus);
    };
    /**
     * Set HTTP headers to be added to every response
     *
     * Example:
     * this.setHeaders({'Access-Control-Allow-Origin': '*',
     *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
     *
     * @param httpHeaders HTTP Headers to be added
     */
    ABHttpServer.prototype.setHeaders = function (httpHeaders) {
        this.DEBUG ? this.logDebug("Invoked method setHeaders(" + httpHeaders + ")") : true;
        this.httpHeaders = httpHeaders;
    };
    /**
     * Writes the data with HTTP header
     * @param response      ServerResponse
     * @param mimeType      HTTP Content-Type
     * @param text          Data to be written
     * @param httpStatus    HTTP Status code (default = 200)
     */
    ABHttpServer.prototype.sendData = function (response, mimeType, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        this.DEBUG ? this.logDebug("Sending HTTP status " + httpStatus + " with " + text.length + " bytes of " + mimeType + " data") : true;
        if (!this.isActive) {
            return;
        }
        // Send additional HTTP headers
        if (!this.httpHeaders) {
            for (var key in this.httpHeaders) {
                response.setHeader(key, this.httpHeaders[key]);
            }
        }
        response.writeHead(httpStatus, { 'Content-Type': mimeType });
        response.end(text);
    };
    /**
     * Send HTTP 'Not Implemented' Error
     * @param method
     * @param response ServerResponse
     */
    ABHttpServer.prototype.notImplementedError = function (method, response) {
        var errorMessage = {
            component: CLASSNAME,
            error: "HTTP method " + method.toUpperCase() + " ist not supported by the server - Missing subclass implementation"
        };
        this.DEBUG ? this.logDebug(errorMessage.error) : true;
        this.sendJSON(response, errorMessage, 501);
    };
    // Event prototypes which can be overwritten in subclass
    ABHttpServer.prototype.clientConnect = function (socket) { };
    ABHttpServer.prototype.clientError = function (err, socket) { };
    // Method prototypes to be overwritten in subclass
    ABHttpServer.prototype.acl = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.baselinecontrol = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.bind = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.checkin = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.checkout = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.connect = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.copy = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype["delete"] = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.get = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.head = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.label = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.link = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.lock = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.merge = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.mkactivity = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.mkcalendar = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.mkcol = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.mkredirectref = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.mkworkspace = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.move = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.options = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.orderpatch = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.patch = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.post = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.pri = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.propfind = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.proppatch = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.put = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.rebind = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.report = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.search = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.trace = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.unbind = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.uncheckout = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.unlink = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.unlock = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.update = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.updateredirectref = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    ABHttpServer.prototype.versioncontrol = function (request, response) {
        this.notImplementedError(request.http.method, response);
    };
    return ABHttpServer;
}());
exports.ABHttpServer = ABHttpServer;
