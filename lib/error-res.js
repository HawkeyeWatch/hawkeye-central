'use strict';

/**
 * Generates error handlers
 */
const handlerGenerator = (statusCode, statusMessage) =>
  (res, msg) => {
    res.statusCode = statusCode;
    res.statusMessage = statusMessage;
    res.write(JSON.stringify({ error: msg ? msg : `${statusCode} ${statusMessage}` }));
  };

/**
* Ends request with a 401
* @param {Response} res
*/
const endUnauthorised = handlerGenerator(
  401,
  'Unauthorised'
);

// res => {
//   res.statusCode = 401;
//   res.statusMessage = 'Unauthorised';
//   res.write(JSON.stringify({ error: '401 Unauthorised' }));
//   res.end();
// };

/**
* Ends request with a 404
* @param {Response} res
*/
const endNotFound = handlerGenerator(
  404,
  'Not Found'
);

// res => {
//   res.statusCode = 404;
//   res.statusMessage = 'Not Found';
//   res.write(JSON.stringify({ error: '404 Not Found' }));
//   res.end();
// };

/**
* Ends request with a 400
* @param {Response} res
* @param {any} msg Error message explaining situation
*/
const endBadRequest = handlerGenerator(
  400,
  'Bad Request'
);

// (res, msg) => {
//   res.statusCode = 400;
//   res.statusMessage = 'Bad Request';
//   res.write(JSON.stringify({ error: msg }));
//   res.end();
// };

/**
* Ends request with a 500
* @param {Response} res
*/
const endServerError = handlerGenerator(
  500,
  'Server Error'
);

// (res, err) => {
//   console.error(err);
//   res.statusCode = 500;
//   res.statusMessage = 'Server Error';
//   res.write('500 Server Error');
//   res.end();
// };

module.exports = {
  endUnauthorised,
  endNotFound,
  endBadRequest,
  endServerError
};
