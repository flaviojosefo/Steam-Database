/**
 * This middleware checks if the logged user has a library.
 *
 * If the user does not, it creates one on the database
 *
 */
const Library = require('../models/Library');

module.exports = {
    hasLib: async (req, res, next) => {
		// Try to find a library from the logged user
		let userLib = await Library.findOne({ ownderId: req.user.googleId });
		
		// Check if user does NOT have a library
		if (!userLib) {
			try {
				// If not, create a new (empty) one
				userLib = await new Library({
					ownderId: req.user.googleId,
					games: undefined
				}).save();
				console.log('Created library for user ' + req.user.name, userLib);
			} catch (err) {
				console.error(err);
				res.render('error', {
					message_tag: 'Failed creating a Library'
				});
			}
		}
		
		// Move to the next middleware
		return next();
    }
};