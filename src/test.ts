/* ABHttpServer Test */

import {ABHttpServer} from './ABHttpServer'

class MyServer extends ABHttpServer {
  get(url: string, request: any, response: any) {
    this.sendText(response, `Hello - The URL sent was ${url}`)
  }
}
var myServer = new MyServer(8080, 8081)
