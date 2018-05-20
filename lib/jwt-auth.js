'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');
const errors = require('./error-res');

/**
* Meets middleware contract, wraps handler
* Expects an Authorization header with Bearer <jwt-token>
* Checks this token, if it is valid and user still exists -- writes user to req.user
* Else ends request with 401
* @param {Handler(req, res)} handler
*/
module.exports = (handler) => (req, res) => {
  const token = req.headers['authorization'] ?
    req.headers['authorization'].substring(7) :
    null;
  if (!token) {
    errors.endUnauthorised(res);
    return;
  }
  jwt.verify(token, config.session.secret, (err, decoded) => {
    if (err) {
      errors.endUnauthorised(res);
      return;
    }
    User.findById(decoded._id, (err, user) => {
      if (user) {
        req.user = user;
        handler(req, res);
      } else {
        errors.endUnauthorised(res);
      }
    });
  });
};
