// Example C: RedirectHttps.ts

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (!request.http.tls) {
      this.redirectUrl(response, `https://${request.server.hostname}:8081/${request.url.path}`)
      return
    }
    this.sendText(response, `The secure connection is established`)
  }
}
var myServer = new MyServer(8080, 8081)