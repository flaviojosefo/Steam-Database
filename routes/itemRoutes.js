const router = require('express').Router();
const fetch = require('node-fetch');
const url = require('url');
const { isAuth } = require('../services/middleware');
const { hasLib } = require('../services/libMiddleware');
const Game = require('../models/Game');
const Library = require('../models/Library');

router.get('/', (req, res) => {
	// Redirect to the Store
	res.redirect('/games/store');
});

router.get('/add', (req, res) => {
	res.render('add_game', {
		user: req.user
	});
});

router.get('/store', async (req, res) => {
	
	// Get games on store DB and reverse order
	let storeGames = await Game.find();
	storeGames = storeGames.reverse();
	
	// Get a logo for each game, searching by the game's Id
	let logos = [];
	for (let i = 0; i < storeGames.length; i++) {
		logos.push(await fetchLogo(storeGames[i].steamId));
	}
	
	// Array of games owned by user
	let ownedGames = [];
	
	// Check if a user is logged in
	if (req.isAuthenticated()) {
		// Retrieve the user's library
		const userLib = await Library.findOne({ ownderId: req.user.googleId });
		
		// Get games on user's library
		let userGames = userLib.games;
		
		// Get user's owned games by steamId
		userGames.forEach(function(currentValue) { ownedGames.push(currentValue.steamId); });
	}
	
	// Send relevant info to the 'ejs' file
	res.render('store', {
		user: req.user,
		gamesList: storeGames,
		gameLogos: logos,
		ownedIds: ownedGames
	});
});

router.get('/library', isAuth, hasLib, async (req, res) => {
	
	// Fetch the user's library
	let userLib = await Library.findOne({ ownderId: req.user.googleId });
	
	// Check if we get data on a query
	if (req.query.steamId) {
		// Check if the game is already owned by the user
		let alreadyOwned = false;
		userLib.games.forEach(function(currentValue) { if (currentValue.steamId == req.query.steamId) { alreadyOwned = true; } });
		console.log('Game ' + req.query.steamId + ' already owned: ' + alreadyOwned);
		
		try {
			// Only add a game to the DB if the user doesn't own it
			if (!alreadyOwned) {
				// If it does, push the game's 'steamId' to the user's library
				userLib.games.push({ 
					steamId: req.query.steamId, 
					addedAt: getDate().format(new Date()) 
				});
				await userLib.save();
				console.log('Added game ' + req.query.steamId + ' to ' + req.user.name + '\'s Library');
			}
			
			// Redirect the user to the normal library URL
			res.redirect(url.parse(req.originalUrl).pathname);
		} catch (err) {
			console.error(err);
			res.render('error', {
				message_tag: 'Failed adding a Game to the Library'
			});
		}
		return;
	}
	
	// Get games on user's library and reverse order
	let userGames = userLib.games;
	userGames = userGames.reverse();
	
	// Get an array with the steamIds of each game
	let gamesId = [];
	userGames.forEach(function(currentValue) { gamesId.push(currentValue.steamId); });
	//console.log(gamesId);
	
	// Fetch games info from store (by steamId)
	let gamesInfo = await Game.find({ 'steamId': { $in: gamesId } });
	
	// Get the positions of each Id on the 'gamesId' array
	const itemPositions = {};
	for (const [index, steamId] of gamesId.entries()) {
		itemPositions[steamId] = index;
	}
	
	// Sort the info array to correspond to the gamesId array
	gamesInfo.sort((a, b) => itemPositions[a.steamId] - itemPositions[b.steamId]);
	//console.log(gamesInfo);
	
	// Get a logo for each game, searching by the game's steamId
	// Why not use forEach here aswell? Because forEach doesn't allow 'await'
	let logos = [];
	for (let i = 0; i < userGames.length; i++) {
		logos.push(await fetchLogo(userGames[i].steamId))
	}
	
	res.render('library', {
		user: req.user,
		gamesLibInfo: userGames,
		ownedGames: gamesInfo,
		gameLogos: logos
	});
});

router.post('/library', async (req, res) => {
	
	console.log('Removed game ' + req.body.removeId + ' from ' + req.user.name + '\'s Library');
	
	try {
		// Try to find a library from the current user
		// and remove (pull) a game with the specified steamId
		await Library.updateOne(
			{ ownderId: req.user.googleId }, 
			{ $pull: { games: { steamId: req.body.removeId } } }
		);
	} catch(err) {
		console.log(err);
	}
	
	// Reload the library page
	res.redirect(req.originalUrl);
});

/*router.get('store/:id', (req, res) => {
	//const externalInfo = await getSteamInfo('1085660');
	//console.log(externalInfo.success);
}*/

router.post('/add', async (req, res) => {
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
	
	res.redirect('/games/store');
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
	}).catch (err => {
		console.error(err);
	});
}

// Return a logo image as a URL
async function fetchLogo(appId) {
	
	// Default URL for a game's logo
	const logoUrl = "https://cdn.akamai.steamstatic.com/steam/apps/" + appId + "/capsule_231x87.jpg";
	
	// Fetch logo URL
	const response = await fetch(logoUrl);
	
	// Check if URL returns empty (e.g.: 404)
	if (response.ok) {
		//console.log('logo found!');
		// Return an external logo
		return logoUrl;
	} else {
		//console.log('logo NOT found!');
		// Return a default logo in the server
		return "/images/applogo.svg";
	}
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