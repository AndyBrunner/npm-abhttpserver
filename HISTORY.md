# Revision History

## Version 2.3.0 / xx-Nov-2018

* Change: Better determination of hostname stored in ABRequest
* Change: Remove method terminate() for consistency
* Add: Include component version in error JSON object
* Add: Include debug messages for function invocation, e.g. sendHTML(), getStatistics()
* Add: Include readFile() method to read content of a file
* Add: Add the HTTP and HTTPS ports in the statistics object
* Add: Add the HTTP and HTTPS ports in the toString() method

## Version 2.2.0 / 19-Nov-2018

* Add: Include sample code HelloWorld.ts, GetPost.ts, FileServer.ts and RedirectHttps.ts
* Add: New method allMethods() which is called if no corresponding subclass for HTTP method is present. If the HTTP method cannot be handled with either a corresponding method and no allMethods() is present, a "HTTP 501 Not Implemented" is returned
* Add: More detailed information in debug output
* Change: Corrected bug in constructor argument checking
* Change: Some monor code cleanup

## Version 2.1.0 / 14-Nov-2018

* Add: getStatistics() now includes statistics for server, operating system, platform and CPU usage
* Add: ABRequest object now includes hostname, TLS version and used cypher
* Add: New method redirectUrl() to send a HTTP 301 redirect to the client
* Change: Code cleanup in event debugging

## Version 2.0.2 / 07-Nov-2018

* Add: Include method sendFile() to return content of a static file
* Add: Set 'Content-Length' and 'Server' in HTTP response
* Add: Set 'time' and 'httpStatus' in error JSON objects
* Change: Deleted the allMethods() method due to inconsistencies
* Change: Use ISO timestamp in debug console output
* Change: Add more information in debug console output
* Change: RequestData.url.path is now URI decoded and trimmed
* Change: Add ABHttpServer version number to ABRequest object
* Change: Overall code cleanup

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
