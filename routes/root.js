'use strict';

module.exports = {
    get: (req, res) => {throw new Error('Test error')},
    post: (req, res) => (res.write(req.body + 'hooray'), res.end())
}