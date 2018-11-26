# ABHttpServer - Simple HTTP Server Framework

This abstract class can be instantiated to create a simple and easy to use HTTP server. It serves all HTTP and HTTPS requests concurrently on separate TCP/IP ports.

## Installation

```bash
npm install typescript
npm install @types/node
npm install abhttpserver
```

## Example: HelloWorld

Starts an HTTP server on port 8080 which responds every client request with a simple `Hello world!` text.

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

## Features

### TypeScript Language

This NPM module is written in TypeScript language. This language allows for smaller, cleaner code and an easier implementation of classes, subclasses and class methods. This module does not use or require any framework or additional NPM module. The implementing user code can also be written in TypeScript or in standard JavaScript language.

### ABRequest Object

Before calling the user method, an ABRequest object is created which contains useful information about the environment, HTTP request, HTTP headers, URL, passed data, etc.

### Server Statistics

The method `getStatistics()` returns an JSON object with information about the server, operating system, CPU, used processor time and the served requests.

### Supporting Methods

Several methods are included to allow an easy access and handling of the data, e.g. `sendText()`, `sendHTML()`, `sendJSON()`, `readFile()`, `sendFile()`, `redirectUrl()`, etc.

### Error Handling

All errors are sent back to the client as a formatted JSON string, e.g. `{ "httpStatus": 500, "error": "The file rongfile.txt does not exist", "component": "ABHttpServer", "version:": "2.3.0", "time": "2018-11-25T07:01:38.302Z" }`. Whenever possible, the server will call the method `clientError(Error, Socket)` (if present) for communication or protocol errors to allow the user code to handle the error.

### HTTP/2 Support

Secure connections over TLS are established with the HTTP/2 protocol. If the client does not support HTTP/2, the server will fallback to HTTP 1.1. The negotiated protocol version and cypher are stored in the ABRequest object.

### HTTPS Support

The HTTPS server certificate and the trusted certificate chain are read from `key.pem` and `cert.pem`. A self signed certificate is included for testing purpose.

### HTTP Methods Support

All standard HTTP methods (e.g. GET, POST, DELETE, OPTIONS, etc.) are supported. The user method is called based on the HTTP method e.g. `get(request, response)`. If no corresponding method is found, the generic `allMethods(request, response)` will be called. If this generic method is also missing, an `HTTP 501 Not Implemented` error is returned.

### Support for GET /api/ping

The server will automatically respond to a `GET /api/ping` request with the JSON response `{ "response": "ok" }`. Monitoring or up-time services may use this function to check for server availability. This behaviour can be disabled by calling the method `disablePing()`.

### Support for Session Cookie

For each client, the server will generate a unique 32 byte base-64 coded session identifier. This id will be sent to the client in the HTTP header, e.g. `Set-Cookie: ABSession=IHBlIbFDbxu9SvCSZ6vjDk9KE/Hcyw4NGUPYffNzsI4=`. As in every cookie implementation, the client code will have to send back this cookie to the server with each request. The cookie name is treated case insensitive on the server, so the cookie can be sent back as `ABSession` or `absession`. By using this session cookie, the server and client may implement a session identification. Since there is no `Expires=` tag definied, the cookie resides only in memory and will be deleted if the client or server terminates.

### Example Code

Various code examples are included. See `HelloWorld.ts`, `GetPost.ts`, `FileServer.ts`, `ShowCookie.ts` and `RedirectUrl.ts`.

### Debugging

Detailed debugging is supported by setting the environment variable `AB_DEBUG=true` (case sensitive). The debugging data is sent to `console.debug()` and includes an exact timestamp with the class name, all HTTP server events and some useful information about the data received and sent. It may result in a lot of data sent to the console.

Example

```bash
AB_DEBUG=true node app.js
```

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

## Prerequisites

* Node.js 10.10+ (This is an HTTP/2 requirement)
* Typescript (If the user code is written in TypeScript)

## Unlicense (see [unlicense.org](http://unlicense.org))

_This software shall be used for Good, not Evil._

## GIT Source code

The complete source code is available on [GitHub](https://github.com/AndyBrunner/npm-abhttpserver.git)

## Support

Support is provided on a best efford base. If you have any question, suggestion or find any issues, please report them. You may also contact the original author thru email at the address andy.brunner@abdata.ch.

### _Made with love in the beautiful city of Zurich, Switzerland_
