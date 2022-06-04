const mongoose = require('mongoose');

// Creates the schema for a Game
const gameSchema = new mongoose.Schema({
    title: {
		type: String,
		trim: true
	},
	steamId: {
		type: String,
		trim: true
	},
	genres: {
		type: Array
	},
	developer: {
		type: String,
		trim: true
	},
	addedBy: {
		type: String,
		required: true,
		trim: true
	},
	addedById: {
		type: String,
		required: true
	},
	addedAt: {
		type: String
	}
});

module.exports = mongoose.model('games', gameSchema);
