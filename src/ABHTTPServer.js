"use strict";
exports.__esModule = true;
/*
Simple HTTP Server Framework
*/
/**
 * ABHTTPServer Abstract Class
 */
var ABHTTPServer = /** @class */ (function () {
    /**
     * Create the HTTP server
     * @param httpPort Port number (1 - 65535) for the HTTP server or 0
     * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
     */
    function ABHTTPServer(httpPort, httpsPort) {
        var _this = this;
        this.DEBUG = (process.env.AB_DEBUG === 'true') ? true : false;
        this.express = require('express');
        this.app = this.express();
        this.httpServer = null;
        this.httpsServer = null;
        this.DEBUG ? this.logDebug("Constructor called with (" + httpPort + ", " + httpPort + ")") : true;
        var http = require('http');
        var https = require('https');
        var fs = require('fs');
        var path = require('path');
        /* Check constructor arguments */
        if (typeof arguments[0] !== 'number' || typeof arguments[1] !== 'number') {
            this.DEBUG ? this.logDebug('Usage is ABHTTPServer(httpPort | 0, httpsPort | 0') : true;
            return (undefined);
        }
        if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
            this.DEBUG ? this.logDebug('Both port arguments must be between 0 and 65535') : true;
            return (undefined);
        }
        if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
            this.DEBUG ? this.logDebug('Both port arguments must have integer values') : true;
            return (undefined);
        }
        if (arguments[0] === arguments[1]) {
            this.DEBUG ? this.logDebug('Both ports must not be equal') : true;
            return (undefined);
        }
        if (arguments[0] === 0 && arguments[1] === 0) {
            this.DEBUG ? this.logDebug('At least one port must be non-zero') : true;
            return (undefined);
        }
        /* Start the HTTP server */
        if (httpPort != 0) {
            this.DEBUG ? this.logDebug("Creating HTTP server on port " + httpPort) : true;
            this.httpServer = http.createServer(this.app);
            this.startServer(this.httpServer, httpPort, false);
        }
        /* Start the HTTPS server */
        if (httpsPort != 0) {
            this.DEBUG ? this.logDebug("Creating HTTPS server on port " + httpsPort) : true;
            var httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, 'x509-servercert.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'x509-certchain.pem'))
                /* Add "allowHTTP1: true" when using the http2 module */
            };
            this.httpsServer = https.createServer(httpsOptions, this.app);
            this.startServer(this.httpsServer, httpsPort, true);
        }
        /* Handle all HTTP requests */
        this.app.all('*', function (request, response) {
            _this.DEBUG ? _this.logDebug(request.protocol.toUpperCase() + " " + request.httpVersion + " " + request.method + " " + request.url) : true;
            switch (request.method) {
                /* Method GET */
                case 'GET': {
                    _this.get(request.url, request, response);
                    break;
                }
                /* Method HEAD */
                case 'HEAD': {
                    _this.head(request.url, request, response);
                    break;
                }
                /* Method PUT */
                case 'PUT': {
                    var postData_1 = '';
                    request.on('data', function (dataChunk) {
                        postData_1 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("Received PUT data size: " + postData_1.length + " bytes") : true;
                    });
                    _this.put(request.url, postData_1, request, response);
                    break;
                }
                /* Method POST */
                case 'POST': {
                    var postData_2 = '';
                    request.on('data', function (dataChunk) {
                        postData_2 += dataChunk;
                    });
                    request.on('end', function () {
                        _this.DEBUG ? _this.logDebug("Received POST data size: " + postData_2.length + " bytes") : true;
                    });
                    _this.post(request.url, postData_2, request, response);
                    break;
                }
                /* Method DELETE */
                case 'DELETE': {
                    _this["delete"](request.url, request, response);
                    break;
                }
                /* Method CONNECT */
                case 'CONNECT': {
                    _this.connect(request.url, request, response);
                    break;
                }
                /* Method TRACE */
                case 'TRACE': {
                    _this.trace(request.url, request, response);
                    break;
                }
                /* Method PATCH */
                case 'PATCH': {
                    _this.patch(request.url, request, response);
                    break;
                }
                /* Method OPTIONS */
                case 'OPTIONS': {
                    _this.options(request.url, request, response);
                    break;
                }
                default: {
                    _this.DEBUG ? _this.logDebug("Unhandled HTTP method " + request.method) : true;
                    _this.sendText(response, "Unhandled HTTP method <" + request.method + ">");
                }
            }
        });
    }
    /**
     * Establish server events and start the server
     * @param server  Server
     * @param port    TCP/IP port number
     * @param secure  SSL/TLS flag
     */
    ABHTTPServer.prototype.startServer = function (server, port, secure) {
        var _this = this;
        /* Establish net.Server event handlers */
        server.on('error', function (error) {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" (net.Server) server received error: " + error)) : true;
        });
        server.on('listening', function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + " (net.Server) server is in listen mode") : true;
        });
        /* Establish http.Server event handlers */
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
        /* Establish tls.server event handlers */
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
        /* Start the server */
        server.listen(port, function () {
            _this.DEBUG ? _this.logDebug('HTTP' + (secure ? 'S' : '') + (" server started on port " + port)) : true;
        });
    };
    /**
    * Write debugging data to the console
    * @param message Debug message to be written
    */
    ABHTTPServer.prototype.logDebug = function (message) {
        if (this.DEBUG) {
            var date = new Date();
            var timestamp = date.getFullYear() + '-' +
                this.dateTimePad((date.getMonth() + 1), 2) + '-' +
                this.dateTimePad(date.getDate(), 2) + ' ' +
                this.dateTimePad(date.getHours(), 2) + ':' +
                this.dateTimePad(date.getMinutes(), 2) + ':' +
                this.dateTimePad(date.getSeconds(), 2) + '.' +
                this.dateTimePad(date.getMilliseconds(), 3);
            console.log(timestamp + " ABHTTPSERVER Debug: " + message);
        }
    };
    /**
     * Right pad number
     * @param value
     * @param digits
     */
    ABHTTPServer.prototype.dateTimePad = function (value, digits) {
        var number = value;
        while (number.toString().length < digits) {
            number = "0" + number;
        }
        return (number);
    };
    /**
     * Terminate the HTTP/HTTPS server
     */
    ABHTTPServer.prototype.terminate = function () {
        /* Stop HTTP server */
        if (this.httpServer !== null) {
            this.httpServer.close();
            this.httpServer = null;
        }
        /* Stop HTTPS server */
        if (this.httpsServer !== null) {
            this.httpsServer.close();
            this.httpsServer = null;
        }
    };
    /**
     * Returns the express handler
     * @returns Express handler
     */
    ABHTTPServer.prototype.getapp = function () {
        return this.app;
    };
    /**
     * Sends HTML data to the client
     * @param response
     * @param text      HTML to be sent
     */
    ABHTTPServer.prototype.sendHTML = function (response, text) {
        response.setHeader('Content-Type', 'text/html');
        response.end(text);
    };
    /**
     * Sends plain text to the client
     * @param response
     * @param text      Text to be sent
     */
    ABHTTPServer.prototype.sendText = function (response, text) {
        response.setHeader('Content-Type', 'text/plain');
        response.end(text);
    };
    /* Method prototypes to be overwritten/implemented in subclass */
    ABHTTPServer.prototype.clientConnect = function (socket) { };
    ABHTTPServer.prototype.clientError = function (err, socket) { };
    ABHTTPServer.prototype.get = function (url, request, response) { };
    ABHTTPServer.prototype.put = function (url, data, request, response) { };
    ABHTTPServer.prototype.post = function (url, data, request, response) { };
    ABHTTPServer.prototype.options = function (url, request, response) { };
    ABHTTPServer.prototype.head = function (url, request, response) { };
    ABHTTPServer.prototype["delete"] = function (url, request, response) { };
    ABHTTPServer.prototype.connect = function (url, request, response) { };
    ABHTTPServer.prototype.trace = function (url, request, response) { };
    ABHTTPServer.prototype.patch = function (url, request, response) { };
    return ABHTTPServer;
}());
exports["default"] = ABHTTPServer;
