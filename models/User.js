const mongoose = require('mongoose');

// Creates the schema for a User.
const userSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    accessToken: String,
	refreshToken: String
});

const User = mongoose.model('users', userSchema);
module.exports = User;
