// Example: Show cookie.ts
// Purpose: Show the server generated cookie

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    this.sendText(response, `Unique session identifier: ${request.sessionId}`)
  }
}
var myServer = new MyServer(8080)