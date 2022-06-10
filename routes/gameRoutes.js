const router = require('express').Router();
const fetch = require('node-fetch');
const url = require('url');
const { isAuth } = require('../services/middleware');
const Game = require('../models/Game');
const Library = require('../models/Library');

router.get('/', (req, res) => {
	// Redirect to the Store
	res.redirect('/games/store');
});

router.get('/add', (req, res) => {
	// Display the 'Add Game' page
	res.render('add_game', {
		user: req.user
	});
});

router.get('/store', async (req, res) => {
	
	try {
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
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Library Error'
		});
	}
	
	
});

router.get('/library', isAuth, async (req, res) => {
	// Encapsulate code in try/catch to prevent await related errors
	try {
		// Fetch a library based on user's googleId
		let userLib = await Library.findOne({ ownderId: req.user.googleId });
		
		// Check if user does NOT have a library
		if (!userLib) {
			// If not, create a new (empty) one
			userLib = await new Library({
				ownderId: req.user.googleId,
				games: undefined
			}).save();
			console.log('Created library for user ' + req.user.name, userLib);	
		}
	
		// Check if we get data on a query
		if (req.query.steamId) {
			// Check if the game is already owned by the user
			let alreadyOwned = false;
			userLib.games.forEach(function(currentValue) { if (currentValue.steamId == req.query.steamId) { alreadyOwned = true; } });
			console.log('Game ' + req.query.steamId + ' already owned: ' + alreadyOwned);
			
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
			return;
		}
		
		// Get games on user's library and reverse order
		let userGames = userLib.games;
		userGames = userGames.reverse();
		
		// Get an array with only the steamIds of each game
		let gamesId = [];
		userGames.forEach(function(currentValue) { gamesId.push(currentValue.steamId); });
		//console.log(gamesId);
		
		// Fetch games info from store (by steamId)
		let gamesInfo = await Game.find({ 'steamId': { $in: gamesId } });
		
		// Get the positions of each Id on the 'gamesId' array
		// This accelerates the sort
		const itemPositions = {};
		for (const [index, steamId] of gamesId.entries()) {
			itemPositions[steamId] = index;
		}
		
		// Sort the info array to correspond to the gamesId array
		gamesInfo.sort((a, b) => itemPositions[a.steamId] - itemPositions[b.steamId]);
		//console.log(gamesInfo);
		
		// Get a logo for each game, searching by the game's steamId
		// Why not use a forEach? Because forEach doesn't allow 'await'
		let logos = [];
		for (let i = 0; i < userGames.length; i++) {
			logos.push(await fetchLogo(userGames[i].steamId))
		}
		
		// Render the user's library
		res.render('library', {
			user: req.user,
			gamesLibInfo: userGames,
			ownedGames: gamesInfo,
			gameLogos: logos
		});
		
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Library Error'
		});
	}
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
		
		// Reload the library page
		res.redirect(req.originalUrl);
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Could not remove game with id ' + req.body.removeId
		});
	}
});

router.get('/library/:id', (req, res) => {
	
	try {
		
	} catch (err) {
		
	}
	
	//const externalInfo = await getSteamInfo('1085660');
	//console.log(externalInfo.success);
});

router.get('/store/:id', (req, res) => {
	
	console.log(req.params.id);
	res.redirect('/games/store');
	
	// Display game info
	
	//const externalInfo = await getSteamInfo('1085660');
	//console.log(externalInfo.success);
});

router.post('/add', async (req, res) => {
	
	// Try saving the game to the DB
	try {
		// Get a game with the declared steamId
		let gameToAdd = await Game.findOne({ steamId: req.body.steamId });
		
		// Check if the game already exists
		if (gameToAdd) {
			// Render 'add' page and show message
		} else {
			// Create game and redirect to the store
		}
		
		// Create a new 'game' object
		const newGame = new Game({
			title: req.body.title,
			steamId: req.body.steamId,
			genres: req.body.genres,
			developer: req.body.developer,
			addedBy: getCurrentUser(req)[0],
			addedById: getCurrentUser(req)[1],
			addedAt: getDate().format(new Date())
		});
		
		// Attempt to save the game on the DB
		const thisGame = await newGame.save();
		console.log('Added game:', newGame);
		
		// Redirect to the 'store' page
		res.redirect('/games/store');
		
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
            message_tag: 'Failed creating a new Game'
        });
	}
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
	const logoUrl = 'https://cdn.akamai.steamstatic.com/steam/apps/' + appId + '/capsule_231x87.jpg';
	
	// Fetch logo URL
	const response = await fetch(logoUrl);
	
	// Check if URL returns empty (e.g.: 404)
	if (response.ok) {
		// If url is found, return an external logo
		return logoUrl;
	} else {
		// If url is not found, return a default logo in the server's files
		return '/images/applogo.svg';
	}
}

// Get the user's name and Id
// for game creation purposes
function getCurrentUser(req) {
	// Check if user is authenticated
	if (req.isAuthenticated()) {
		// If he is, return his name and googleId
		return [req.user.name, req.user.googleId];
	} else {
		// If not he isn't, return 'unknown' user
		return ['Unknown', 0];
	}
}

// Returns a date in a specific style
function getDate() {
	return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'long' });
}

module.exports = router;