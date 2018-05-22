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
module.exports = (handler) => (req, res) => {
  const token = req.headers['authorization'] ?
    req.headers['authorization'].substring(7) :
    null;
  if (!token) {
    return errors.endUnauthorised(res);
  }
  jwtUser(token, (err, user) => {
    if (err) {
      return errors.endUnauthorised(res);
    }
    req.user = user;
    handler(req, res);
  });
};
