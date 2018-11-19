# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves all HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install abhttpserver
npm install @types/node
```

## Example: HelloWorld.ts

Starts an HTTP server on port 8080 which responds every client request with "Hello world!".

```typescript
import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  allMethods(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Hello world!`)
  }
}
var myServer = new MyServer(8080)
```

## Example: GetPost.ts

Start a HTTP and HTTPS server on ports 8080 and 8081). All requests from both servers are handled thru the same class methods. For GET requests with an URL /stats, the server sends back a JSON object with some server statistic, all other GET requests will receive a text line with the send URL. All POST requests will be answered with the data sent in the body of the POST request.

```typescript
import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (request.url.path === 'stats') {
      this.sendJSON(response, this.getStatistics())
    } else {
      this.sendText(response, `The URL sent was ${request.url.path}`)
    }
  }
  post(request: ABRequest, response: ServerResponse) {
    this.sendJSON(response, { data: `The raw data sent was ${request.http.data}` })
  }
}
var myServer = new MyServer(8080, 8081)
```

## Example: RedirectHttps.ts

Redirect all non-secure HTTP GET request to HTTPS.

```typescript
import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (!request.http.tls) {
      this.redirectUrl(response, `https://${request.server.hostname}:8081/${request.url.path}`)
      return
    }
    this.sendText(response, `The secure connection is established`)
  }
}
var myServer = new MyServer(8080, 8081)
```

## Example: FileServer.ts

Basic HTTP server to serve static files. The HTTP content type is set according to the file name extension.

```typescript
import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendFile(response, request.url.path)
  }
}
var myServer = new MyServer(8080, 8081)
```

## Features and Notes

* This module does not require any framework or additional NPM module.
* The object ABRequest is passed to every user method and contains information about the http request.
* Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.) thru corresponding methods.
* Non-supported or non-implemented HTTP methods are handled thru the allMethods() call.
* Support for HTTP/2 with fallback to HTTP 1.1 if necessary.
* Includes several methods for easy access to the receiving and sending data.
* The HTTPS server certificate and the trusted certificate chain are read from "key.pem" and
  "cert.pem". A self signed certificate is included for testing purpose.
* Errors are sent back to the client as JSON error objects
* Detailed debugging information for every HTTP events and data received and sent.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG (all uppercase) to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node app.js
```

## Example debug output

```text
2018-11-18T16:16:06.819Z ABHttpServer: Class version x.x.x constructor called (8080, 8081)
2018-11-18T16:16:06.829Z ABHttpServer: Creating HTTP server on port 8080
2018-11-18T16:16:06.834Z ABHttpServer: Creating HTTPS server on port 8081
2018-11-18T16:16:06.843Z ABHttpServer: HTTP server is listening
2018-11-18T16:16:06.843Z ABHttpServer: HTTP server started on port 8080
2018-11-18T16:16:06.843Z ABHttpServer: HTTPS server is listening
2018-11-18T16:16:06.843Z ABHttpServer: HTTPS server started on port 8081
2018-11-18T16:16:28.373Z ABHttpServer: HTTP client connected
2018-11-18T16:16:28.376Z ABHttpServer: HTTP client request received
2018-11-18T16:16:28.377Z ABHttpServer: <= HTTP/1.1 (Non-TLS) - Method GET - URL /anyUrl - Content-Length 12
2018-11-18T16:16:28.378Z ABHttpServer: => HTTP Status 200 - Content-Length 23 - Content-Type text/plain
2018-11-18T16:16:33.382Z ABHttpServer: HTTP server is idle
2018-11-18T16:16:52.725Z ABHttpServer: HTTPS client connected
2018-11-18T16:16:52.733Z ABHttpServer: HTTPS completed TLS handshaking
2018-11-18T16:16:52.734Z ABHttpServer: HTTPS client request received
2018-11-18T16:16:52.734Z ABHttpServer: <= HTTP/1.1 (TLSv1.2) - Method GET - URL /secureURL - Content-Length 12
2018-11-18T16:16:52.734Z ABHttpServer: => HTTP Status 200 - Content-Length 26 - Content-Type text/plain
2018-11-18T16:17:06.587Z ABHttpServer: HTTPS client request received
2018-11-18T16:17:06.587Z ABHttpServer: <= HTTP/1.1 (TLSv1.2) - Method POST - URL /SomeData - Content-Length 12
2018-11-18T16:17:06.587Z ABHttpServer: => HTTP Status 200 - Content-Length 45 - Content-Type application/json
```

## Prerequisits

* Node.js 10.10+ (HTTP/2 requirement)
* npm install @types/node

## Unlicense

See [unlicense.org](http://unlicense.org)

_This software shall be used for Good, not Evil._

## GIT Source code

You will find the source code on [GitHub](https://github.com/AndyBrunner/npm-abhttpserver.git)

## Support

Support is provided on a best efford base. If you have any question, suggestion or find any issues, please report them. You may also contact the original author thru email at the address andy.brunner@abdata.ch.

### _Made with love in the beautiful city of Zurich, Switzerland_
