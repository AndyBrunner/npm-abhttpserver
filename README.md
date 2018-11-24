# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves all HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install typescript
npm install @types/node
npm install abhttpserver
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

## Features

* Support for HTTP/2 over TLS with fallback to HTTP 1.1
* Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.) thru corresponding methods. Calls allMethods() if no corresponding function found
* An object ABRequest is passed to every user method with various information about the HTTP request
* Include methods for easy access to the data (Text, HTML, JSON).
* Errors are sent back to the client as JSON objects
* Detailed console debugging thru AB_DEBUG environment variable

## Notes

* This module does not require any framework or additional NPM module.
* The HTTPS server certificate and the trusted certificate chain are read from "key.pem" and
  "cert.pem". A self signed certificate is included for testing purpose.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG (all uppercase) to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node app.js
```

## Example debug output

```text
2018-11-24T13:46:11.196Z ABHttpServer: Class version 2.3.0 constructor called (8080, 8081)
2018-11-24T13:46:11.206Z ABHttpServer: Creating HTTP server on port 8080
2018-11-24T13:46:11.211Z ABHttpServer: Creating HTTPS server on port 8081
2018-11-24T13:46:11.221Z ABHttpServer: HTTP server is listening
2018-11-24T13:46:11.221Z ABHttpServer: HTTP server started on port 8080
2018-11-24T13:46:11.221Z ABHttpServer: HTTPS server is listening
2018-11-24T13:46:11.221Z ABHttpServer: HTTPS server started on port 8081
2018-11-24T13:46:18.029Z ABHttpServer: HTTP client ::1 connected
2018-11-24T13:46:18.032Z ABHttpServer: HTTP client ::1 connected
2018-11-24T13:46:18.034Z ABHttpServer: HTTP client ::1 request received
2018-11-24T13:46:18.035Z ABHttpServer: <= Client ::1, HTTP/1.1 Non-TLS, GET /exit, Data 12 bytes
2018-11-24T13:46:18.036Z ABHttpServer: Method sendFile(*, exit, *, ) called
2018-11-24T13:46:18.036Z ABHttpServer: Method readFile(exit, *, *) called
2018-11-24T13:46:18.036Z ABHttpServer: Method sendJSON(*, *, 500) called
2018-11-24T13:46:18.036Z ABHttpServer: => Client ::1, HTTP 500, Data application/json 137 bytes
2018-11-24T13:46:23.043Z ABHttpServer: HTTP server is idle
2018-11-24T13:46:59.472Z ABHttpServer: HTTP client ::1 request received
2018-11-24T13:46:59.472Z ABHttpServer: <= Client ::1, HTTP/1.1 Non-TLS, GET /cert.pem, Data 12 bytes
2018-11-24T13:46:59.472Z ABHttpServer: Method sendFile(*, cert.pem, *, ) called
2018-11-24T13:46:59.472Z ABHttpServer: Method readFile(cert.pem, *, *) called
2018-11-24T13:46:59.473Z ABHttpServer: => Client ::1, HTTP 200, Data text/plain 2078 bytes
2018-11-24T13:47:04.478Z ABHttpServer: HTTP server is idle

```

## Prerequisits

* Node.js 10.10+ (HTTP/2 requirement)
* Typescript

## Unlicense

See [unlicense.org](http://unlicense.org)

_This software shall be used for Good, not Evil._

## GIT Source code

You will find the source code on [GitHub](https://github.com/AndyBrunner/npm-abhttpserver.git)

## Support

Support is provided on a best efford base. If you have any question, suggestion or find any issues, please report them. You may also contact the original author thru email at the address andy.brunner@abdata.ch.

### _Made with love in the beautiful city of Zurich, Switzerland_
