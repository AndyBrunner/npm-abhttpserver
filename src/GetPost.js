"use strict";
// Example: GetPost.ts
// Purpose: Start a HTTP and HTTPS server on ports 8080 and 8081. All requests from both servers are
//          handled thru the same class methods. For GET requests with an URL / stats, the server
//          sends back a JSON object with some server statistic, all other GET requests will receive
//          a text line with the send URL.All POST requests will be answered with the data sent in the
//          body of the POST request.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var ABHttpServer_1 = require("./ABHttpServer");
var MyServer = /** @class */ (function (_super) {
    __extends(MyServer, _super);
    function MyServer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyServer.prototype.get = function (request, response) {
        if (request.url.path === 'stats') {
            this.sendJSON(response, this.getStatistics());
        }
        else {
            this.sendText(response, "The URL sent was " + request.url.path);
        }
    };
    MyServer.prototype.post = function (request, response) {
        this.sendJSON(response, { data: "The raw data sent was " + request.http.data });
    };
    return MyServer;
}(ABHttpServer_1.ABHttpServer));
var myServer = new MyServer(8080, 8081);
