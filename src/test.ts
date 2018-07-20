/* ABHTTPServer Test */

import ABHTTPServer from './ABHTTPServer'

class MyServer extends ABHTTPServer {
  get(url: string, request: any, response: any) {
    this.sendText(response, `Hello - The URL sent was ${url}`)
  }
}
var myServer = new MyServer(8080, 8081)
