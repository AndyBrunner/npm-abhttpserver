# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install abhttpserver
```

## Usage

Simple HelloWorld example:

This example starts an HTTP server on port 8080 which responds every client request with "Hello world!".

```typescript
import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Hello world!`)
  }
}
var myServer = new MyServer(8080)
```

Example test.ts:

This example starts two servers (HTTP:8080 and HTTPS:8081). All requests from both servers are handled thru the same class methods.

* For GET requests with an URL /stats, the server sends back a JSON object with some server statistic, all other GET requests will receive a text line with the send URL.
* All POST requests will be answered with the data sent with the POST request.

```typescript
import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (request.url.path == 'stats') {
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

## Features

* Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.) thru corresponding methods.
* Includes several methods for easy access to the received and sending data.
* The HTTPS server certificate and the trusted certificate chain are read from "key.pem" and
  "cert.pem". A self signed certificate is included for testing purpose.
* Detailed debugging information for HTTP events and data received and sent.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node test.js
```

Example debug output:

```text
2018-11-13T13:19:03.151Z ABHttpServer: Object constructor called (8080, 8081)
2018-11-13T13:19:03.161Z ABHttpServer: Creating HTTP server on port 8080
2018-11-13T13:19:03.165Z ABHttpServer: Creating HTTPS server on port 8081
2018-11-13T13:19:03.175Z ABHttpServer: HTTP server is listening
2018-11-13T13:19:03.175Z ABHttpServer: HTTP server started on port 8080
2018-11-13T13:19:03.175Z ABHttpServer: HTTPS server is listening
2018-11-13T13:19:03.175Z ABHttpServer: HTTPS server started on port 8081
2018-11-13T13:19:18.987Z ABHttpServer: HTTP client connected
2018-11-13T13:19:18.990Z ABHttpServer: HTTP client request received
2018-11-13T13:19:18.991Z ABHttpServer: <= HTTP/1.1 (Non-TLS) - Method GET - URL /hello - Content-Length 12
2018-11-13T13:19:18.991Z ABHttpServer: => HTTP Status 200 - Content-Length 22 - Content-Type text/plain
2018-11-13T13:19:23.996Z ABHttpServer: HTTP server is idle
2018-11-13T13:19:28.834Z ABHttpServer: HTTP client request received
2018-11-13T13:19:28.835Z ABHttpServer: <= HTTP/1.1 (Non-TLS) - Method POST - URL /helloagain - Content-Length 12
2018-11-13T13:19:28.835Z ABHttpServer: => HTTP Status 200 - Content-Length 45 - Content-Type application/json
2018-11-13T13:19:33.839Z ABHttpServer: HTTP server is idle
2018-11-13T13:19:59.899Z ABHttpServer: HTTPS client connected
2018-11-13T13:19:59.908Z ABHttpServer: HTTPS completed TLS handshaking
2018-11-13T13:19:59.910Z ABHttpServer: HTTPS client request received
2018-11-13T13:19:59.910Z ABHttpServer: <= HTTP/1.1 (TLSv1.2) - Method GET - URL /stats - Content-Length 12
2018-11-13T13:19:59.911Z ABHttpServer: => HTTP Status 200 - Content-Length 505 - Content-Type application/json
```

## Notes

* This module does not require any framework or additional NPM module.
* The secure HTTPS server is started as HTTP/2 but will fallback to HTTP/1.1 if the client does not support HTTP/2.
* The object ABRequest is passed to every user method and contains information about the http request.

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
