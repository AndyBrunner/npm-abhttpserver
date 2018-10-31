# Revision History

## Version 2.0.0 / xx-Nov-2018

* Change: Major rebuild of ABHttpServer class to avoid using the Express framework as a prerequisite
* Change: Created new self-signed certificate for localhost
* Add: First parameter in all user method now contains an object ABRequest wth the request data
* Add: Support added for HTTP/2 (only for HTTPS) with fallback to HTTP/1.1 for clients not supporting HTTP/2
* Add: Support added for all IANA defined HTTP methods (total 39 methods)
* Add: New method sendJSON() added

## Version 1.0.1 / 21-Aug-2018

* Change: Ignore all calls after method terminate()

## Version 1.0.0 / 05-Aug-2018

* Change: Throw Error() in constructor for invalid parameters
* Change: Disable sending the Express HTTP header 'x-powered-by'
* Change: Overall code cleanup
* Add: Return HTTP status 501 for HTTP methods not implemented by a user method
* Add: Include generated definition files ABHttpServer.d.ts and test.d.ts
* Add: Method setHeaders() to add HTTP headers to every response

## Version 0.2.0 / 20-Jul-2018

* Change: Corrected error in sample code test.ts

## Version 0.1.2 / 18-Jul-2018

* Add: Method terminate() to stop the HTTP/HTTPS server
* Add: Source code added to GitHub.com

## Version 0.1.1 / 16-Jul-2018

* Change: Small typos corrected

## Version 0.1.0 / 16-Jul-2018

* Add: Initial version
