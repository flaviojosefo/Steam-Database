const mongoose = require('mongoose');

// Creates the schema for a Game
const gameSchema = new mongoose.Schema({
    name: String,
    steamId: String,
    genres: Array,
    developer: String,
	user: String
});

const GameItem = mongoose.model('items', gameSchema);
module.exports = GameItem;
