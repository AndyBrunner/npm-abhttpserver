/* ABHttpServer Test */

import { ABHttpServer, ABRequest} from './ABHttpServer'
import { ServerResponse } from 'http';

class MyServer extends ABHttpServer {
  get(request: ABRequest, response: ServerResponse) {
    if (request.url.path == 'exit') {
      this.sendText(response, "Terminate in progress")
    } else {
      this.sendText(response, "Echo")
    }
  }
}
var myServer = new MyServer(8080, 8081)
