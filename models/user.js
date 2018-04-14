'use strict';

const mongoose = require('mongoose');
const moment = require('moment');
const bcrypt = require('bcrypt-nodejs');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const jwt = require('jsonwebtoken');
const config = require('../config');

const UserSchema = new mongoose.Schema({
  login: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (v) => /^[a-zA-Z0-9]*$/.test(v),
      message: '{VALUE} is not a valid login'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password too weak']
  },
  name: {
    type: String,
    required: true
  },
});

UserSchema.plugin(beautifyUnique); // For easy duplicate handling

UserSchema.pre('save', function(callback) {
  const user = this;
  if (!user.isModified('password')) {
    return callback();
  }

  if (user.password.length < 8) {
    const err = new Error('password must be at least 8 symbols long');
    err.name = 'ValidationError';
    return callback(err);
  }

  bcrypt.genSalt(5, (err, salt) => {
    if (err) {
      return callback(err);
    }

    bcrypt.hash(user.password, salt, () => {}, (err, hash) => {
      if (err) {
        return callback(err);
      }
      user.password = hash;
      callback();
    });
  });
});

UserSchema.methods.verifyPassword = function(pass, cb) {
  bcrypt.compare(pass, this.password, (err, isMatch) => {
    if (err) {
      cb(err);
    }

    cb(null, isMatch);
  });
};

UserSchema.methods.generateJwt = function(extended) {
  const expiry = moment();
  if (!extended) {
    // Generate token for 12 hours
    expiry.add(12, 'hours');
  } else {
    // Generate token for 14 days
    expiry.add(14, 'days');
  }

  return jwt.sign({
    _id: this._id,
    exp: parseInt(expiry.unix())
  }, config.session.secret);
};

UserSchema.methods.getFullName = function() {
  return `${this.name} ${this.full_name}`;
};

module.exports = mongoose.model('User', UserSchema);
