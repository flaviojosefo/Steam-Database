const mongoose = require('mongoose');

// Creates the schema for a Game
const librarySchema = new mongoose.Schema({
    ownderId: {
		type: String,
		required: true
	},
	games: [{
		steamId: String,
		addedAt: String
	}]
});

module.exports = mongoose.model('libraries', librarySchema);
