// Example: GetPost.ts
// Purpose: Start a HTTP and HTTPS server on ports 8080 and 8081. All requests from both servers are
//          handled thru the same class methods. For GET requests with an URL / stats, the server
//          sends back a JSON object with some server statistic, all other GET requests will receive
//          a text line with the send URL.All POST requests will be answered with the data sent in the
//          body of the POST request.

import { ABHttpServer, ABRequest } from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (request.url.path === 'stats') {
      this.sendJSON(response, this.getStatistics())
    } else {
      this.sendText(response, `The URL sent was ${request.url.path}`)
    }
  }
  post(request: ABRequest, response: ServerResponse) {
    this.sendJSON(response, { data: `The raw data sent was ${request.http.data}` })
  }
}
var myServer = new MyServer(8080, 8081)