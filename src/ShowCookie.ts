// Example: Show cookie.ts
// Purpose: Show the server generated cookie

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `The unique session identifier is ${request.sessionId}`)
  }
}
var myServer = new MyServer(8080)