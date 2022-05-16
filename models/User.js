// Get the configuration values
require('dotenv').config();
const mongoose = require('mongoose');

const dbString = process.env.DB_STRING;
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const connection = mongoose.createConnection(dbString, dbOptions);

// Creates simple schema for a User.
const UserSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    accessToken: String,
	refreshToken: String
});

const User = connection.model('User', UserSchema);

module.exports = connection;
