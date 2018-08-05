# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install abhttpserver
```

## Usage

This example starts two servers (HTTP on port 8080 and HTTPS on port 8081). Both are handled thru the
appriopriate method(s).

Example test.ts:

```typescript
import {ABHttpServer} from './ABHttpServer'

class MyServer extends ABHttpServer {
  get(url: string, request: any, response: any) {
    this.sendText(response, `Hello - The URL sent was ${url}`)
  }
}
var myServer = new MyServer(8080, 8081)
```

## Features

* Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.) thru corresponding methods.
* Includes several methods for easy access to the received and sending data.
* The HTTPS server certificate and the trusted certificate chain are read from "x509-servercert.pem" and
  "x509-certchain.pem". A self signed certificate is included for testing purpose.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node test.js
```

Exmple debug output:

```text
2018-08-05 13:19:58.663 ABHttpServer: Constructor called (8080, 8081)
2018-08-05 13:19:58.668 ABHttpServer: Creating HTTP server on port 8080
2018-08-05 13:19:58.673 ABHttpServer: Creating HTTPS server on port 8081
2018-08-05 13:19:58.683 ABHttpServer: HTTP (net.Server) server is in listen mode
2018-08-05 13:19:58.683 ABHttpServer: HTTP server started on port 8080
2018-08-05 13:19:58.683 ABHttpServer: HTTPS (net.Server) server is in listen mode
2018-08-05 13:19:58.683 ABHttpServer: HTTPS server started on port 8081
2018-08-05 13:20:02.469 ABHttpServer: HTTPS (http.Server) server established connection
2018-08-05 13:20:02.470 ABHttpServer: HTTPS (tls.Server) server received certificate status request
2018-08-05 13:20:02.480 ABHttpServer: HTTPS (tls.Server) server started TLS session
2018-08-05 13:20:02.481 ABHttpServer: HTTPS (tls.Server) completed TLS handshaking process
2018-08-05 13:20:02.484 ABHttpServer: HTTPS 1.1 GET /index.html
2018-08-05 13:20:02.484 ABHttpServer: Sending HTTP status 200 with 36 bytes of text/plain data
2018-08-05 13:20:02.485 ABHttpServer: HTTPS (http.Server) server received client request
```

## Notes

* HTTP/2 support will be added when the express framework supports http2 in compatibility mode

## Prerequisits

* Node.js 8.4+
* npm install express
* npm install @types/node

## Unlicense

See [unlicense.org](http://unlicense.org)

_This software shall be used for Good, not Evil._

## GIT Source code

You will find the source code on [GitHub](https://github.com/AndyBrunner/npm-abhttpserver.git)

## Support

Support is provided on a best efford base. If you have any question, suggestion or find any issues, please report them. You may also contact the original author thru email at the address andy.brunner@abdata.ch.

### _Made with love in the beautiful city of Zurich, Switzerland_
