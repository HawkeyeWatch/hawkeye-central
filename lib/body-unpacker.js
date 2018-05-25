'use strict';

/**
* Meets middleware contract, wraps handler
* collects request body into req.body
* @param {Handler(req, res)} handler
*/
function bodyUnpacker(handler) {
  return (client) => {
    const { req, res } = client;
    const body = [];
    req.on('data', chunk => {
      body.push(chunk);
    });
    req.on('end', () => {
      client.body = Buffer.concat(body).toString();
      handler(client);
    });
    client.req.on('error', () => {
      res.statusCode = 500;
      res.statusMessage = 'Internal Server Error';
      res.write('500 Internal Server Error');
      res.end();
    });
  };
}

module.exports = bodyUnpacker;
