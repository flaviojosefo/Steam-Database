const express = require('express');
const app = express();
const session = require('express-session');

const passport = require('passport');
const { createServer } = require('./services/server');
require('./services/passport');

// const {port, https, certs} = require('./services/https');
require('./services/server');
/*  VIEW ENGINE */
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 1
  }
}));

app.use(passport.initialize());
app.use(passport.session());
// Tell passport to trust the HTTPS proxy
app.enable("trust proxy");
require('./routes/authRoutes')(app);
// Create the server according to environment
createServer(app);

