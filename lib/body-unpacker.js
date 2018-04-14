'use strict';

function bodyUnpacker(handler) {
    return (match, req, res) => {
        console.log("begin")
        let body = [];
        req.on('data', chunk => {
            console.log("data", chunk)
            body.push(chunk);
        });
        req.on('end', () => {
            console.log("end")
            req.body = Buffer.concat(body).toString();;
            handler(req, res);
        });
        req.on('error', () => {
            res.statusCode = 500;
            res.statusMessage = "Internal Server Error";
            res.write("500 Internal Server Error");
            res.end();
        })
    }
}

module.exports = bodyUnpacker;
