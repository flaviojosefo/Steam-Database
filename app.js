// Get the configuration values
require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
var mongoose = require('mongoose');

const passport = require('passport');
const { createServer } = require('./services/server');
require('./services/passport');

app.use(express.urlencoded({ extended: true }));
// const {port, https, certs} = require('./services/https');
require('./services/server');
/*  VIEW ENGINE */
app.set('view engine', 'ejs');

app.use(express.static('public'));

const dbString = process.env.DB_STRING;
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

// Establish a general mongoose connection to the DB
mongoose.connect(dbString, dbOptions);

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: dbString,
        mongoOptions: dbOptions,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 // Equals 1 hour (60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// App routes
app.use('/', require('./routes/authRoutes'));
app.use('/games', require('./routes/itemRoutes'));

// Create the server according to environment
createServer(app);