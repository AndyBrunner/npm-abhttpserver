# ABHTTPServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves
HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install abhttpserver
```

## Usage

This example starts two servers (HTTP on port 8080 and HTTPS on port 8081). Both are handled thru the
appriopriate method(s).

Example test.ts:

```typescript
import ABHTTPServer from './ABHTTPServer'

class MyServer extends ABHTTPServer {
  get(url: string, request: any, response: any) {
    this.sendText(response, `Hello - The URL sent was ${url}`)
  }
}

var myServer = new MyServer(8080, 8081)
```

## Features

* Supports all HTTP methods (GET, POST, PUT, OPTIONS, etc.).
* Includes several methods for easy access to the received and sending data.
* The HTTPS server certificate and the trusted certificate chain are read from "x509-servercert.pem" and
  "x509-certchain.pem". A self signed certificate is included for testing purpose.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node app.js
```

Exmple debug output

```text
2018-07-18 09:25:31.833 ABHTTPSERVER Debug: Constructor called with (8080, 8080)
2018-07-18 09:25:31.837 ABHTTPSERVER Debug: Creating HTTP server on port 8080
2018-07-18 09:25:31.843 ABHTTPSERVER Debug: Creating HTTPS server on port 8081
2018-07-18 09:25:31.853 ABHTTPSERVER Debug: HTTP (net.Server) server is in listen mode
2018-07-18 09:25:31.853 ABHTTPSERVER Debug: HTTP server started on port 8080
2018-07-18 09:25:31.853 ABHTTPSERVER Debug: HTTPS (net.Server) server is in listen mode
2018-07-18 09:25:31.853 ABHTTPSERVER Debug: HTTPS server started on port 8081
2018-07-18 09:25:36.435 ABHTTPSERVER Debug: HTTPS (http.Server) server established connection
2018-07-18 09:25:36.435 ABHTTPSERVER Debug: HTTPS (tls.Server) server received TLS resume session status request
2018-07-18 09:25:36.435 ABHTTPSERVER Debug: HTTPS (tls.Server) server received certificate status request
2018-07-18 09:25:36.446 ABHTTPSERVER Debug: HTTPS (tls.Server) server started TLS session
2018-07-18 09:25:36.446 ABHTTPSERVER Debug: HTTPS (tls.Server) completed TLS handshaking process
2018-07-18 09:25:36.449 ABHTTPSERVER Debug: HTTPS 1.1 GET /index.html
2018-07-18 09:25:36.451 ABHTTPSERVER Debug: HTTPS (http.Server) server received client request
```

## Notes

* HTTP/2 support will be added when the express framework supports http2 in compatibility mode

## Prerequisits

* Node.js 8.4+
* npm install express
* npm install @types/node

## License

Public Domain: _This software shall be used for Good, not Evil._

## GIT Source code

You will find the source code on https://github.com/AndyBrunner/npm-abhttpserver.git

## Support

Support is provided on a best efford base. If you have any question, suggestion or find any issues, please report them. You may also contact the original author thru email at the address andy.brunner@abdata.ch.

"Made with love in the beautiful city of Zurich, Switzerland"