/// <reference types="node" />
import { ServerResponse } from 'http';
import { Socket } from 'net';
export declare type ABRequest = {
    'server': {
        'hostname': string;
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
        'tlsVersion': string;
        'tlsCipher': string;
        'method': string;
        'headers': {};
        'cookies': {};
        'data': string;
    };
    'ip': {
        'protocol': string;
    };
    'url': {
        'path': string;
        'query': {};
    };
    'sessionId': '';
};
/**
 * Abstract class to be implemented/subclassed by the user
*/
export declare abstract class ABHttpServer {
    private DEBUG;
    private httpServer;
    private httpsServer;
    private httpHeaders;
    private pingEnabled;
    private httpStatistics;
    /**
     * Create the HTTP server
     * @param {httpPort} Port number (1 - 65535) for the HTTP server or 0
     * @param {httpsPort} Port number (1 - 65535) for the HTTPS server or 0
     * @returns {ABHttpServer} Object
     */
    constructor(httpPort?: number, httpsPort?: number);
    /**
     * Disable /api/ping support
     * @param {void}
     * @returns {void}
     */
    disablePing(): void;
    /**
     * Return string of object
     * @param {void}
     * @returns {string} String representation of ABHttpServer object
     */
    toString(): string;
    /**
     * Return the server statistics
     * @param {void}
     * @returns {statistics} JSON object with server statistics
     */
    getStatistics(): {};
    /**
     * Establish server events and start the server
     * @param {server}  Server
     * @param {port}    TCP/IP port number
     * @returns {void}
     */
    private startServer;
    /**
     * Handle all HTTP requests
     * @param {request}   IncomingMessage object
     * @param {response}  ServerResponse object
     * @returns {void}
     */
    private processHttpRequest;
    /**
    * Write debugging data to the console
    * @param {message}  Debug message to be written
    * @returns {void}
    */
    private logDebug;
    /**
     * Sends HTML data to the client
     * @param {response}    ServerResponse object
     * @param {text}        HTML to be sent
     * @param {httpStatus}  HTTP Status code (defaults to 200)
     * @returns {void}
     */
    sendHTML(response: ServerResponse, text: string, httpStatus?: number): void;
    /**
     * Sends plain text to the client
     * @param {response}    ServerResponse object
     * @param {text}        Text to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     * @returns {void}
     */
    sendText(response: ServerResponse, text: string, httpStatus?: number): void;
    /**
     * Sends JSON data to the client
     * @param {response}    ServerResponse object
     * @param {jsonData}    JSON data to be sent
     * @param {httpStatus}  HTTP status code (defaults to 200)
     * @returns {void}
     */
    sendJSON(response: ServerResponse, jsonData: {}, httpStatus?: number): void;
    /**
     * Sends error message as JSON object to the client
     * @param {response}      ServerResponse object
     * @param {errorMessage}  Error message
     * @param {httpStatus}    HTTP status code (defaults to 200)
     * @returns {void}
     */
    private sendError;
    /**
     * Redirect to new URL
     * @param {response}    ServerResponse object
     * @param {string}      URL to redirect
     * @returns {void}
     */
    redirectUrl(response: ServerResponse, redirectUrl: string): void;
    /**
     * Send the specified file to the client
     * @param {response}    ServerResponse object
     * @param {filePath}    File name with path
     * @param {fileRoot}    Check sanitized path with this root directory, defaults to __dirname
     * @param {mimeType}    MIME Type, default is set based on file name extension
     * @returns {void}
     */
    sendFile(response: ServerResponse, filePath: string, fileRoot?: string, mimeType?: string): void;
    /**
     * Return content of a given file
     * @param {filePath}    File name with path
     * @param {fileRoot}    Check path with this root directory, defaults to __dirname
     * @param {callback}    Callback function (Error, Buffer)
     * @returns {void}
     */
    readFile(filePath: string, fileRoot: string, callback: Function): void;
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
    setHeaders(httpHeaders: {}): void;
    /**
     * Writes the data with HTTP headers
     * @param {response}      ServerResponse
     * @param {mimeType}      HTTP Content-Type
     * @param {text}          Data to be written
     * @param {httpStatus}    HTTP Status code (default = 200)
     * @param {headers}       Additional HTTP headers (default = {})
     * @returns{void}
     */
    private sendData;
    clientError(err: Error, socket: Socket | undefined): void;
    acl(request: ABRequest, response: ServerResponse): any;
    baselinecontrol(request: ABRequest, response: ServerResponse): any;
    bind(request: ABRequest, response: ServerResponse): any;
    checkin(request: ABRequest, response: ServerResponse): any;
    checkout(request: ABRequest, response: ServerResponse): any;
    connect(request: ABRequest, response: ServerResponse): any;
    copy(request: ABRequest, response: ServerResponse): any;
    delete(request: ABRequest, response: ServerResponse): any;
    get(request: ABRequest, response: ServerResponse): any;
    head(request: ABRequest, response: ServerResponse): any;
    label(request: ABRequest, response: ServerResponse): any;
    link(request: ABRequest, response: ServerResponse): any;
    lock(request: ABRequest, response: ServerResponse): any;
    merge(request: ABRequest, response: ServerResponse): any;
    mkactivity(request: ABRequest, response: ServerResponse): any;
    mkcalendar(request: ABRequest, response: ServerResponse): any;
    mkcol(request: ABRequest, response: ServerResponse): any;
    mkredirectref(request: ABRequest, response: ServerResponse): any;
    mkworkspace(request: ABRequest, response: ServerResponse): any;
    move(request: ABRequest, response: ServerResponse): any;
    options(request: ABRequest, response: ServerResponse): any;
    orderpatch(request: ABRequest, response: ServerResponse): any;
    patch(request: ABRequest, response: ServerResponse): any;
    post(request: ABRequest, response: ServerResponse): any;
    pri(request: ABRequest, response: ServerResponse): any;
    propfind(request: ABRequest, response: ServerResponse): any;
    proppatch(request: ABRequest, response: ServerResponse): any;
    put(request: ABRequest, response: ServerResponse): any;
    rebind(request: ABRequest, response: ServerResponse): any;
    report(request: ABRequest, response: ServerResponse): any;
    search(request: ABRequest, response: ServerResponse): any;
    trace(request: ABRequest, response: ServerResponse): any;
    unbind(request: ABRequest, response: ServerResponse): any;
    uncheckout(request: ABRequest, response: ServerResponse): any;
    unlink(request: ABRequest, response: ServerResponse): any;
    unlock(request: ABRequest, response: ServerResponse): any;
    update(request: ABRequest, response: ServerResponse): any;
    updateredirectref(request: ABRequest, response: ServerResponse): any;
    versioncontrol(request: ABRequest, response: ServerResponse): any;
    allMethods(request: ABRequest, response: ServerResponse): any;
}
