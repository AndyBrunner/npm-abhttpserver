// Example: FileServer.ts
// Purpose: Basic HTTP server to serve static files. The HTTP content type is set according to the file name extension.

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendFile(response, request.url.path)
  }
}
var myServer = new MyServer(8080, 8081)