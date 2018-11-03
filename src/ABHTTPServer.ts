import { Socket } from 'net'
import { TLSSocket } from 'tls';
import { IncomingMessage, ServerResponse } from 'http';
import { Http2SecureServer } from 'http2';

/**
 * Simple HTTP Server Framework
*/

// Global constants
const CLASSNAME = 'ABHttpServer'

// Data collected at HTTP request time and passed to every user method
export type ABRequest = {
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

  private DEBUG: boolean          = (process.env.AB_DEBUG === 'true') ? true : false
  private httpServer: any         = null
  private httpsServer: any        = null
  private httpHeaders: any        = {}
  private isActive: boolean       = false
  
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
   * @param httpPort Port number (1 - 65535) for the HTTP server or 0
   * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
   */
  constructor(httpPort: number = 0, httpsPort: number = 0) {

    this.DEBUG ? this.logDebug(`Constructor called (${httpPort}, ${httpsPort})`) : true

    const http  = require('http')
    const https = require('http2')
    const fs    = require('fs')
    const path  = require('path')
   
    // Check constructor arguments
    if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
      throw new Error(CLASSNAME + ': Both port arguments must be between 0 and 65535')
    }
    if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
      throw new Error(CLASSNAME + ': Both port arguments must have integer values')
    }
    if (arguments[0] === arguments[1]) {
      throw new Error(CLASSNAME + ': Both ports must not be equal')
    }
    if (arguments[0] === 0 && arguments[1] === 0) {
      throw new Error(CLASSNAME + ': At least one port must be non-zero')
    }
    
    // Start the HTTP server
    if (httpPort != 0) {

      this.DEBUG ? this.logDebug(`Creating HTTP server on port ${httpPort}`) : true

      this.httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
        this.processHttpRequest(request, response)
      })
      this.startServer(this.httpServer, httpPort)
    }

    // Start the HTTPS server
    if (httpsPort != 0) {

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
   */
  toString() {
    let status: string = ''

    status += `HTTP: ${this.httpServer? 'true' : 'false'}, `
    status += `HTTPS: ${this.httpsServer ? 'true' : 'false'}, `
    status += `Active: ${this.isActive? 'true' : 'false'}, `
    status += `AB_DEBUG: ${this.DEBUG ? 'true' : 'false'}`
    
    return `${CLASSNAME}[${status}]`
  }

  /**
   * Return the server statistics
   */
  getStatistics() {
    return this.httpStatistics
  }

  /**
   * Establish server events and start the server
   * @param server  Server
   * @param port    TCP/IP port number
   * @param secure  TLS flag (default = false)
   */
  private startServer(server: any, port: number, secure: boolean = false): void {

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
      server.on('clientError', (err: Error, socket: Socket) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` http.Server client error: ${err}`) : true
        this.clientError(err, socket)
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
    
  // Handle all HTTP/HTTPS requests
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
    const parsedUrl = url.parse(request.url)

    // Build a container holding all the data of the request
    const requestData: ABRequest = {
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
        'path': parsedUrl.pathname.replace(/^\/+|\/+$/g, '') || '',
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
    const decoder = new StringDecoder('utf8')

    request.on('data', (dataChunk: string) => {
      requestData.http.data += decoder.write(dataChunk)
    })
    request.on('end', () => {
      requestData.http.data += decoder.end()

      this.DEBUG ? this.logDebug(`HTTP/${requestData.http.version} ${requestData.http.method.toUpperCase()} /${requestData.url.path}`) : true
      
      // Update statistics
      if (requestData.http.tls) {
        this.httpStatistics.request.https.count++
        this.httpStatistics.request.https.bytes += requestData.http.data.length
      } else {
        this.httpStatistics.request.http.count++
        this.httpStatistics.request.http.bytes += requestData.http.data.length
      }
      
      // After we have collected all information, we now call the generic method to serve all HTTP requests
      this.allMethods(requestData, response)

      // Call the specific HTTP method function
      let methodFunction = (<any>httpMethods)[requestData.http.method]

      if (typeof (methodFunction) == 'undefined') {
        let errorMessage = {
          component: CLASSNAME,
          error: `Unsupported HTTP method ${requestData.http.method.toLocaleUpperCase()}`
        }
        this.DEBUG ? this.logDebug(errorMessage.error) : true
        this.sendJSON(response, errorMessage, 501)
      } else {
        methodFunction()
      }
    })
  }

  /**
  * Write debugging data to the console
  * @param message Debug message to be written
  */
  private logDebug(message: string) {

    if (this.DEBUG) {
      
      const date = new Date()
      const timestamp = date.getFullYear() + '-' +
        this.dateTimePad((date.getMonth() + 1).toString(), 2) + '-' +
        this.dateTimePad(date.getDate().toString(), 2) + ' ' +
        this.dateTimePad(date.getHours().toString(), 2) + ':' +
        this.dateTimePad(date.getMinutes().toString(), 2) + ':' +
        this.dateTimePad(date.getSeconds().toString(), 2) + '.' +
        this.dateTimePad(date.getMilliseconds().toString(), 3)
      
      console.debug(`${timestamp} ` + CLASSNAME + ` ${message}`)
    }
  }

  /**
   * Right pad number
   * @param value 
   * @param digits 
   */
  private dateTimePad(value: string, digits: number) : string {

    let number = value
    while (number.toString().length < digits) {
      number = `0${number}`
    }
    return (number)
  }

  /**
   * Terminate the HTTP/HTTPS server
   */
  terminate(): void {

    if (!this.isActive) {
      return
    }

    this.DEBUG ? this.logDebug('Invoked method terminate()') : true

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
  }

  /**
   * Sends HTML data to the client
   * @param response    ServerResponse object  
   * @param text        HTML to be sent
   * @param httpStatus  HTTP Status code (defaults to 200)
   */
  sendHTML(response: ServerResponse, text: string, httpStatus: number = 200) {
    this.sendData(response, 'text/html', text, httpStatus)
  }

  /**
   * Sends plain text to the client
   * @param response  
   * @param text      Text to be sent
   * @param httpStatus  HTTP Status code (defaults to 200)
   */
  sendText(response: ServerResponse, text: string, httpStatus: number = 200) {
    this.sendData(response, 'text/plain', text, httpStatus)
  }

  /**
   * Sends json text to the client
   * @param response  
   * @param jsonData    JSON data to be sent
   * @param httpStatus  HTTP Status code (defaults to 200)
   */
  sendJSON(response: ServerResponse, jsonData: {}, httpStatus: number = 200) {
    this.sendData(response, 'application/json', JSON.stringify(jsonData), httpStatus)
  }
  /**
   * Set HTTP headers to be added to every response
   * 
   * Example:
   * this.setHeaders({'Access-Control-Allow-Origin': '*',
   *                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT' })
   * 
   * @param httpHeaders HTTP Headers to be added
   */
  setHeaders(httpHeaders: {}) {
    this.DEBUG ? this.logDebug(`Invoked method setHeaders(${httpHeaders})`) : true
    this.httpHeaders = httpHeaders
  }

  /**
   * Writes the data with HTTP header
   * @param response      ServerResponse
   * @param mimeType      HTTP Content-Type
   * @param text          Data to be written
   * @param httpStatus    HTTP Status code (default = 200)
   */
  private sendData(response: ServerResponse, mimeType: string, text: string, httpStatus: number = 200) {

    this.DEBUG ? this.logDebug(`Sending HTTP status ${httpStatus} with ${text.length} bytes of ${mimeType} data`) : true

    if (!this.isActive) {
      return
    }

    // Update the statistics
    this.httpStatistics.response.count++
    this.httpStatistics.response.bytes += text.length
    
    // Send additional HTTP headers
    if (this.httpHeaders) {
      for (let key in this.httpHeaders) {
        response.setHeader(key, this.httpHeaders[key])
      }
    }

    response.writeHead(httpStatus, { 'Content-Type': mimeType })
    response.end(text)
  }

  // Event prototypes which can be implemented/overwritten by the users subclass
  clientConnect(socket: Socket) { }
  clientError(err: Error, socket: Socket) { }

  // HTTP methods which can be implemented/overwritten by the users subclass
  allMethods(request: ABRequest, response: ServerResponse) {}
  acl(request: ABRequest, response: ServerResponse) {}
  baselinecontrol(request: ABRequest, response: ServerResponse) {}
  bind(request: ABRequest, response: ServerResponse) {}
  checkin(request: ABRequest, response: ServerResponse) {}
  checkout(request: ABRequest, response: ServerResponse) {}
  connect(request: ABRequest, response: ServerResponse) {}
  copy(request: ABRequest, response: ServerResponse) {}
  delete(request: ABRequest, response: ServerResponse) {}
  get(request: ABRequest, response: ServerResponse) {}
  head(request: ABRequest, response: ServerResponse) {}
  label(request: ABRequest, response: ServerResponse) {}
  link(request: ABRequest, response: ServerResponse) {}
  lock(request: ABRequest, response: ServerResponse) {}
  merge(request: ABRequest, response: ServerResponse) {}
  mkactivity(request: ABRequest, response: ServerResponse) {}
  mkcalendar(request: ABRequest, response: ServerResponse) {}
  mkcol(request: ABRequest, response: ServerResponse) {}
  mkredirectref(request: ABRequest, response: ServerResponse) {}
  mkworkspace(request: ABRequest, response: ServerResponse) {}
  move(request: ABRequest, response: ServerResponse) {}
  options(request: ABRequest, response: ServerResponse) {}
  orderpatch(request: ABRequest, response: ServerResponse) {}
  patch(request: ABRequest, response: ServerResponse) {}
  post(request: ABRequest, response: ServerResponse) {}
  pri(request: ABRequest, response: ServerResponse) {}
  propfind(request: ABRequest, response: ServerResponse) {}
  proppatch(request: ABRequest, response: ServerResponse) {}
  put(request: ABRequest, response: ServerResponse) {}
  rebind(request: ABRequest, response: ServerResponse) {}
  report(request: ABRequest, response: ServerResponse) {}
  search(request: ABRequest, response: ServerResponse) {}
  trace(request: ABRequest, response: ServerResponse) {}
  unbind(request: ABRequest, response: ServerResponse) {}
  uncheckout(request: ABRequest, response: ServerResponse) {}
  unlink(request: ABRequest, response: ServerResponse) {}
  unlock(request: ABRequest, response: ServerResponse) {}
  update(request: ABRequest, response: ServerResponse) {}
  updateredirectref(request: ABRequest, response: ServerResponse) {}
  versioncontrol(request: ABRequest, response: ServerResponse) {}
}
