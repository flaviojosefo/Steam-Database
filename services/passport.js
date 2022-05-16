// Get the configuration values
require('dotenv').config();

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

/*
 * After a successful authentication, store the user in the session
 * as req.session.passport.user so that it persists across accesses.
 * See: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 * Here, since no database is used, the full user profile has to be stored in the session.
 */
passport.serializeUser((user, done) => {
	// Serialize a shorter version of the user profile
	const User = {
		id: user.id,
		displayName: user.displayName,
		emails: user.emails,
	};
    console.log('Serialiazing user:', User);
    done(null, User);
});

/*
* On each new access, retrieve the user profile from the session and provide it as req.user
* so that routes detect if there is a valid user context. 
*/
passport.deserializeUser((user, done) => {
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
        (accessToken, refreshToken, params, profile, done) => {
            // console.log('Access Token:', accessToken);
            // console.log('Refresh Token:', refreshToken);
            // console.log('User profile:', profile._json);
            console.log('OAuth2 params:', params);
            return done(null, profile);
        }
    ));