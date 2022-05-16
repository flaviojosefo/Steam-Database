// Get the configuration values
require('dotenv').config();

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const userTable = require('../models/User');
const User = userTable.models.User;

/*
 * After a successful authentication, store the user in the session
 * as req.session.passport.user so that it persists across accesses.
 * See: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 */
passport.serializeUser((user, done) => {
    done(null, user._id);
});

/*
* On each new access, retrieve the user profile from the session and provide it as req.user
* so that routes detect if there is a valid user context. 
*/
passport.deserializeUser( async (id, done) => {
    user = await User.findOne({ _id: id });
	done(null, user);
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