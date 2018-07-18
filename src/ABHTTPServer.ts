import { Socket } from "net";

/*
Simple HTTP Server Framework
*/

/**
 * ABHTTPServer Abstract Class
 */
export default abstract class ABHTTPServer {

  private DEBUG       = (process.env.AB_DEBUG === 'true') ? true : false
  private express     = require('express')
  private app         = this.express()
  private httpServer  = null
  private httpsServer = null

  /**
   * Create the HTTP server
   * @param httpPort Port number (1 - 65535) for the HTTP server or 0
   * @param httpsPort Port number (1 - 65535) for the HTTPS server or 0
   */
  constructor(httpPort: number, httpsPort: number) {

    this.DEBUG ? this.logDebug(`Constructor called with (${httpPort}, ${httpPort})`) : true

    const http      = require('http')
    const https     = require('https')
    const fs        = require('fs')
    const path      = require('path')
  
    /* Check constructor arguments */
    if (typeof arguments[0] !== 'number' || typeof arguments[1] !== 'number') {
      this.DEBUG ? this.logDebug('Usage is ABHTTPServer(httpPort | 0, httpsPort | 0') : true
      return (undefined)
    }
    if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
      this.DEBUG ? this.logDebug('Both port arguments must be between 0 and 65535') : true
      return (undefined)
    }
    if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
      this.DEBUG ? this.logDebug('Both port arguments must have integer values') : true
      return (undefined)
    }
    if (arguments[0] === arguments[1]) {
      this.DEBUG ? this.logDebug('Both ports must not be equal') : true
      return (undefined)
    }
    if (arguments[0] === 0 && arguments[1] === 0) {
      this.DEBUG ? this.logDebug('At least one port must be non-zero') : true
      return (undefined)
    }
    
    /* Start the HTTP server */
    if (httpPort != 0) {
      this.DEBUG ? this.logDebug(`Creating HTTP server on port ${httpPort}`) : true
      this.httpServer = http.createServer(this.app)
      this.startServer(this.httpServer, httpPort, false)
    }

    /* Start the HTTPS server */
    if (httpsPort != 0) {
      this.DEBUG ? this.logDebug(`Creating HTTPS server on port ${httpsPort}`) : true
      var httpsOptions = {
        key:  fs.readFileSync(path.join(__dirname, 'x509-servercert.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'x509-certchain.pem'))
        /* Add "allowHTTP1: true" when using the http2 module */
      }
      this.httpsServer = https.createServer(httpsOptions, this.app)
      this.startServer(this.httpsServer, httpsPort, true)
    }

    /* Handle all HTTP requests */
    this.app.all('*', (request, response) => {
      this.DEBUG ? this.logDebug(`${request.protocol.toUpperCase()} ${request.httpVersion} ${request.method} ${request.url}`) : true

      switch (request.method) {
        /* Method GET */
        case 'GET': {
          this.get(request.url, request, response)
          break
        }
          
        /* Method HEAD */
        case 'HEAD': {
          this.head(request.url, request, response)
          break
        }
          
        /* Method PUT */
        case 'PUT': {
          let postData = ''
          request.on('data', (dataChunk) => {
            postData += dataChunk
          })
          request.on('end', () =>  {
            this.DEBUG ? this.logDebug(`Received PUT data size: ${postData.length} bytes`) : true
          })
          this.put(request.url, postData, request, response)
          break
        }
        
        /* Method POST */
        case 'POST': {
          let postData = ''
          request.on('data', (dataChunk) => {
            postData += dataChunk
          })
          request.on('end', () => {
            this.DEBUG ? this.logDebug(`Received POST data size: ${postData.length} bytes`) : true
          })
          this.post(request.url, postData, request, response)
          break
        }
        
        /* Method DELETE */
        case 'DELETE': {
          this.delete(request.url, request, response)
          break
        }
          
        /* Method CONNECT */
        case 'CONNECT': {
          this.connect(request.url, request, response)
          break
        }
          
        /* Method TRACE */
        case 'TRACE': {
          this.trace(request.url, request, response)
          break
        }
          
        /* Method PATCH */
        case 'PATCH': {
          this.patch(request.url, request, response)
          break
        }
          
        /* Method OPTIONS */
        case 'OPTIONS': {
          this.options(request.url, request, response)
          break
        }
        
        default: {
          this.DEBUG ? this.logDebug(`Unhandled HTTP method ${request.method}`) : true 
          this.sendText(response, `Unhandled HTTP method <${request.method}>`)
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
  private startServer(server, port: number, secure: boolean) : void {
   
    /* Establish net.Server event handlers */
    server.on('error', (error: Error) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (net.Server) server received error: ${error}`) : true
    })
    server.on('listening', () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (net.Server) server is in listen mode`) : true
    })

    /* Establish http.Server event handlers */
    server.on('checkContinue', (request, response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received <HTTP 100 continue>') : true
      response.writeContinue()
    })
    server.on('checkExpectation', (request, response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received HTTP expect header') : true
    })
    server.on('clientError', (err: Error, socket: Socket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` (http.Server) client error: ${err}`) : true
      this.clientError(err, socket)
    })
    server.on('close', () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server closed') : true
    })
    server.on('connect', (request, socket: Socket, head: Buffer) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server accepted connection') : true
    })
    server.on('connection', (socket: Socket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server established connection') : true
    })
    server.on('request', (request, response) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received client request') : true
    })
    server.on('upgrade', (request, socket: Socket, head: Buffer) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (http.Server) server received upgrade request') : true
    })

    /* Establish tls.server event handlers */
    server.on('newSession', (sessionId, sessionData, callback) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server started TLS session') : true
      callback()
    })
    server.on('OCSPRequest', (certificate, issuer, callback) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received certificate status request') : true
      callback()
    })
    server.on('resumeSession', (sessionId, callback) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) server received TLS resume session status request') : true
      callback()
    })
    server.on('secureConnection', (tlsSocket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) completed TLS handshaking process') : true
    })
    server.on('tlsClientError', (exception, tlsSocket) => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ' (tls.Server) received an error before successful connection') : true
    })

    /* Start the server */
    server.listen(port, () => {
      this.DEBUG ? this.logDebug('HTTP' + (secure ? 'S' : '') + ` server started on port ${port}`) : true
    })
  }

  /**
  * Write debugging data to the console
  * @param message Debug message to be written
  */
  private logDebug(message) {
    if (this.DEBUG) {
      
      var date = new Date()
      var timestamp = date.getFullYear() + '-' +
        this.dateTimePad((date.getMonth() + 1), 2) + '-' +
        this.dateTimePad(date.getDate(), 2) + ' ' +
        this.dateTimePad(date.getHours(), 2) + ':' +
        this.dateTimePad(date.getMinutes(), 2) + ':' +
        this.dateTimePad(date.getSeconds(), 2) + '.' +
        this.dateTimePad(date.getMilliseconds(), 3)
      
      console.log(`${timestamp} ABHTTPSERVER Debug: ${message}`)
    }
  }

  /**
   * Right pad number
   * @param value 
   * @param digits 
   */
  private dateTimePad(value, digits) : number {
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

    /* Stop HTTP server */
    if (this.httpServer !== null) {
      this.httpServer.close()
      this.httpServer = null
    }

    /* Stop HTTPS server */
    if (this.httpsServer !== null) {
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
   * @param response  
   * @param text      HTML to be sent
   */
  sendHTML(response: any, text: string) {
    response.setHeader('Content-Type', 'text/html')
    response.end(text)
  }

  /**
   * Sends plain text to the client
   * @param response  
   * @param text      Text to be sent
   */
  sendText(response: any, text: string) {
    response.setHeader('Content-Type', 'text/plain')
    response.end(text)
  }

  /* Method prototypes to be overwritten/implemented in subclass */
  clientConnect(socket) { }
  clientError(err, socket) { }
  get(url: string, request: any, response: any) { }
  put(url: string, data: string, request: any, response: any) { }
  post(url: string, data: string, request: any, response: any) { }
  options(url: string, request: any, response: any) { }
  head(url: string, request: any, response: any) { }
  delete(url: string, request: any, response: any) { }
  connect(url: string, request: any, response: any) { }
  trace(url: string, request: any, response: any) { }
  patch(url: string, request: any, response: any) { }
}
