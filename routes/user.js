'use strict';

const User = require("../models/user")



function registerUser(req, res) {
    const newUser = JSON.parse(req.body);
    if (!newUser.name || !newUser.password || !newUser.login) {
        res.write(JSON.stringify({error: "Not enough info."}));
        res.end();
        return;
    }
    const u = new User(newUser);
    u.save((error) => {
        if (error) {
            res.write(JSON.stringify({error: error.message}));
            res.end();
            return;
        }
        res.write(JSON.stringify({success: "User created."}));
        res.end();
    })
}
function getUserByLogin(req, res) {
    User.findOne({login: req.match.login}).then(
        r => {
            if (r) {
                res.write(JSON.stringify({name: r.name, login: r.login, token: r.generateJwt()})); 
                res.end();
            } else {
                res.statusCode = 404;
                res.statusMessage = "Not Found";
                res.write("404 Not Found");
                res.end();
            }
        }
    )
}

module.exports = {
    getUserByLogin,
    post: registerUser
}