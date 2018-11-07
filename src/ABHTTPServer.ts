import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net'
import { TLSSocket } from 'tls';
import { Stats } from 'fs';

/**
 * Simple HTTP Server Framework
*/

// Global constants
const CLASSNAME = 'ABHttpServer'
const VERSION = '2.0.2'           //TODO: Class version number

// Data collected at HTTP request time and passed to every user method
export type ABRequest = {
  'version': string,
  'server': {
    'address': string,
    'port': string,
  },
  'client': {
    'address': string,
    'port': string,
  },
  'http': {
    'version': string,
    'tls': boolean,
    'method': string,
    'headers': {},
    'data': string,
  },
  'ip': {
    'protocol': string,
  },
  'url': {
    'path': string,
    'query': {}
  }
}

/**
 * Abstract class to be implemented/subclassed by the user
*/
export abstract class ABHttpServer {

  private DEBUG: boolean = (process.env.AB_DEBUG === 'true') ? true : false
  private httpServer: any = null
  private httpsServer: any = null
  private httpHeaders: any = {}
  private isActive: boolean = false
  
  // Collect some HTTP statistics
  private httpStatistics = {
    request: {
      http: {
        count: 0,
        bytes: 0,
      },
      https: {
        count: 0,
        bytes: 0,
      }
    },
    response: {
      count: 0,
      bytes: 0
    }
  }

  /**
   * Create the HTTP server
   * @param {httpPort} Port number (1 - 65535) for the HTTP server or 0
   * @param {httpsPort} Port number (1 - 65535) for the HTTPS server or 0
   */
  constructor(httpPort: number = 0, httpsPort: number = 0) {

    this.DEBUG ? this.logDebug(`Object constructor called (${httpPort}, ${httpsPort})`) : true

    const http = require('http')
    const https = require('http2')
    const fs = require('fs')
    const path = require('path')
   
    // Check constructor arguments
    if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
      throw new RangeError(CLASSNAME + ': Both port arguments must be between 0 and 65535')
    }
    if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
      throw new RangeError(CLASSNAME + ': Both port arguments must have integer values')
    }
    if (arguments[0] === arguments[1]) {
      throw new RangeError(CLASSNAME + ': Both ports must not be equal')
    }
    if (arguments[0] === 0 && arguments[1] === 0) {
      throw new RangeError(CLASSNAME + ': At least one port must be non-zero')
    }
    
    // Start the HTTP server
    if (httpPort !== 0) {

      this.DEBUG ? this.logDebug(`Creating HTTP server on port ${httpPort}`) : true

      this.httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
        this.processHttpRequest(request, response)
      })
      this.startServer(this.httpServer, httpPort)
    }

    // Start the HTTPS server
    if (httpsPort !== 0) {

      this.DEBUG ? this.logDebug(`Creating HTTPS server on port ${httpsPort}`) : true
  
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
        allowHTTP1: true
      }

      this.httpsServer = https.createSecureServer(httpsOptions, (request: IncomingMessage, response: ServerResponse) => {
        this.processHttpRequest(request, response)
      })
      this.startServer(this.httpsServer, httpsPort, true)
    }

    // Mark server active
    this.isActive = true
  }

  /**
   * Return string of object
   * @param {-}
   * @returns {string} String representation of object
   */
  toString(): string {
    let status: string = ''

    status += `HTTP: ${this.httpServer ? 'true' : 'false'}, `
    status += `HTTPS: ${this.httpsServer ? 'true' : 'false'}, `
    status += `Active: ${this.isActive ? 'true' : 'false'}, `
    status += `AB_DEBUG: ${this.DEBUG ? 'true' : 'false'}`
    
    return `${CLASSNAME}[${status}]`
  }

  /**
   * Return the server statistics
   * @param {-}
   * @returns {statistics} JSON object with server statistics
   */
  getStatistics(): any {
    return this.httpStatistics
  }

  /**
   * Establish server events and start the server
   * @param {server}  Server
   * @param {port}    TCP/IP port number
   * @param {secure}  TLS flag (default = false)
   */
  private startServer(server: any, port: number, secure: boolean = false): void {

    // Establish server event
    server.on('clientError', (err: Error, socket: Socket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` http.Server client error: ${err}`) : true
      this.clientError(err, socket)
    })

    // Establish server events for debugging
    if (this.DEBUG) {

      // Establish net.Server event handlers
      server.on('error', (error: Error) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` net.Server received error: ${error}`) : true
      })
      server.on('listening', () => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` net.Server server is in listen mode`) : true
      })

      // Establish http.Server event handlers
      server.on('checkContinue', (request: IncomingMessage, response: ServerResponse) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received <HTTP 100 continue>') : true
        response.writeContinue()
      })
      server.on('checkExpectation', (request: IncomingMessage, response: ServerResponse) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received HTTP expect header') : true
      })
      server.on('close', () => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server closed') : true
      })
      server.on('connect', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server accepted connection') : true
      })
      server.on('connection', (socket: Socket) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server established connection') : true
      })
      server.on('request', (request: IncomingMessage, response: ServerResponse) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received client request') : true
      })
      server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' http.Server server received upgrade request') : true
      })

      // Establish tls.server event handlers
      server.on('newSession', (sessionId: any, sessionData: any, callback: Function) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server started TLS session') : true
        callback()
      })
      server.on('OCSPRequest', (certificate: any, issuer: any, callback: Function) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server received certificate status request') : true
        callback()
      })
      server.on('resumeSession', (sessionId: any, callback: Function) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server server received TLS resume session status request') : true
        callback()
      })
      server.on('secureConnection', (tlsSocket: TLSSocket) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server completed TLS handshaking process') : true
      })
      server.on('tlsClientError', (exception: Error, tlsSocket: TLSSocket) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server received an error before successful connection') : true
      })
    }

    // Start the server
    server.listen(port, () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` server started on port ${port}`) : true
    })
  }
    
  /**
   * Handle all HTTP requests 
   * @param {request}   IncomingMessage object
   * @param {response}  ServerResponse object
   */
  private processHttpRequest(request: IncomingMessage, response: ServerResponse): void {

    const url = require('url')
    const { StringDecoder } = require('string_decoder')
  
    // Supported HTTP methods based upon HTTP Method Registry at
    // http://www.iana.org/assignments/http-methods/http-methods.xhtml
    const httpMethods = {
      'acl': () => { this.acl(requestData, response) },
      'baseline-control': () => { this.baselinecontrol(requestData, response) },
      'bind': () => { this.bind(requestData, response) },
      'checkin': () => { this.checkin(requestData, response) },
      'checkout': () => { this.checkout(requestData, response) },
      'connect': () => { this.connect(requestData, response) },
      'copy': () => { this.copy(requestData, response) },
      'delete': () => { this.delete(requestData, response) },
      'get': () => { this.get(requestData, response) },
      'head': () => { this.head(requestData, response) },
      'label': () => { this.label(requestData, response) },
      'link': () => { this.link(requestData, response) },
      'lock': () => { this.lock(requestData, response) },
      'merge': () => { this.merge(requestData, response) },
      'mkactivity': () => { this.mkactivity(requestData, response) },
      'mkcalendar': () => { this.mkcalendar(requestData, response) },
      'mkcol': () => { this.mkcol(requestData, response) },
      'mkredirectref': () => { this.mkredirectref(requestData, response) },
      'mkworkspace': () => { this.mkworkspace(requestData, response) },
      'move': () => { this.move(requestData, response) },
      'options': () => { this.options(requestData, response) },
      'orderpatch': () => { this.orderpatch(requestData, response) },
      'patch': () => { this.patch(requestData, response) },
      'post': () => { this.post(requestData, response) },
      'pri': () => { this.pri(requestData, response) },
      'propfind': () => { this.propfind(requestData, response) },
      'proppatch': () => { this.proppatch(requestData, response) },
      'put': () => { this.put(requestData, response) },
      'rebind': () => { this.rebind(requestData, response) },
      'report': () => { this.report(requestData, response) },
      'search': () => { this.search(requestData, response) },
      'trace': () => { this.trace(requestData, response) },
      'unbind': () => { this.unbind(requestData, response) },
      'uncheckout': () => { this.uncheckout(requestData, response) },
      'unlink': () => { this.unlink(requestData, response) },
      'unlock': () => { this.unlock(requestData, response) },
      'update': () => { this.update(requestData, response) },
      'updateredirectref': () => { this.updateredirectref(requestData, response) },
      'version-control': () => { this.versioncontrol(requestData, response) },
    }

    // Parse the url
    const parsedUrl: any = url.parse(request.url)

    // Build a container holding all the data of the request
    const requestData: ABRequest = {
      'version': VERSION,
      'server': {
        'address': request.socket.localAddress || '',
        'port': request.socket.localPort.toString() || '',
      },
      'client': {
        'address': request.socket.remoteAddress || '',
        'port': request.socket.remotePort!.toString() || '',
      },
      'http': {
        'version': request.httpVersion || '',
        'tls': (request.socket instanceof TLSSocket) ? true : false,
        'method': request.method!.toLowerCase() || '',
        'headers': request.headers || '',
        'data': '',
      },
      'ip': {
        'protocol': request.socket.remoteFamily!.toLowerCase() || '',
      },
      'url': {
        'path': decodeURI(parsedUrl.pathname).replace(/^\/+|\/+$/g, '').trim()  || '',
        'query': {}
      }
    }

    // Construct key/value object from HTTP querystring (if present)
    if (parsedUrl.query) {
      let keyvalues = parsedUrl.query.split('&')
      for (let index = 0; index < keyvalues.length; index++) {
        let keyvalue = keyvalues[index].split('=');
        (<any>requestData.url.query)[keyvalue[0]] = keyvalue[1];
      }
    }

    // Get the http payload (if present)
    const decoder: any = new StringDecoder('utf8')

    request.on('data', (dataChunk: string) => {
      requestData.http.data += decoder.write(dataChunk)
    })
    request.on('end', () => {
      requestData.http.data += decoder.end()

      const contentLength: number = requestData.http.data.length

      this.DEBUG ? this.logDebug(`<= HTTP/${requestData.http.version} (${requestData.http.tls ? '' : 'Non-'}TLS) - Method ${requestData.http.method.toUpperCase()} - URL /${requestData.url.path} - Content-Length ${contentLength}`) : true
      
      // Update statistics
      if (requestData.http.tls) {
        this.httpStatistics.request.https.count++
        this.httpStatistics.request.https.bytes += contentLength
      } else {
        this.httpStatistics.request.http.count++
        this.httpStatistics.request.http.bytes += contentLength
      }
      
      // Get the specific function to handle the HTTP method
      let methodFunction: any = (<any>httpMethods)[requestData.http.method]

      // Return an HTTP 501 error if the HTTP method is not defined 
      if (typeof (methodFunction) === 'undefined') {
        this.sendError(response, `The server does not support the HTTP method ${requestData.http.method.toUpperCase()}`, 501)
        return
      }

      // Call the HTTP method function which should be overwitten/implemented by the users subclass
      // If the user does not overwrite the default function, an HTTP 501 error will be sent
      methodFunction()
    })
  }

  /**
  * Write debugging data to the console
  * @param {message}  Debug message to be written
  */
  private logDebug(message: string): void {
    this.DEBUG ? console.debug(`${new Date().toISOString()} ${CLASSNAME}: ${message}`) : true
  }

  /**
   * Terminate the HTTP/HTTPS server
   * @param {-}
   */
  terminate(): void {

    if (!this.isActive) {
      return
    }

    this.DEBUG ? this.logDebug('Method terminate() called') : true

    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }

    if (this.httpsServer) {
      this.httpsServer.close()
      this.httpsServer = null
    }

    // Mark server inactive
    this.isActive = false

    // Call user method (if present)
    this.shutdown()
  }

  /**
   * Sends HTML data to the client
   * @param {response}    ServerResponse object
   * @param {text}        HTML to be sent
   * @param {httpStatus}  HTTP Status code (defaults to 200)
   */
  sendHTML(response: ServerResponse, text: string, httpStatus: number = 200): void {
    this.sendData(response, 'text/html', text, httpStatus)
  }

  /**
   * Sends plain text to the client
   * @param {response}    ServerResponse object
   * @param {text}        Text to be sent
   * @param {httpStatus}  HTTP status code (defaults to 200)
   */
  sendText(response: ServerResponse, text: string, httpStatus: number = 200): void {
    this.sendData(response, 'text/plain', text, httpStatus)
  }

  /**
   * Sends JSON data to the client
   * @param {response}    ServerResponse object
   * @param {jsonData}    JSON data to be sent
   * @param {httpStatus}  HTTP status code (defaults to 200)
   */
  sendJSON(response: ServerResponse, jsonData: {}, httpStatus: number = 200): void {
    this.sendData(response, 'application/json', JSON.stringify(jsonData), httpStatus)
  }

  /**
   * Sends error message as JSON object to the client
   * @param {response}      ServerResponse object
   * @param {errorMessage}  Error message
   * @param {httpStatus}    HTTP status code (defaults to 200)
   */
  private sendError(response: ServerResponse, errorMessage: string, httpStatus: number = 200): void {
    this.sendJSON(response, {
      'time': new Date().toISOString(),
      'httpStatus': httpStatus,
      'component': CLASSNAME,
      'error': errorMessage
    }, httpStatus)
  }

  /**
   * Sends not-implemented error message to the client
   * @param {request}       ABRequest object
   * @param {response}      ServerResponse object
   */
  private sendNotImplementedError(request: ABRequest, response: ServerResponse): void {
    this.sendError(response, `No user subclass implementation for HTTP method ${request.http.method.toUpperCase()}`, 501)
  }

  /**
   * Send the specified file to the client
   * @param {response}    ServerResponse object
   * @param {filePath}    File name with path
   * @param {fileRoot}    Check sanitized path with this root directory, defaults to __dirname
   * @param {mimeType}    MIME Type, default is set based on file name extension
   */
  sendFile(response: ServerResponse, filePath: string, fileRoot: string = __dirname, mimeType: string = ''): void {

    const path = require('path')
    const fs = require('fs')
    
    // File extention to MIME types mapping
    const mimeTypes = {
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
      this.sendError(response, `The filename ${filePath} contains invalid characters`, 400)
      return
    }

    // Normalize the filepath
    const filePathNormalized: String = path.resolve(filePath)

    // Check for empty or missing file name
    if (filePath === '') {
      this.sendError(response, `No filename specified`, 400)
      return
    }

    // Check if file path is outside of the base path - Return 400 Bad Request
    if (filePathNormalized.indexOf(fileRoot) === -1) {
      this.sendError(response, `The file ${filePathNormalized} is outside of the base file path`, 400)
      return
    }

    // Get file statistics
    fs.stat(filePathNormalized, (fileError: Error, fileStats: Stats) => {
      // Check if file exist - Return 404 Bad Request
      if (fileError) {
        this.sendError(response, `The file ${filePathNormalized} does not exist`, 404)
        return
      }
      // Check if file is a directory - Return 400 Bad Request
      if (fileStats.isDirectory()) {
        this.sendError(response, `The file ${filePathNormalized} specifies a directory`, 400)
        return
      }

      // Read content of file
      fs.readFile(filePathNormalized, (readError: Error, data: string) => {
        // File can not be read - Return 500 (Internal Server Error)
        if (readError) {
          this.sendError(response, `The file ${filePathNormalized} could not be read`, 500)
          return
        }

        // Set the MIME type corresponding to the file name if not specified
        if (mimeType === '') {
          var fileExtension: string = path.parse(filePathNormalized).ext.toLowerCase()
          mimeType = (<any>mimeTypes)[fileExtension] || 'text/plain'
        }

        // Send the file with a matching content type
        this.sendData(response, mimeType, data)
      });
    })
  }  

  /**
   * Set HTTP headers to be added to every response
   * 
   * Example:
   * this.setHeaders({'Access-Control-Allow-Origin': '*',
   *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
   * 
   * @param {httpHeaders} HTTP Headers to be added
   */
  setHeaders(httpHeaders: {}): void {
    this.DEBUG ? this.logDebug(`Invoked method setHeaders(${httpHeaders})`) : true

    this.httpHeaders = httpHeaders
    return
  }

  /**
   * Writes the data with HTTP headers
   * @param {response}      ServerResponse
   * @param {mimeType}      HTTP Content-Type
   * @param {text}          Data to be written
   * @param {httpStatus}    HTTP Status code (default = 200)
   */
  private sendData(response: ServerResponse, mimeType: string, text: string, httpStatus: number = 200): void {

    // Get length of data to be sent
    let contentLength: number = text.length

    this.DEBUG ? this.logDebug(`=> HTTP Status ${httpStatus} - Content-Length ${contentLength} - Content-Type ${mimeType}`) : true

    if (!this.isActive) {
      return
    }

    // Send additional HTTP headers
    if (this.httpHeaders) {
      for (let key in this.httpHeaders) {
        response.setHeader(key, this.httpHeaders[key])
      }
    }

    // Set standard HTTP headers
    response.writeHead(httpStatus, {
      'Content-Type': mimeType,
      'Content-Length': contentLength,
      'Server': `${CLASSNAME}/${VERSION} (Node.js ${process.version})`
    })

    // Send the HTTP headers with the data and terminate the response
    response.end(text)

    // Update the statistics
    this.httpStatistics.response.count++
    this.httpStatistics.response.bytes += contentLength
    return
  }

  // Event method which can be implemented/overwritten by the users subclass
  clientError(err: Error, socket: Socket) { }
  shutdown() { }

  // HTTP methods which can be implemented/overwritten by the users subclass
  acl(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  baselinecontrol(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  bind(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  checkin(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  checkout(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  connect(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  copy(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  delete(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  get(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  head(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  label(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  link(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  lock(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  merge(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  mkactivity(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  mkcalendar(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  mkcol(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  mkredirectref(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  mkworkspace(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  move(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  options(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  orderpatch(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  patch(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response)}
  post(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  pri(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  propfind(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  proppatch(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  put(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  rebind(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  report(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  search(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  trace(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  unbind(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  uncheckout(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  unlink(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  unlock(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  update(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  updateredirectref(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
  versioncontrol(request: ABRequest, response: ServerResponse) { this.sendNotImplementedError(request, response) }
}
