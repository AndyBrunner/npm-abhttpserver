/* ABHttpServer Test */

import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (request.url.path == 'stats') {
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
