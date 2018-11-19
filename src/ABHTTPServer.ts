import { IncomingMessage, ServerResponse, Server } from 'http';
import { Socket } from 'net'
import { TLSSocket } from 'tls';
import { Stats } from 'fs';

/**
 * Simple HTTP Server Framework
*/

// Global constants
const CLASSNAME: string = 'ABHttpServer'
const VERSION: string   = '2.1.x'           //TODO: Class version number

// Define request object to be passed to every user method
export type ABRequest = {
  'server': {
    'hostname': string,
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
    'tlsVersion': string,
    'tlsCipher': string,
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

  private DEBUG: boolean    = (process.env.AB_DEBUG === 'true') ? true : false
  private httpServer: any   = null
  private httpsServer: any = null
  private httpHeaders: Object = {}
  private isActive: boolean = false

  // Server statistics object to be returned to the user via getStatistics()
  private httpStatistics = {
    server: {
      className: CLASSNAME,
      classVersion: VERSION,
      startTime: new Date().toISOString(),
      startArguments: process.argv,
      nodeVersion: process.version,
      hostname: '',
      osPlatform: '',
      osType: '',
      osRelease: '',
      cpuArchitecture: '',
      cpuUsageUserSec: 0.0,
      cpuUsageSystemSec: 0.0
    },
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
   * @returns {ABHttpServer} Object
   */
  constructor(httpPort: number = 0, httpsPort: number = 0) {

    this.DEBUG ? this.logDebug(`Class version ${VERSION} constructor called (${httpPort}, ${httpsPort})`) : true

    const http = require('http')
    const https = require('http2')
    const fs = require('fs')
    const path = require('path')
    const os = require('os') 

    // Complete statistic object
    this.httpStatistics.server.hostname = os.hostname()
    this.httpStatistics.server.cpuArchitecture = os.arch()
    this.httpStatistics.server.osPlatform = os.platform()
    this.httpStatistics.server.osType = os.type()
    this.httpStatistics.server.osRelease = os.release()
      
    // Check constructor arguments
    if (arguments[0] < 0 || arguments[0] > 65535 || arguments[1] < 0 || arguments[1] > 65535) {
      throw new RangeError(`${CLASSNAME}: Both port arguments must be between 0 and 65535`)
    }
    if (arguments[0] % 1 !== 0 || arguments[1] % 1 !== 0) {
      throw new RangeError(`${CLASSNAME}: Both port arguments must have integer values`)
    }
    if (arguments[0] === arguments[1]) {
      throw new RangeError(`${CLASSNAME}: Both ports must not be equal`)
    }
    if (arguments[0] === 0 && arguments[1] === 0) {
      throw new RangeError(`${CLASSNAME}: At least one port must be non-zero`)
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
      this.startServer(this.httpsServer, httpsPort)
    }

    // Mark server active
    this.isActive = true
  }

  /**
   * Return string of object
   * @param {-}
   * @returns {string} String representation of ABHttpServer object
   */
  toString(): string {
    let status: string = ''

    status += `Class: ${CLASSNAME}, `
    status += `Host: ${this.httpStatistics.server.hostname}, `
    status += `HTTP: ${this.httpServer ? 'true' : 'false'}, `
    status += `HTTPS: ${this.httpsServer ? 'true' : 'false'}, `
    status += `Active: ${this.isActive ? 'true' : 'false'}, `
    status += `AB_DEBUG: ${this.DEBUG ? 'true' : 'false'}`
    
    return `[${status}]`
  }

  /**
   * Return the server statistics
   * @param {-}
   * @returns {statistics} JSON object with server statistics
   */
  getStatistics(): {} {

    // Update statistics
    const cpuUsage = process.cpuUsage()

    this.httpStatistics.server.cpuUsageUserSec = cpuUsage.user / 1000000
    this.httpStatistics.server.cpuUsageSystemSec = cpuUsage.system / 1000000

    return this.httpStatistics
  }

  /**
   * Establish server events and start the server
   * @param {server}  Server
   * @param {port}    TCP/IP port number
   */
  private startServer(server: any, port: number): void {

    // Get TLS state
    const tlsConnection: boolean = (server.constructor.name === 'Http2SecureServer') ? true : false
      
    // Establish <net.Server/http.Server> events
    server.on('clientError', (error: Error, socket: Socket) => {
      this.DEBUG ? this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client error: ${error}`) : true
      this.clientError(error, socket)
    })

    if (this.DEBUG) {
      server.on('checkContinue', (request: IncomingMessage, response: ServerResponse) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} "100-continue" received`)
      })
      server.on('checkExpectation', (request: IncomingMessage, response: ServerResponse) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} expect header received`)
      })
      server.on('close', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} server closed`)
      })
      server.on('connect', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client connect received`)
      })
      server.on('connection', (socket: Socket) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client connected`)
      })
      server.on('error', (error: Error) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} error received: ${error}`)
      })
      server.on('listening', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} server is listening`)
      })
      server.on('request', (request: IncomingMessage, response: ServerResponse) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client request received`)
      })
      server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client upgrade received`)
      })
    }

    // Establish <tls.Server/Http2SecureServer> events
    server.on('tlsClientError', (error: Error, socket: TLSSocket) => {
      this.DEBUG ? this.logDebug(`HTTP${tlsConnection ? 'S' : ''} error received before successful connection: ${error}`) : true
      this.clientError(error, socket)
    })

    if (this.DEBUG) {
      server.on('newSession', (sessionId: any, sessionData: any, callback: Function) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} TLS session established`)
        callback()
      })
      server.on('OCSPRequest', (certificate: Buffer, issuer: Buffer, callback: Function) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client sent certificate status request`)
        callback()
      })
      server.on('resumeSession', (sessionId: any, callback: Function) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client sent TLS session resume request`)
        callback()
      })
      server.on('secureConnection', (tlsSocket: TLSSocket) => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} completed TLS handshaking`)
      })
      server.on('session', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} HTTP2 session created`)
      })
      server.on('sessionError', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} session error occurred`)
      })
      server.on('stream', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} stream event occurred`)
      })
      server.on('timeout', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} server is idle`)
      })
      server.on('unknownProtocol', () => {
        this.logDebug(`HTTP${tlsConnection ? 'S' : ''} client failed protocol negotiation`)
      })
    }

    // Start the server
    server.listen(port, () => {
      this.DEBUG ? this.logDebug(`HTTP${tlsConnection? 'S' : ''} server started on port ${port}`) : true
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
      'acl': () => { return (this.acl(requestData, response)) },
      'baseline-control': () => { return (this.baselinecontrol(requestData, response)) },
      'bind': () => { return (this.bind(requestData, response)) },
      'checkin': () => { return (this.checkin(requestData, response)) },
      'checkout': () => { return (this.checkout(requestData, response)) },
      'connect': () => { return (this.connect(requestData, response)) },
      'copy': () => { return (this.copy(requestData, response)) },
      'delete': () => { return (this.delete(requestData, response)) },
      'get': () => { return (this.get(requestData, response)) },
      'head': () => { return (this.head(requestData, response)) },
      'label': () => { return (this.label(requestData, response)) },
      'link': () => { return (this.link(requestData, response)) },
      'lock': () => { return (this.lock(requestData, response)) },
      'merge': () => { return (this.merge(requestData, response)) },
      'mkactivity': () => { return (this.mkactivity(requestData, response)) },
      'mkcalendar': () => { return (this.mkcalendar(requestData, response)) },
      'mkcol': () => { return (this.mkcol(requestData, response)) },
      'mkredirectref': () => { return (this.mkredirectref(requestData, response)) },
      'mkworkspace': () => { return (this.mkworkspace(requestData, response)) },
      'move': () => { return (this.move(requestData, response)) },
      'options': () => { return (this.options(requestData, response)) },
      'orderpatch': () => { return (this.orderpatch(requestData, response)) },
      'patch': () => { return (this.patch(requestData, response)) },
      'post': () => { return (this.post(requestData, response)) },
      'pri': () => { return (this.pri(requestData, response)) },
      'propfind': () => { return (this.propfind(requestData, response)) },
      'proppatch': () => { return (this.proppatch(requestData, response)) },
      'put': () => { return (this.put(requestData, response)) },
      'rebind': () => { return (this.rebind(requestData, response)) },
      'report': () => { return (this.report(requestData, response)) },
      'search': () => { return (this.search(requestData, response)) },
      'trace': () => { return (this.trace(requestData, response)) },
      'unbind': () => { return (this.unbind(requestData, response)) },
      'uncheckout': () => { return (this.uncheckout(requestData, response)) },
      'unlink': () => { return (this.unlink(requestData, response)) },
      'unlock': () => { return (this.unlock(requestData, response)) },
      'update': () => { return (this.update(requestData, response)) },
      'updateredirectref': () => { return (this.updateredirectref(requestData, response)) },
      'version-control': () => { return (this.versioncontrol(requestData, response)) },
      '?': () => { return(this.allMethods(requestData, response)) }
    }

    // Parse the url
    const parsedUrl: any = url.parse(request.url)

    // Build a container holding all the data of the request
    const requestData: ABRequest = {
      'server': {
        'hostname': this.httpStatistics.server.hostname,
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
        'tlsVersion': '',
        'tlsCipher': '',
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

    // Get TLS version and cipher
    if (requestData.http.tls) {
      requestData.http.tlsVersion = (<TLSSocket>request.socket).getProtocol() || 'unknown'
      requestData.http.tlsCipher = (<TLSSocket>request.socket).getCipher().name
    }

    // Get the http payload (if present)
    const decoder: any = new StringDecoder('utf8')

    request.on('data', (dataChunk: string) => {
      requestData.http.data += decoder.write(dataChunk)
    })
    request.on('end', () => {
      requestData.http.data += decoder.end()

      const contentLength: number = requestData.http.data.length

      this.DEBUG ? this.logDebug(`<= HTTP/${requestData.http.version} (${requestData.http.tls ? requestData.http.tlsVersion : 'Non-TLS'}) - Method ${requestData.http.method.toUpperCase()} - URL /${requestData.url.path} - Content-Length ${contentLength}`) : true
      
      // Update statistics
      if (requestData.http.tls) {
        this.httpStatistics.request.https.count++
        this.httpStatistics.request.https.bytes += contentLength
      } else {
        this.httpStatistics.request.http.count++
        this.httpStatistics.request.http.bytes += contentLength
      }

      // Get the specific function to handle the HTTP method or the generic getMethods() function
      let allMethodsCall: boolean = false
      let methodFunction: Function = (<any>httpMethods)[requestData.http.method]

      if (typeof (methodFunction) === 'undefined') {
        this.DEBUG ? this.logDebug(`Unsupported HTTP Method ${requestData.http.method.toUpperCase()} received`) : true
        methodFunction = (<any>httpMethods)['?']
        allMethodsCall = true
      }

      // Call the HTTP method function which should be overwitten/implemented by the users subclass
      let returnData: boolean = methodFunction(requestData, response)

      // Return if anything other than true/false returned from subclass implementation
      if (typeof (returnData) !== 'boolean') {
        return
      }

      // Return if the user implemented the subclass (default implementations return false)
      if (returnData) {
        return
      }

      // Call the allMethods() if not already done
      if (!allMethodsCall) {
        methodFunction = (<any>httpMethods)['?']
        returnData = methodFunction(requestData, response)

        // Return if anything other than true/false returned from subclass implementation
        if (typeof (returnData) !== 'boolean') {
          return
        }

        // Return if the user implemented the subclass (default implementations return false)
        if (returnData) {
          return
        }
      }

      // No method implementation in user subclass - Return 501 error
      this.sendError(response, `Missing server implementation for HTTP method ${requestData.http.method.toUpperCase()}`, 501)
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
   * Redirect to new URL
   * @param {response}    ServerResponse object
   * @param {string}      URL to redirect
   */
  redirectUrl(response: ServerResponse, redirectURL: string): void {
    this.sendData(response, 'text/plain', '', 301, { 'Location': redirectURL})
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
      fs.readFile(filePathNormalized, (readError: Error, data: Buffer) => {
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
   * @param {headers}       Additional HTTP headers (default = {})
   */
  private sendData(response: ServerResponse, mimeType: string, text: string | Buffer, httpStatus: number = 200, headers: {} = {}): void {

    // Get length of data to be sent
    let contentLength: number = text.length

    this.DEBUG ? this.logDebug(`=> HTTP Status ${httpStatus} - Content-Length ${contentLength} - Content-Type ${mimeType}`) : true

    if (!this.isActive) {
      return
    }

    // Send mandatory HTTP headers
    if (this.httpHeaders) {
      for (let key in this.httpHeaders) {
        response.setHeader(key, (<any>this.httpHeaders)[key])
      }
    }

    // Send passed HTTP headers
    if (headers) {
      for (let key in headers) {
        response.setHeader(key, (<any>headers)[key])
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
  acl(request: ABRequest, response: ServerResponse): any { return false }
  baselinecontrol(request: ABRequest, response: ServerResponse): any { return false }
  bind(request: ABRequest, response: ServerResponse): any { return false }
  checkin(request: ABRequest, response: ServerResponse): any { return false }
  checkout(request: ABRequest, response: ServerResponse): any { return false }
  connect(request: ABRequest, response: ServerResponse): any { return false }
  copy(request: ABRequest, response: ServerResponse): any { return false }
  delete(request: ABRequest, response: ServerResponse): any { return false }
  get(request: ABRequest, response: ServerResponse): any { return false }
  head(request: ABRequest, response: ServerResponse): any { return false }
  label(request: ABRequest, response: ServerResponse): any { return false }
  link(request: ABRequest, response: ServerResponse): any { return false }
  lock(request: ABRequest, response: ServerResponse): any { return false }
  merge(request: ABRequest, response: ServerResponse): any { return false }
  mkactivity(request: ABRequest, response: ServerResponse): any { return false }
  mkcalendar(request: ABRequest, response: ServerResponse): any { return false }
  mkcol(request: ABRequest, response: ServerResponse): any { return false }
  mkredirectref(request: ABRequest, response: ServerResponse): any { return false }
  mkworkspace(request: ABRequest, response: ServerResponse): any { return false }
  move(request: ABRequest, response: ServerResponse): any { return false }
  options(request: ABRequest, response: ServerResponse): any { return false }
  orderpatch(request: ABRequest, response: ServerResponse): any { return false }
  patch(request: ABRequest, response: ServerResponse): any { return false }
  post(request: ABRequest, response: ServerResponse): any { return false }
  pri(request: ABRequest, response: ServerResponse): any { return false }
  propfind(request: ABRequest, response: ServerResponse): any { return false }
  proppatch(request: ABRequest, response: ServerResponse): any { return false }
  put(request: ABRequest, response: ServerResponse): any { return false }
  rebind(request: ABRequest, response: ServerResponse): any { return false }
  report(request: ABRequest, response: ServerResponse): any { return false }
  search(request: ABRequest, response: ServerResponse): any { return false }
  trace(request: ABRequest, response: ServerResponse): any { return false }
  unbind(request: ABRequest, response: ServerResponse): any { return false }
  uncheckout(request: ABRequest, response: ServerResponse): any { return false }
  unlink(request: ABRequest, response: ServerResponse): any { return false }
  unlock(request: ABRequest, response: ServerResponse): any { return false }
  update(request: ABRequest, response: ServerResponse): any { return false }
  updateredirectref(request: ABRequest, response: ServerResponse): any { return false }
  versioncontrol(request: ABRequest, response: ServerResponse): any { return false }
  allMethods(request: ABRequest, response: ServerResponse): any { return false }
}
