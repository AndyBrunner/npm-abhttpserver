/// <reference types="node" />
import { Socket } from 'net';
import { ServerResponse } from 'http';
export declare type ABRequest = {
    'server': {
        'address': string;
        'port': string;
    };
    'client': {
        'address': string;
        'port': string;
    };
    'http': {
        'version': string;
        'tls': boolean;
        'method': string;
        'headers': {};
        'data': string;
    };
    'ip': {
        'protocol': string;
    };
    'url': {
        'path': string;
        'query': {};
    };
};
/**
 * Abstract class to be implemented/subclassed by the user
*/
export declare abstract class ABHttpServer {
    private DEBUG;
    private httpServer;
    private httpsServer;
    private httpHeaders;
    private isActive;
    private httpStatistics;
    /**
     * Create the HTTP server
     * @param httpPort Port number (1 - 65535) for the HTTP server or 0
     * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
     */
    constructor(httpPort?: number, httpsPort?: number);
    /**
     * Return string of object
     */
    toString(): string;
    /**
     * Return the server statistics
     */
    getStatistics(): {
        request: {
            http: {
                count: number;
                bytes: number;
            };
            https: {
                count: number;
                bytes: number;
            };
        };
        response: {
            count: number;
            bytes: number;
        };
    };
    /**
     * Establish server events and start the server
     * @param server  Server
     * @param port    TCP/IP port number
     * @param secure  TLS flag (default = false)
     */
    private startServer;
    private processHttpRequest;
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
     * Sends HTML data to the client
     * @param response    ServerResponse object
     * @param text        HTML to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    sendHTML(response: ServerResponse, text: string, httpStatus?: number): void;
    /**
     * Sends plain text to the client
     * @param response
     * @param text      Text to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    sendText(response: ServerResponse, text: string, httpStatus?: number): void;
    /**
     * Sends json text to the client
     * @param response
     * @param jsonData    JSON data to be sent
     * @param httpStatus  HTTP Status code (defaults to 200)
     */
    sendJSON(response: ServerResponse, jsonData: {}, httpStatus?: number): void;
    /**
     * Set HTTP headers to be added to every response
     *
     * Example:
     * this.setHeaders({'Access-Control-Allow-Origin': '*',
     *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
     *
     * @param httpHeaders HTTP Headers to be added
     */
    setHeaders(httpHeaders: {}): void;
    /**
     * Writes the data with HTTP header
     * @param response      ServerResponse
     * @param mimeType      HTTP Content-Type
     * @param text          Data to be written
     * @param httpStatus    HTTP Status code (default = 200)
     */
    private sendData;
    clientConnect(socket: Socket): void;
    clientError(err: Error, socket: Socket): void;
    allMethods(request: ABRequest, response: ServerResponse): void;
    acl(request: ABRequest, response: ServerResponse): void;
    baselinecontrol(request: ABRequest, response: ServerResponse): void;
    bind(request: ABRequest, response: ServerResponse): void;
    checkin(request: ABRequest, response: ServerResponse): void;
    checkout(request: ABRequest, response: ServerResponse): void;
    connect(request: ABRequest, response: ServerResponse): void;
    copy(request: ABRequest, response: ServerResponse): void;
    delete(request: ABRequest, response: ServerResponse): void;
    get(request: ABRequest, response: ServerResponse): void;
    head(request: ABRequest, response: ServerResponse): void;
    label(request: ABRequest, response: ServerResponse): void;
    link(request: ABRequest, response: ServerResponse): void;
    lock(request: ABRequest, response: ServerResponse): void;
    merge(request: ABRequest, response: ServerResponse): void;
    mkactivity(request: ABRequest, response: ServerResponse): void;
    mkcalendar(request: ABRequest, response: ServerResponse): void;
    mkcol(request: ABRequest, response: ServerResponse): void;
    mkredirectref(request: ABRequest, response: ServerResponse): void;
    mkworkspace(request: ABRequest, response: ServerResponse): void;
    move(request: ABRequest, response: ServerResponse): void;
    options(request: ABRequest, response: ServerResponse): void;
    orderpatch(request: ABRequest, response: ServerResponse): void;
    patch(request: ABRequest, response: ServerResponse): void;
    post(request: ABRequest, response: ServerResponse): void;
    pri(request: ABRequest, response: ServerResponse): void;
    propfind(request: ABRequest, response: ServerResponse): void;
    proppatch(request: ABRequest, response: ServerResponse): void;
    put(request: ABRequest, response: ServerResponse): void;
    rebind(request: ABRequest, response: ServerResponse): void;
    report(request: ABRequest, response: ServerResponse): void;
    search(request: ABRequest, response: ServerResponse): void;
    trace(request: ABRequest, response: ServerResponse): void;
    unbind(request: ABRequest, response: ServerResponse): void;
    uncheckout(request: ABRequest, response: ServerResponse): void;
    unlink(request: ABRequest, response: ServerResponse): void;
    unlock(request: ABRequest, response: ServerResponse): void;
    update(request: ABRequest, response: ServerResponse): void;
    updateredirectref(request: ABRequest, response: ServerResponse): void;
    versioncontrol(request: ABRequest, response: ServerResponse): void;
}
