# Revision History

## Version 2.0.1 / 03-Nov-2018

* Add: Include method toString() to write out ABHttpServer object
* Add: Include method allMethods() which is called before the individual HTTP method call
* Add: Include method getStatistics() to return some server statistics
* Change: Remove HTTP status 501 for HTTP methods not implemented by a user subclass (replaced by allMethods() call)
* Change: Method setHeaders() now works as expected
* Change: Sample code test.ts enhanced to further illustrate the class usage

## Version 2.0.0 / 30-Oct-2018

* Change: Major rebuild of ABHttpServer class to avoid using the Express framework as a prerequisite
* Change: Created new self-signed certificate for localhost
* Add: First parameter in all user method now contains an object ABRequest wth the request data
* Add: Support added for HTTP/2 (only for HTTPS) with fallback to HTTP/1.1 for clients not supporting HTTP/2
* Add: Support added for all IANA defined HTTP methods (total 39 methods)
* Add: Include method sendJSON()

## Version 1.0.1 / 21-Aug-2018

* Change: Ignore all calls after method terminate()

## Version 1.0.0 / 05-Aug-2018

* Change: Throw Error() in constructor for invalid parameters
* Change: Disable sending the Express HTTP header 'x-powered-by'
* Change: Overall code cleanup
* Add: Return HTTP status 501 for HTTP methods not implemented by a user subclass
* Add: Include generated definition files ABHttpServer.d.ts and test.d.ts
* Add: Include method setHeaders() to add HTTP headers to every response

## Version 0.2.0 / 20-Jul-2018

* Change: Corrected error in sample code test.ts

## Version 0.1.2 / 18-Jul-2018

* Add: Method terminate() to stop the HTTP/HTTPS server
* Add: Source code added to GitHub.com

## Version 0.1.1 / 16-Jul-2018

* Change: Small typos corrected

## Version 0.1.0 / 16-Jul-2018

* Add: Initial version
