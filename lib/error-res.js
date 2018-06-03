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

/**
* Ends request with a 404
* @param {Response} res
*/
const endNotFound = handlerGenerator(
  404,
  'Not Found'
);
/**
* Ends request with a 400
* @param {Response} res
* @param {any} msg Error message explaining situation
*/
const endBadRequest = handlerGenerator(
  400,
  'Bad Request'
);

/**
* Ends request with a 500
* @param {Response} res
*/
const endServerError = handlerGenerator(
  500,
  'Server Error'
);

module.exports = {
  endUnauthorised,
  endNotFound,
  endBadRequest,
  endServerError
};
