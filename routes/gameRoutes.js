const router = require('express').Router();
const fetch = require('node-fetch');
const { isAuth } = require('../services/middleware');
const Game = require('../models/Game');
const Library = require('../models/Library');

// Redirect user from main 'games' page to the store
router.get('/', (req, res) => {
	// Redirect to the Store
	res.redirect('/games/store');
});

// Render the page where games are added to the DB
router.get('/add', (req, res) => {
	// Display the 'Add Game' page
	res.render('add_game', {
		gameFoundMessage: '',
		status: req
	});
});

// Render the store page
router.get('/store', async (req, res) => {
	// Encapsulate code in try/catch to prevent await related errors
	try {
		// Get games on games collection and reverse order
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
			gamesList: storeGames,
			gameLogos: logos,
			ownedIds: ownedGames,
			status: req
		});
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Store Error',
			status: req
		});
	}
});

// Render the library page
router.get('/library', isAuth, async (req, res) => {
	// Encapsulate code in try/catch to prevent await related errors
	try {
		// Fetch a library based on user's googleId
		const userLib = await fetchUserLibrary(req.user.googleId);
	
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
				// Update the user's library
				await userLib.save();
				console.log('Added game ' + req.query.steamId + ' to ' + req.user.name + '\'s Library');
			}
			
			// Redirect the user to the normal library URL
			res.redirect('/games/library');
			
			// Stop route execution
			return;
		}
		
		// Get games on user's library and reverse order
		let userGames = userLib.games;
		userGames = userGames.reverse();
		
		// Get an array with only the steamIds of each game
		let gamesId = [];
		userGames.forEach(function(currentValue) { gamesId.push(currentValue.steamId); });
		//console.log(gamesId);
		
		// Fetch games info from games collection (by steamId)
		let gamesInfo = await Game.find({ 'steamId': { $in: gamesId } });
		
		// Get the positions of each Id on the 'gamesId' array
		// This accelerates the sort
		const itemPositions = {};
		for (const [index, steamId] of gamesId.entries()) {
			itemPositions[steamId] = index;
		}
		
		// Sort the info array to correspond to the gamesId array
		gamesInfo.sort((a, b) => itemPositions[a.steamId] - itemPositions[b.steamId]);
		
		// Get a logo for each game, searching by the game's steamId
		// Why not use a forEach? Because forEach doesn't allow 'await'
		let logos = [];
		for (let i = 0; i < gamesInfo.length; i++) {
			logos.push(await fetchLogo(gamesInfo[i].steamId))
		}
		
		// Render the user's library
		res.render('library', {
			gamesLibInfo: userGames,
			ownedGames: gamesInfo,
			gameLogos: logos,
			status: req
		});
		
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Library Error',
			status: req
		});
	}
});

// Post (remove) a game from the user's library
router.post('/library', async (req, res) => {
	// Print which game was removed (by steamId) from the current user's library
	console.log('Removed game ' + req.body.removeId + ' from ' + req.user.name + '\'s Library');
	
	// Encapsulate code in try/catch to prevent await related errors
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
			message_tag: 'Could not remove game with id ' + req.body.removeId,
			status: req
		});
	}
});

// Display a specific game's page
router.get('/store/:id', async (req, res) => {
	// Encapsulate code in try/catch to prevent await related errors
	try {
		// Get game info from MongoDB
		const gameToDisplay = await Game.findOne({ steamId: req.params.id });
		
		// Check if steamId on the URL exists
		if (!gameToDisplay) {
			// If not, render an 'error'
			res.render('error', {
				message_tag: 'Game not found!',
				status: req
			});
			// And stop the route
			return;
		}
		
		// Variable to check if user owns the game
		let owned = false;
		
		// Check if user is logged in
		if (req.isAuthenticated()) {
			// Retrieve the user's library
			const userLib = await Library.findOne({ ownderId: req.user.googleId });
			
			// Get games on user's library
			const userGames = userLib.games;
			
			// Loop through all owned games
			for (let i = 0; i < userGames.length; i++) {
				// Check if user already owns a specific game
				if (userGames[i].steamId == req.params.id) {
					// If it does, 'owned' is true 
					// and break out of for loop
					owned = true;
					break;
				}
			}
		}
		
		// Get extra info about a game from the Steam API
		let steamInfo = await getSteamInfo(req.params.id);
		steamInfo = steamInfo[req.params.id];
		
		// Check if game exists on the API
		if (steamInfo.success) {
			// Reduce the info on the JSON to only the values we want
			const interestKeys = ['short_description', 'header_image', 'platforms', 'release_date' ];
			Object.keys(steamInfo.data).forEach((key) => interestKeys.includes(key) || delete steamInfo.data[key]);
			
			// Display the game's page with all the available info
			res.render('display_game', {
				game: gameToDisplay,
				gameOwned: owned,
				steamInfo: steamInfo.data,
				status: req
			});
		} else {
			// Display the game's page with just the DB's info
			res.render('display_game', {
				game: gameToDisplay,
				gameOwned: owned,
				steamInfo: undefined,
				status: req
			});
		}
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
			message_tag: 'Could not load page for game with id ' + req.params.id,
			status: req
		});
	}
});

// Try to add a game to the database
router.post('/add', async (req, res) => {
	// Encapsulate code in try/catch to prevent await related errors
	try {
		// Get a game with the declared steamId
		let gameToAdd = await Game.findOne({ steamId: req.body.steamId });
		
		// Check if the game already exists
		if (gameToAdd) {
			// If it does, display the 'Add Game' page and show a message
			res.render('add_game', {
				gameFoundMessage: gameToAdd.title + ' already has id ' + gameToAdd.steamId + '!',
				status: req
			});
			
			// Stop route execution
			return;
		}
		
		// Create a new 'game' object
		// and attempt to save the game on the DB
		const newGame = await new Game({
			title: req.body.title,
			steamId: req.body.steamId,
			genres: req.body.genres,
			developer: req.body.developer,
			addedBy: getCurrentUser(req)[0],
			addedById: getCurrentUser(req)[1],
			addedAt: getDate().format(new Date())
		}).save();
		
		console.log('Added game:', newGame);
		
		// Redirect to the 'store' page
		res.redirect('/games/store');
		
	} catch (err) {
		// Show the error on the (server's) console
		console.error(err);
		// Render an error (client-side)
		res.render('error', {
            message_tag: 'Failed creating a new Game',
			status: req
        });
	}
});

// Fetch information about a game from the Steam API
async function getSteamInfo(appId) {
	// Get the game's url on the API by steamId (appId)
	const steamAppUrl = 'https://store.steampowered.com/api/appdetails?appids=' + appId + '&language=en';
	
	// Fetch a url's response
	const response = await fetch(steamAppUrl);
	
	// If response is not good, throw an error
	// This should only happen if the API is Down
	if(!response.ok) {
		throw new Error(response.statusText);
	}
	
	// If response is good, return the page's JSON file
	return response.json();
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

// Fetch or create a user's library
async function fetchUserLibrary(googleId) {
	// Fetch a library based on user's googleId
	let userLib = await Library.findOne({ ownderId: googleId });
	
	// Check if user does NOT have a library
	if (!userLib) {
		// If not, create a new (empty) one
		userLib = await new Library({
			ownderId: googleId,
			games: undefined
		}).save();
		console.log('Created library for user ' + req.user.name, userLib);	
	}
	
	// Return the user's library
	return userLib;
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