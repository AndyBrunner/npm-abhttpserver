// Example: HelloWorld.ts
// Purpose: Sends back the response "Hello World!" to every client request

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  allMethods(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Hello world!`)
  }
}
var myServer = new MyServer(8080)