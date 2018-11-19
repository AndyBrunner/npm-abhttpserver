// Example: FileServer.ts

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendFile(response, request.url.path)
  }
}
var myServer = new MyServer(8080, 8081)