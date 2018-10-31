# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install abhttpserver
```

## Usage

This example starts two servers (HTTP on port 8080 and HTTPS on port 8081). Both are handled thru the
appriopriate methods.

Example test.ts:

```typescript
import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Hello - The URL sent was ${request.url.path}`)
  }
  post(request: ABRequest, response: ServerResponse) {
    this.sendJSON(response, { data: `The data sent was ${request.http.data}` })
  }
}
var myServer = new MyServer(8080, 8081)
```

## Features

* Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.) thru corresponding methods.
* Includes several methods for easy access to the received and sending data.
* The HTTPS server certificate and the trusted certificate chain are read from "key.pem" and
  "cert.pem". A self signed certificate is included for testing purpose.
* Detailed debugging information for HTTP events and data received/sent.

## Debugging

Detailed debugging to the console is supported by setting the environment variable AB_DEBUG to true. The debugging data includes most of the HTTP/HTTPS server events and may result in a lot of data sent to the console.

```bash
AB_DEBUG=true node test.js
```

Example debug output:

```text
2018-10-31 10:52:00.488 ABHttpServer Constructor called (8080, 8081)
2018-10-31 10:52:00.498 ABHttpServer Creating HTTP server on port 8080
2018-10-31 10:52:00.503 ABHttpServer Creating HTTPS server on port 8081
2018-10-31 10:52:00.512 ABHttpServer HTTP net.Server server is in listen mode
2018-10-31 10:52:00.512 ABHttpServer HTTP server started on port 8080
2018-10-31 10:52:00.512 ABHttpServer HTTPS net.Server server is in listen mode
2018-10-31 10:52:00.512 ABHttpServer HTTPS server started on port 8081
2018-10-31 10:52:05.086 ABHttpServer HTTP http.Server server established connection
2018-10-31 10:52:05.092 ABHttpServer HTTP http.Server server received client request
2018-10-31 10:52:05.094 ABHttpServer HTTP/1.1 POST /test
2018-10-31 10:52:05.094 ABHttpServer Sending HTTP status 200 with 41 bytes of application/json data
2018-10-31 10:52:28.006 ABHttpServer HTTP http.Server server established connection
2018-10-31 10:52:28.009 ABHttpServer HTTP http.Server server received client request
2018-10-31 10:52:28.009 ABHttpServer HTTP/1.1 GET /test
2018-10-31 10:52:28.009 ABHttpServer Sending HTTP status 200 with 29 bytes of text/plain data
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
