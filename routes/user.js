'use strict';

const userModel = require("../models/user")


function registerUser(req, res) {
    console.log("asdsad")
    const newUser = JSON.stringify(req.body);
    if (!newUser.name || !newUser.password || !newUser.login) {
        res.write({error: "Not enough info."});
        res.end();
        return;
    }
    res.write({success: "User created."});
    res.end();
}

module.exports = {
    get: (req, res) => (res.write("hooray"), res.end()),
    post: registerUser
}