/*  HTTPS */
const https = require("https");
const http = require('http');
const fs = require("fs"),
    dotenv = require('dotenv');

// Get the configuration values
dotenv.config();
function createServer(app) {
    const port = process.env.PORT;
    if (process.env.NODE_ENV === 'production') {
        // In production don't use HTTP
        console.log("Production");
        const http_server = http.createServer(app).listen(port, () => {
            console.log('HTTP server listening on: ', http_server.address());
        });
    } else {
        // In development use HTTP
        console.log("Development");
        var server = process.env.SERVER;
        /*  CERTIFICATE */
        var keyname = "./certs/" + server + "-key.pem";
        var certname = "./certs/" + server + ".pem";

        console.log("Using key:", keyname);
        console.log("Using crt:", certname);
        console.log();

        const certs = {
            key: fs.readFileSync(keyname),
            cert: fs.readFileSync(certname)
        };
        const https_server = https.createServer(certs, app).listen(port, () => {
            console.log('HTTPS server listening on: ', https_server.address());
        });
    }
}

module.exports = { createServer }
// module.exports = {
//     port,
//     https,
//     certs
// }