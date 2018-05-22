'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

module.exports = function(token, cb) {
  jwt.verify(token, config.session.secret, (err, decoded) => {
    if (err) {
      return cb(err);
    }
    User.findById(decoded._id, (err, user) => {
      if (user) {
        cb(null, user);
      } else {
        cb('No user found');
      }
    });
  });
};
