const express = require('express');
const app = express();
const session = require('express-session');

const passport = require('passport');

const {port, https, certs} = require('./services/https');

/*  VIEW ENGINE */
app.set('view engine', 'ejs');












require('./routes/authRoutes')(app);

const https_server = https.createServer(certs, app).listen(port, () => {
  console.log('HTTPS server listening on: ', https_server.address());
});
