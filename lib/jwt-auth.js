'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');
const errors = require('./error-res')


module.exports = (handler) => {
    return (req, res) => {
        const token = req.headers['authorization'] ? req.headers['authorization'].substring(7) : null;
        if (!token) {
            errors.endUnauthorised(res);
            return;
        }
        jwt.verify(token, config.session.secret, (err, decoded) => {
            if (err) {
                errors.endUnauthorised(res);
                return;
            }
            const user = User.findById(decoded._id, (err, user) => {
                if (user) {
                    req.user = user;
                    handler(req, res);
                } else {
                    errors.endUnauthorised(res);
                }
            })
        });
    }
}