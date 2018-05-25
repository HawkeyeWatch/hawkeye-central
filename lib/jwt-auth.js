'use strict';

const errors = require('./error-res');
const jwtUser = require('./jwt-user');

/**
* Meets middleware contract, wraps handler
* Expects an Authorization header with Bearer <jwt-token>
* Checks this token,
* if it is valid and user still exists -- writes user to req.user
* Else ends request with 401
* @param {Handler(req, res)} handler
*/
module.exports = (handler) => (client) => {
  const token = client.req.headers['authorization'] ?
    client.req.headers['authorization'].substring(7) :
    null;
  if (!token) {
    return errors.endUnauthorised(client.res);
  }
  jwtUser(token, (err, user) => {
    if (err) {
      return errors.endUnauthorised(client.res);
    }
    client.user = user;
    handler(client);
  });
};
