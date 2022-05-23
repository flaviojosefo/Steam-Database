// Get the configuration values
require('dotenv').config();

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const User = require('../models/User');

/*
 * After a successful authentication, store the user's (object) id in the session
 * as req.session.passport.user.id so that it persists across accesses.
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/*
* On each new access, retrieve the user id from the current session;
* look it up on the database and return a result (user) 
*/
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
		done(err, user);
	});
});

/*  Google AUTH  */

passport.use(
    new GoogleStrategy(
        // Strategy Parameters
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: process.env.REDIRECT_URL
            // Tell passport to trust the HTTPS proxy
            // callbackURL: process.env.REDIRECT_URL,
            // proxy: true
        },
        // Verify callback
        async (accessToken, refreshToken, params, profile, done) => {
            // console.log('Access Token:', accessToken);
            // console.log('Refresh Token:', refreshToken);
            // console.log('User profile:', profile._json);
            // console.log('OAuth2 params:', params);
			
			try {
				let thisUser = await User.findOne({ googleId: profile.id });
				let logMessage = '';
				if (thisUser) {
					logMessage = 'Found existing user:';
					// update user info (access token, etc.) and save it to the DB
				} else {
					thisUser = await new User(
						{
							googleId: profile.id,
							name: profile.displayName,
							email: profile.emails[0].value,
							accessToken: accessToken,
							refreshToken: refreshToken
						}).save();
					logMessage = 'Registered new user:';
				}
				console.log(logMessage, thisUser);
				done(null, thisUser);
			} catch (err) {
				// Print error and exit app
				console.error(err);
				process.exit(1);
			}
        }
    ));