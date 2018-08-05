"use strict";
/* ABHttpServer Test */
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
    MyServer.prototype.get = function (url, request, response) {
        this.sendText(response, "Hello - The URL sent was " + url);
    };
    return MyServer;
}(ABHttpServer_1.ABHttpServer));
var myServer = new MyServer(8080, 8081);
