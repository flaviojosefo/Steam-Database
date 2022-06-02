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

/*router.get('/store', (req, res) => {
	res.render('store');
	
	// Get games on store db
	
	// Send them to the rendered page
}

router.get('store/:id', (req, res) => {
	
}

router.get('/library', (req, res) => {
	res.render('library');
}*/

router.post('/add', /*isAuth, */async (req, res) => {
	//console.log(req.body);
	//console.log(formIsValid(req.body));
	
	// Create a new game object
	const newGame = new Game({
	    title: req.body.title,
		steamId: req.body.steamId,
		genres: req.body.genres,
		developer: req.body.developer,
		addedBy: getCurrentUser(req)[0],
		addedById: getCurrentUser(req)[1],
		addedAt: getDate().format(new Date())
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
	res.redirect(req.originalUrl);
});

function formIsValid(body) {
	if(body.title.trim().length == 0) return false;
	
	return true;
}

function getCurrentUser(req) {
	if (req.isAuthenticated()) {
		return [req.user.name, req.user.googleId];
	} else {
		return ["Unknown", 0];
	}
}

// Returns a date in a specific style
function getDate() {
	return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'long' });
}

module.exports = router;