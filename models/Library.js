const mongoose = require('mongoose');

// Creates the schema for a Game
const librarySchema = new mongoose.Schema({
    ownderId: {
		type: String,
		required: true
	},
	games: {
		type: Array
	}
});

module.exports = mongoose.model('libraries', librarySchema);
