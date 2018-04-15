'use strict';

const User = require('../models/user')

const errors = require('../lib/error-res');

function registerUser(req, res) {
    const newUser = JSON.parse(req.body);
    if (!newUser.name || !newUser.password || !newUser.login) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
        return;
    }
    const u = new User(newUser);
    u.save((error) => {
        if (error) {
            errors.endBadRequest(res, error.message);
            console.log(error.message);
            return;
        }
        res.write(JSON.stringify({success: 'User created.'}));
        console.log(`User created. ${newUser.name} ${newUser.login}`)
        res.end();
    })
}
function getUserByLogin(req, res) {
    User.findOne({login: req.match.login}).then(
        r => {
            if (r) {
                res.write(JSON.stringify({name: r.name, login: r.login, token: r.generateJwt(true)})); 
                res.end();
            } else {
                errors.endNotFound(res);
            }
        }, r => {
            errors.endNotFound(res);
        }
    )
}

function getToken(req, res) {
    const user = JSON.parse(req.body);
    if (!user.password || !user.login) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
        return;
    }
    User.findOne({login: user.login}).then(
        r => {
            if (r) {
                r.verifyPassword(user.password, (err, match) => {
                    if (err || !match) {
                        errors.endUnauthorised(res);
                        console.log('Login', err, match);
                        return;
                    }
                    res.write(JSON.stringify({name: r.name, login: r.login, token: r.generateJwt(user.extended)}));
                    console.log('Login succesful');
                    res.end();
                })
            } else {
                errors.endNotFound(res);
            }
        }
    );
}

module.exports = {
    getUserByLogin,
    post: registerUser,
    getToken
}