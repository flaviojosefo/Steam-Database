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
			
			var thisUser;
			const existingUser = await User.findOne({ googleId: profile.id });
			
			if (existingUser) {
				console.log('User already exists!');
				thisUser = existingUser;
			} else {
				thisUser = new User({
					googleId: profile.id,
					name: profile.displayName,
					email: profile.emails[0].value,
					accessToken: accessToken,
					refreshToken: refreshToken
				});
				
				thisUser.save()
					.then((user) => {
						console.log('Registered user:', user);
					}
				);
			}
			
            return done(null, thisUser);
        }
    ));