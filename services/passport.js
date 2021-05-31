const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Get the configuration values
dotenv = require('dotenv');
dotenv.config();

/*
 * After a successful authentication, store the user in the session
 * as req.session.passport.user so that it persists across accesses.
 * See: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 * Here, since no database is used, the full user profile has to be stored in the session.
 */ 

/*
* On each new access, retrieve the user profile from the session and provide it as req.user
* so that routes detect if there is a valid user context. 
*/


/*  Google AUTH  */

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

