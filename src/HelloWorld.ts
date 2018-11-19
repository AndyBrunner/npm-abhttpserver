// Example: HelloWorld.ts

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  allMethods(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Hello world!`)
  }
}
var myServer = new MyServer(8080)