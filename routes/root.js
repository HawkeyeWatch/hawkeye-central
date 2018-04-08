'use strict';

module.exports = {
    get: (match, req, res) => (res.write("hooray"), res.end()),
    post: (match, req, res) => (res.write(req.body + "hooray"), res.end())
}