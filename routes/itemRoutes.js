const router = require('express').Router();
const fetch = require('node-fetch');
const url = require('url');
const { isAuth } = require('../services/middleware');
const Game = require('../models/Game');
const Library = require('../models/Library');

router.get('/add', /*isAuth,*/ (req, res) => {
	res.render('add_game', {
		user: req.user
	});
});

router.get('/store', async (req, res) => {
	
	// Get games on store DB and reverse order
	let storeGames = await Game.find();
	storeGames = storeGames.reverse();
	
	let logos = [];
	
	// Get a logo for each game, searching by the game's Id
	for (let i = 0; i < storeGames.length; i++) {
		logos.push(await fetchLogo(storeGames[i].steamId))
	}
	
	// Send relevant info to the 'ejs' file
	res.render('store', {
		user: req.user,
		gamesList: storeGames,
		gameLogos: logos
	});
});

router.get('/library', isAuth, async (req, res) => {
	
	// Check if we get data on a query
	if(req.query.gameId) {
		
		// Create a new game object
		/*const userLib = new Library({
			ownderId: req.user.googleId,
			games: {
				gameId: req.query.gameId,
				addedAt: getDate().format(new Date())
			}
		});*/
		
		const userLib = await Library.findOne({ ownderId: req.user.googleId });
		
		try {
			userLib.games.push({ gameId: req.query.gameId, addedAt: getDate().format(new Date()) });
			await userLib.save();
			console.log('Added game:', userLib);
		} catch (err) {
			console.error(err);
			res.render('error', {
				message_tag: 'Failed adding a Game to the Library'
			});
			return;
		}
		
		// Redirect the user to the normal library URL
		res.redirect(url.parse(req.originalUrl).pathname);
		return;
	}
	
	// Get games on user's library and reverse order
	const userLib = await Library.findOne({ ownderId: req.user.googleId });
	let userGames = userLib.games;
	userGames = userGames.reverse();
	
	let logos = [];
	
	// Get a logo for each game, searching by the game's Id
	for (let i = 0; i < userGames.length; i++) {
		logos.push(await fetchLogo(userGames[i].steamId))
	}
	
	res.render('library', {
		user: req.user,
		ownedGames: userGames,
		gameLogos: logos
	});
});

/*router.get('store/:id', (req, res) => {
	//const externalInfo = await getSteamInfo('1085660');
	//console.log(externalInfo.success);
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

async function getSteamInfo(appId) {
	
	const steamAppUrl = 'https://store.steampowered.com/api/appdetails?appids=' + appId;
	//console.log(steamAppUrl);
	
	// Get JSON from specified url
	const getJSON = async url => {
		const response = await fetch(url);
		if(!response.ok) // check if response worked (no 404 errors etc...)
		throw new Error(response.statusText);

		const data = response.json(); // get JSON from the response
		return data; // returns a promise, which resolves to this data value
	}
	
	return await getJSON(steamAppUrl).then(data => {
		//console.log(data[parseInt(appId)]);
		return data[parseInt(appId)];
	}).catch(err => {
		console.error(err);
	});
}

// Return a logo image as a URL
async function fetchLogo(appId) {
	
	// Default URL for a game's logo
	const logoUrl = "https://cdn.akamai.steamstatic.com/steam/apps/" + appId + "/capsule_231x87.jpg";
	
	// Check if URL returns empty (e.g.: 404)
	if (await urlExists(logoUrl)) {
		//console.log('logo found!');
		
		// Return an external logo
		return logoUrl;
	} else {
		//console.log('logo NOT found!');
		
		// Return a default logo in the server
		return "/images/applogo.svg";
	}
}

// Check a URL's 'ok' status
async function urlExists(url) { return (await fetch(url)).ok }

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