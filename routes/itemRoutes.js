const express = require('express');
const router = express.Router();
const { isAuth } = require('../services/middleware');
const Game = require('../models/GameItem');

router.get('/', (req, res) => {
	res.redirect(req.originalUrl + '/add');
});

router.get('/add', /*isAuth,*/ (req, res) => {
	res.render('add_game', {
		user: req.user
	});
});

router.post('/add', isAuth, async (req, res) => {
	// Create a new game object
	const newGame = new Game({
	    name: req.body.name,
		steamId: req.body.steamId,
		genres: req.body.genres,
		developer: req.body.developer,
		user: req.user.googleId
	});
	
	// Try saving the game to the DB
	try {
		const thisGame = await newGame.save();
		console.log('Added game:', newGame);
		//res.redirect('/display_library');
	} catch (err) {
		console.error(err);
		res.render('error', {
            message_tag: 'Failed creating a new Game'
        });
	}
});

module.exports = router;