'use strict';

module.exports = {
    get: (req, res) => (res.write("hooray"), res.end()),
    post: (req, res) => (res.write(req.body + "hooray"), res.end())
}