"use strict";
exports.__esModule = true;
var Express = require("express");
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
        var _this = this;
        this.DEBUG = (process.env.AB_DEBUG === 'true') ? true : false;
        this.app = Express();
        this.httpServer = null;
        this.httpsServer = null;
        this.httpHeaders = {};
        this.isActive = false;
        this.DEBUG ? this.logDebug("Constructor called (" + httpPort + ", " + httpsPort + ")") : true;
        var http = require('http');
        var https = require('https');
        var fs = require('fs');
        var path = require('path');
        // Check constructor arguments
        if (typeof arguments[0] !== 'number' || typeof arguments[1] !== 'number') {
            throw new Error('ABHttpServer: Usage is ABHttpServer(httpPort | 0, httpsPort | 0');
        }
        if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
            throw new Error('ABHttpServer: Both port arguments must be between 0 and 65535');
        }
        if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
            throw new Error('ABHttpServer: Both port arguments must have integer values');
        }
        if (arguments[0] === arguments[1]) {
            throw new Error('ABHttpServer: Both ports must not be equal');
        }
        if (arguments[0] === 0 && arguments[1] === 0) {
            throw new Error('ABHttpServer: At least one port must be non-zero');
        }
        // Start the HTTP server
        if (httpPort != 0) {
            this.DEBUG ? this.logDebug("Creating HTTP server on port " + httpPort) : true;
            this.httpServer = http.createServer(this.app);
            this.startServer(this.httpServer, httpPort, false);
        }
        // Start the HTTPS server
        if (httpsPort != 0) {
            this.DEBUG ? this.logDebug("Creating HTTPS server on port " + httpsPort) : true;
            var httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, 'x509-servercert.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'x509-certchain.pem'))
            };
            this.httpsServer = https.createServer(httpsOptions, this.app);
            this.startServer(this.httpsServer, httpsPort, true);
        }
        // Do not send Express HTTP header 'x-powered-by'
        this.app.disable('x-powered-by');
        // Handle all HTTP requests
        this.app.all('*', function (request, response) {
            _this.DEBUG ? _this.logDebug(request.protocol.toUpperCase() + " " + request.httpVersion + " " + request.method + " " + request.url) : true;
            switch (request.method) {
                case 'GET': {
                    _this.get(request.url, request, response);
                    break;
                }
                case 'HEAD': {
                    _this.head(request.url, request, response);
                    break;
                }
                case 'PUT': {
                    var requestData_1 = '';
                    request.on('data', function (dataChunk) {
                        requestData_1 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("PUT data received: " + requestData_1.length + " bytes") : true;
                        _this.put(request.url, requestData_1, request, response);
                    });
                    break;
                }
                case 'POST': {
                    var requestData_2 = '';
                    request.on('data', function (dataChunk) {
                        requestData_2 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("POST data received: " + requestData_2.length + " bytes") : true;
                        _this.post(request.url, requestData_2, request, response);
                    });
                    break;
                }
                case 'DELETE': {
                    var requestData_3 = '';
                    request.on('data', function (dataChunk) {
                        requestData_3 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("DELETE data received: " + requestData_3.length + " bytes") : true;
                        _this["delete"](request.url, requestData_3, request, response);
                    });
                    break;
                }
                case 'CONNECT': {
                    _this.connect(request.url, request, response);
                    break;
                }
                case 'TRACE': {
                    _this.trace(request.url, request, response);
                    break;
                }
                case 'PATCH': {
                    var requestData_4 = '';
                    request.on('data', function (dataChunk) {
                        requestData_4 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("PATCH data received: " + requestData_4.length + " bytes") : true;
                        _this.patch(request.url, requestData_4, request, response);
                    });
                    break;
                }
                case 'OPTIONS': {
                    _this.options(request.url, request, response);
                    break;
                }
                default: {
                    _this.DEBUG ? _this.logDebug("Unsupported HTTP method " + request.method) : true;
                    _this.sendText(response, "ABHttpServer: Unsupported HTTP method <" + request.method + ">", 501);
                }
            }
        });
        // Mark server active
        this.isActive = true;
    }
    /**
     * Establish server events and start the server
     * @param server  Server
     * @param port    TCP/IP port number
     * @param secure  SSL/TLS flag
     */
    ABHttpServer.prototype.startServer = function (server, port, secure) {
        var _this = this;
        // Establish net.Server event handlers
        server.on('error', function (error) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" (net.Server) server received error: " + error)) : true;
        });
        server.on('listening', function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + " (net.Server) server is in listen mode") : true;
        });
        // Establish http.Server event handlers
        server.on('checkContinue', function (request, response) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received <HTTP 100 continue>') : true;
            response.writeContinue();
        });
        server.on('checkExpectation', function (request, response) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received HTTP expect header') : true;
        });
        server.on('clientError', function (err, socket) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" (http.Server) client error: " + err)) : true;
            _this.clientError(err, socket);
        });
        server.on('close', function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server closed') : true;
        });
        server.on('connect', function (request, socket, head) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server accepted connection') : true;
        });
        server.on('connection', function (socket) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server established connection') : true;
        });
        server.on('request', function (request, response) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received client request') : true;
        });
        server.on('upgrade', function (request, socket, head) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received upgrade request') : true;
        });
        // Establish tls.server event handlers
        server.on('newSession', function (sessionId, sessionData, callback) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server started TLS session') : true;
            callback();
        });
        server.on('OCSPRequest', function (certificate, issuer, callback) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received certificate status request') : true;
            callback();
        });
        server.on('resumeSession', function (sessionId, callback) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received TLS resume session status request') : true;
            callback();
        });
        server.on('secureConnection', function (tlsSocket) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) completed TLS handshaking process') : true;
        });
        server.on('tlsClientError', function (exception, tlsSocket) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) received an error before successful connection') : true;
        });
        // Start the server
        server.listen(port, function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" server started on port " + port)) : true;
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
            console.debug(timestamp + " ABHttpServer: " + message);
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
     * Returns the express handler
     * @returns Express handler
     */
    ABHttpServer.prototype.getapp = function () {
        if (!this.isActive) {
            return null;
        }
        return this.app;
    };
    /**
     * Sends HTML data to the client
     * @param response    Express.Response object
     * @param text        HTML to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    ABHttpServer.prototype.sendHTML = function (response, text, httpStatus) {
        if (httpStatus === void 0) { httpStatus = 200; }
        if (!this.isActive) {
            return;
        }
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
        if (!this.isActive) {
            return;
        }
        this.sendData(response, 'text/plain', text, httpStatus);
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
        if (!this.isActive) {
            return;
        }
        this.DEBUG ? this.logDebug("Invoked method setHeaders(" + httpHeaders + ")") : true;
        this.httpHeaders = httpHeaders;
    };
    /**
     * Writes the data with HTTP header
     * @param response      Express.Response
     * @param mimeType      HTTP Content-Type
     * @param text          Data to be written
     * @param httpStatus    HTTP Status code
     */
    ABHttpServer.prototype.sendData = function (response, mimeType, text, httpStatus) {
        this.DEBUG ? this.logDebug("Sending HTTP status " + httpStatus + " with " + text.length + " bytes of " + mimeType + " data") : true;
        // Send additional HTTP headers
        if (!this.httpHeaders) {
            for (var key in this.httpHeaders) {
                response.set(key, this.httpHeaders[key]);
            }
        }
        response.writeHead(httpStatus, { 'Content-Type': mimeType });
        response.end(text);
    };
    /**
     * Send HTTP 'Not Implemented' Error
     * @param method
     * @param response Express.response
     */
    ABHttpServer.prototype.notImplementedError = function (method, response) {
        this.DEBUG ? this.logDebug("HTTP method " + method + " not implemented by subclass") : true;
        response.status(501).end("HTTP method " + method + " is not supported");
    };
    // Method prototypes to be overwritten in subclass
    ABHttpServer.prototype.clientConnect = function (socket) { };
    ABHttpServer.prototype.clientError = function (err, socket) { };
    ABHttpServer.prototype.get = function (url, request, response) {
        this.notImplementedError('GET', response);
    };
    ABHttpServer.prototype.put = function (url, data, request, response) {
        this.notImplementedError('PUT', response);
    };
    ABHttpServer.prototype.post = function (url, data, request, response) {
        this.notImplementedError('POST', response);
    };
    ABHttpServer.prototype.options = function (url, request, response) {
        this.notImplementedError('OPTIONS', response);
    };
    ABHttpServer.prototype.head = function (url, request, response) {
        this.notImplementedError('HEAD', response);
    };
    ABHttpServer.prototype["delete"] = function (url, data, request, response) {
        this.notImplementedError('DELETE', response);
    };
    ABHttpServer.prototype.connect = function (url, request, response) {
        this.notImplementedError('CONNECT', response);
    };
    ABHttpServer.prototype.trace = function (url, request, response) {
        this.notImplementedError('TRACE', response);
    };
    ABHttpServer.prototype.patch = function (url, data, request, response) {
        this.notImplementedError('PATCH', response);
    };
    return ABHttpServer;
}());
exports.ABHttpServer = ABHttpServer;
