/// <reference types="node" />
import { Socket } from 'net';
import Express = require('express');
/**
 * Simple HTTP Server Framework
*/
export declare abstract class ABHttpServer {
    private DEBUG;
    private app;
    private httpServer;
    private httpsServer;
    private httpHeaders;
    /**
     * Create the HTTP server
     * @param httpPort Port number (1 - 65535) for the HTTP server or 0
     * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
     */
    constructor(httpPort: number, httpsPort: number);
    /**
     * Establish server events and start the server
     * @param server  Server
     * @param port    TCP/IP port number
     * @param secure  SSL/TLS flag
     */
    private startServer;
    /**
    * Write debugging data to the console
    * @param message Debug message to be written
    */
    private logDebug;
    /**
     * Right pad number
     * @param value
     * @param digits
     */
    private dateTimePad;
    /**
     * Terminate the HTTP/HTTPS server
     */
    terminate(): void;
    /**
     * Returns the express handler
     * @returns Express handler
     */
    getapp(): any;
    /**
     * Sends HTML data to the client
     * @param response    Express.Response object
     * @param text        HTML to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    sendHTML(response: Express.Response, text: string, httpStatus?: number): void;
    /**
     * Sends plain text to the client
     * @param response
     * @param text      Text to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    sendText(response: Express.Response, text: string, httpStatus?: number): void;
    /**
     * Set HTTP headers to be added to every response
     *
     * Example:
     * this.setHeaders({'Access-Control-Allow-Origin': '*',
     *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
     *
     * @param httpHeaders HTTP Headers to be added
     */
    setHeaders(httpHeaders: any): void;
    /**
     * Writes the data with HTTP header
     * @param response      Express.Response
     * @param mimeType      HTTP Content-Type
     * @param text          Data to be written
     * @param httpStatus    HTTP Status code
     */
    private sendData;
    /**
     * Send HTTP 'Not Implemented' Error
     * @param method
     * @param response Express.response
     */
    private notImplementedError;
    clientConnect(socket: Socket): void;
    clientError(err: Error, socket: Socket): void;
    get(url: string, request: Express.Request, response: Express.Response): void;
    put(url: string, data: string, request: Express.Request, response: Express.Response): void;
    post(url: string, data: string, request: Express.Request, response: Express.Response): void;
    options(url: string, request: Express.Request, response: Express.Response): void;
    head(url: string, request: Express.Request, response: Express.Response): void;
    delete(url: string, data: string, request: Express.Request, response: Express.Response): void;
    connect(url: string, request: Express.Request, response: Express.Response): void;
    trace(url: string, request: Express.Request, response: Express.Response): void;
    patch(url: string, data: string, request: Express.Request, response: Express.Response): void;
}
