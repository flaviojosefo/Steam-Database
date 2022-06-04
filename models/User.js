const mongoose = require('mongoose');

// Creates the schema for a User
const userSchema = new mongoose.Schema({
    googleId: {
		type: String,
		required: true
	},
    name: {
		type: String
	},
    email: {
		type: String
	},
    accessToken: {
		type: String,
		required: true
	},
	creationDate: {
		type: String
	},
	expiryDate: {
		type: String
	},
	photo: {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('users', userSchema);
