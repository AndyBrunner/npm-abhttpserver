import {Socket} from 'net'
import Express = require('express')

/**
 * Simple HTTP Server Framework
*/
export abstract class ABHttpServer {

  private DEBUG: boolean          = (process.env.AB_DEBUG === 'true') ? true : false
  private app                     = Express()
  private httpServer: any         = null
  private httpsServer: any        = null
  private httpHeaders: any        = {}  

  /**
   * Create the HTTP server
   * @param httpPort Port number (1 - 65535) for the HTTP server or 0
   * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
   */
  constructor(httpPort: number, httpsPort: number) {

    this.DEBUG ? this.logDebug(`Constructor called (${httpPort}, ${httpsPort})`) : true

    const http      = require('http')
    const https     = require('https')
    const fs        = require('fs')
    const path      = require('path')
  
    // Check constructor arguments
    if (typeof arguments[0] !== 'number' || typeof arguments[1] !== 'number') {
       throw new Error('ABHttpServer: Usage is ABHttpServer(httpPort | 0, httpsPort | 0')
    }
    if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
      throw new Error('ABHttpServer: Both port arguments must be between 0 and 65535')
    }
    if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
      throw new Error('ABHttpServer: Both port arguments must have integer values')
    }
    if (arguments[0] === arguments[1]) {
      throw new Error('ABHttpServer: Both ports must not be equal')
    }
    if (arguments[0] === 0 && arguments[1] === 0) {
      throw new Error('ABHttpServer: At least one port must be non-zero')
    }
    
    // Start the HTTP server
    if (httpPort != 0) {

      this.DEBUG ? this.logDebug(`Creating HTTP server on port ${httpPort}`) : true

      this.httpServer = http.createServer(this.app)
      this.startServer(this.httpServer, httpPort, false)
    }

    // Start the HTTPS server
    if (httpsPort != 0) {

      this.DEBUG ? this.logDebug(`Creating HTTPS server on port ${httpsPort}`) : true

      var httpsOptions = {
        key:  fs.readFileSync(path.join(__dirname, 'x509-servercert.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'x509-certchain.pem')),
        /* Add "allowHTTP1: true" when using the http2 module */
      }

      this.httpsServer = https.createServer(httpsOptions, this.app)
      this.startServer(this.httpsServer, httpsPort, true)
    }

    // Do not send Express HTTP header 'x-powered-by'
    this.app.disable('x-powered-by')

    // Handle all HTTP requests
    this.app.all('*', (request: Express.Request, response: Express.Response) => {
      
      this.DEBUG ? this.logDebug(`${request.protocol.toUpperCase()} ${request.httpVersion} ${request.method} ${request.url}`) : true

      switch (request.method) {
        case 'GET': {
          this.get(request.url, request, response)
          break
        }
          
        case 'HEAD': {
          this.head(request.url, request, response)
          break
        }
          
        case 'PUT': {
          let requestData = ''
          request.on('data', (dataChunk: string) => {
            requestData += dataChunk
          })
          request.on('end', () => {
            this.DEBUG ? this.logDebug(`PUT data received: ${requestData.length} bytes`) : true
            this.put(request.url, requestData, request, response)
          })
          break
        }
        
        case 'POST': {
          let requestData = ''
          request.on('data', (dataChunk: string) => {
            requestData += dataChunk
          })
          request.on('end', () => {
            this.DEBUG ? this.logDebug(`POST data received: ${requestData.length} bytes`) : true
            this.post(request.url, requestData, request, response)
          })
          break
        }
        
        case 'DELETE': {
          let requestData = ''
          request.on('data', (dataChunk: string) => {
            requestData += dataChunk
          })
          request.on('end', () => {
            this.DEBUG ? this.logDebug(`DELETE data received: ${requestData.length} bytes`) : true
            this.delete(request.url, requestData, request, response)
          })
          break
        }
          
        case 'CONNECT': {
          this.connect(request.url, request, response)
          break
        }
          
        case 'TRACE': {
          this.trace(request.url, request, response)
          break
        }
          
        case 'PATCH': {
          let requestData = ''
          request.on('data', (dataChunk: string) => {
            requestData += dataChunk
          })
          request.on('end', () => {
            this.DEBUG ? this.logDebug(`PATCH data received: ${requestData.length} bytes`) : true
            this.patch(request.url, requestData, request, response)
          })

          break
        }
          
        case 'OPTIONS': {
          this.options(request.url, request, response)
          break
        }
        
        default: {
          this.DEBUG ? this.logDebug(`Unsupported HTTP method ${request.method}`) : true 
          this.sendText(response, `ABHttpServer: Unsupported HTTP method <${request.method}>`, 501)
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
  private startServer(server: any, port: number, secure: boolean): void {
   
    // Establish net.Server event handlers
    server.on('error', (error: Error) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (net.Server) server received error: ${error}`) : true
    })
    server.on('listening', () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (net.Server) server is in listen mode`) : true
    })

    // Establish http.Server event handlers
    server.on('checkContinue', (request: Express.Request, response: Express.Response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received <HTTP 100 continue>') : true
      response.writeContinue()
    })
    server.on('checkExpectation', (request: Express.Request, response: Express.Response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received HTTP expect header') : true
    })
    server.on('clientError', (err: Error, socket: Socket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (http.Server) client error: ${err}`) : true
      this.clientError(err, socket)
    })
    server.on('close', () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server closed') : true
    })
    server.on('connect', (request: Express.Request, socket: Socket, head: Buffer) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server accepted connection') : true
    })
    server.on('connection', (socket: Socket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server established connection') : true
    })
    server.on('request', (request: Express.Request, response: Express.Response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received client request') : true
    })
    server.on('upgrade', (request: Express.Request, socket: Socket, head: Buffer) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received upgrade request') : true
    })

    // Establish tls.server event handlers
    server.on('newSession', (sessionId: any, sessionData: any, callback: Function) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server started TLS session') : true
      callback()
    })
    server.on('OCSPRequest', (certificate: any, issuer: any, callback: Function) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received certificate status request') : true
      callback()
    })
    server.on('resumeSession', (sessionId: any, callback: Function) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received TLS resume session status request') : true
      callback()
    })
    server.on('secureConnection', (tlsSocket: any) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) completed TLS handshaking process') : true
    })
    server.on('tlsClientError', (exception: Error, tlsSocket: any) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) received an error before successful connection') : true
    })

    // Start the server
    server.listen(port, () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` server started on port ${port}`) : true
    })
  }

  /**
  * Write debugging data to the console
  * @param message Debug message to be written
  */
  private logDebug(message: string) {
    if (this.DEBUG) {
      
      var date = new Date()
      var timestamp = date.getFullYear() + '-' +
        this.dateTimePad((date.getMonth() + 1).toString(), 2) + '-' +
        this.dateTimePad(date.getDate().toString(), 2) + ' ' +
        this.dateTimePad(date.getHours().toString(), 2) + ':' +
        this.dateTimePad(date.getMinutes().toString(), 2) + ':' +
        this.dateTimePad(date.getSeconds().toString(), 2) + '.' +
        this.dateTimePad(date.getMilliseconds().toString(), 3)
      
      console.debug(`${timestamp} ABHttpServer: ${message}`)
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

    this.DEBUG ? this.logDebug('Invoked method terminate()') : true

    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }

    if (this.httpsServer) {
      this.httpsServer.close()
      this.httpsServer = null
    }
  }

  /**
   * Returns the express handler
   * @returns Express handler
   */
  getapp(): any {
    return this.app
  }

  /**
   * Sends HTML data to the client
   * @param response    Express.Response object  
   * @param text        HTML to be sent
   * @param httpStatus  HTTP Status code (defaults to 200)
   */
  sendHTML(response: Express.Response, text: string, httpStatus: number = 200) {
    this.sendData(response, 'text/html', text, httpStatus)
  }

  /**
   * Sends plain text to the client
   * @param response  
   * @param text      Text to be sent
   * @param httpStatus  HTTP Status code (defaults to 200)
   */
  sendText(response: Express.Response, text: string, httpStatus: number = 200) {
    this.sendData(response, 'text/plain', text, httpStatus)
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
  setHeaders(httpHeaders: any) {

    this.DEBUG ? this.logDebug(`Invoked method setHeaders(${httpHeaders})`) : true
    this.httpHeaders = httpHeaders
  }

  /**
   * Writes the data with HTTP header
   * @param response      Express.Response
   * @param mimeType      HTTP Content-Type
   * @param text          Data to be written
   * @param httpStatus    HTTP Status code
   */
  private sendData(response: Express.Response, mimeType: string, text: string, httpStatus: number) {

    this.DEBUG ? this.logDebug(`Sending HTTP status ${httpStatus} with ${text.length} bytes of ${mimeType} data`) : true

    // Send additional HTTP headers
    if (!this.httpHeaders) {
      for (let key in this.httpHeaders) {
        response.set(key, this.httpHeaders[key])
      }
    }

    response.writeHead(httpStatus, { 'Content-Type': mimeType })
    response.end(text)
  }

  /**
   * Send HTTP 'Not Implemented' Error
   * @param method 
   * @param response Express.response
   */
  private notImplementedError(method: string, response: Express.Response) {

    this.DEBUG ? this.logDebug(`HTTP method ${method} not implemented by subclass`) : true
    response.status(501).end(`HTTP method ${method} is not supported`)
  }

  // Method prototypes to be overwritten in subclass
  clientConnect(socket: Socket) { }

  clientError(err: Error, socket: Socket) { }

  get(url: string, request: Express.Request, response: Express.Response) { 
    this.notImplementedError('GET', response)
  }
  
  put(url: string, data: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('PUT', response)
  }

  post(url: string, data: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('POST', response)
  }

  options(url: string, request: Express.Request, response: Express.Response) { 
    this.notImplementedError('OPTIONS', response)
  }

  head(url: string, request: Express.Request, response: Express.Response) { 
    this.notImplementedError('HEAD', response)
  }

  delete(url: string, data: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('DELETE', response)
  }

  connect(url: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('CONNECT', response)
  }

  trace(url: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('TRACE', response)
  }

  patch(url: string, data: string, request: Express.Request, response: Express.Response) {
    this.notImplementedError('PATCH', response)
  }
}
