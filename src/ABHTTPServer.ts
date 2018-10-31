import { Socket } from 'net'
import { TLSSocket } from 'tls';
import { IncomingMessage, ServerResponse } from 'http';

// Overall constants
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
 * Simple HTTP Server Framework
*/
export abstract class ABHttpServer {

  private DEBUG: boolean          = (process.env.AB_DEBUG === 'true') ? true : false
  private httpServer: any         = null
  private httpsServer: any        = null
  private httpHeaders: any        = {}
  private isActive: boolean       = false

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
      server.on('secureConnection', (tlsSocket: any) => {
        this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' tls.Server completed TLS handshaking process') : true
      })
      server.on('tlsClientError', (exception: Error, tlsSocket: any) => {
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

    const url = require('url')
    const { StringDecoder } = require('string_decoder')

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

    // Construct key/value object from HTTP querystring
    if (parsedUrl.query) {
      let keyvalues = parsedUrl.query.split('&')
      for (let index = 0; index < keyvalues.length; index++) {
        let keyvalue = keyvalues[index].split('=');
        (<any>requestData.url.query)[keyvalue[0]] = keyvalue[1];
      }
    }

    // Get the http payload (if any)
    const decoder = new StringDecoder('utf8')

    request.on('data', (dataChunk: string) => {
      requestData.http.data += decoder.write(dataChunk)
    })
    request.on('end', () => {
      requestData.http.data += decoder.end()

      this.DEBUG ? this.logDebug(`HTTP/${requestData.http.version} ${requestData.http.method.toUpperCase()} /${requestData.url.path}`) : true
      
      // After we have collected all information, we now call the overwritten methods from the user
      let methodFunction = (<any>httpMethods)[requestData.http.method]    //TODO

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

    // Send additional HTTP headers
    if (!this.httpHeaders) {
      for (let key in this.httpHeaders) {
        response.setHeader(key, this.httpHeaders[key])
      }
    }

    response.writeHead(httpStatus, { 'Content-Type': mimeType })
    response.end(text)
  }

  /**
   * Send HTTP 'Not Implemented' Error
   * @param method 
   * @param response ServerResponse
   */
  private notImplementedError(method: string, response: ServerResponse) {

    let errorMessage = {
      component: CLASSNAME,
      error: `HTTP method ${method.toUpperCase()} ist not supported by the server - Missing subclass implementation`
    }

    this.DEBUG ? this.logDebug(errorMessage.error) : true

    this.sendJSON(response, errorMessage, 501)
  }

  // Event prototypes which can be overwritten in subclass
  clientConnect(socket: Socket) { }
  clientError(err: Error, socket: Socket) { }

  // Method prototypes to be overwritten in subclass
  acl(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  baselinecontrol(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  bind(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  checkin(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  checkout(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  connect(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  copy(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  delete(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  get(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  head(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  label(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  link(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  lock(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  merge(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  mkactivity(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  mkcalendar(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  mkcol(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  mkredirectref(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  mkworkspace(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  move(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  options(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  orderpatch(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  patch(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  post(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  pri(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  propfind(request: ABRequest, response: ServerResponse) { 
    this.notImplementedError(request.http.method, response)
  }
  proppatch(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  put(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  rebind(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  report(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  search(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  trace(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  unbind(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  uncheckout(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  unlink(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  unlock(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  update(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  updateredirectref(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
  versioncontrol(request: ABRequest, response: ServerResponse) {
    this.notImplementedError(request.http.method, response)
  }
}
