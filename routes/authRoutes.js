const passport = require('passport');
const { isAuth } = require('../services/middleware');

module.exports = app => {
    
    app.get('/', (req, res) => {
		if (req.isAuthenticated()) {
			res.redirect('/success');
		} else {
			let date = new Intl.DateTimeFormat('en-GB', {
				dateStyle: 'full',
				timeStyle: 'long'
			}).format(new Date());
			res.render('index', {
				date_tag: date,
				message_tag: 'Access your Google Account',
			});
		}
    });

    app.get('/home'),  (req, res) => {
        res.redirect('/');
    }

    app.get('/success', (req, res) => {
        console.log("User Authenticated:", req.isAuthenticated());
        console.log('Session expires in:', req.session.cookie.maxAge / 1000);
        res.render('success', {
            message: 'Authorization Successful!',
            user: req.user
        });
    });

    app.get('/resource', isAuth, (req, res, next) => {
        res.render('resource', {
            authenticated: req.isAuthenticated()
        });
    });

    app.get('/status', (req, res, next) => {
        res.render('status', {
            status: req
        });
    });

    app.get('/error', (req, res) => {
        res.render('error', {
            message_tag: 'Authentication Error'
        });
    });

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/status');
        console.log("User Authenticated:", req.isAuthenticated());
    });

    app.get('/login',
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            accessType: 'offline', // Requests a refresh token
            prompt: 'consent'
        })
    );

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/error'
        }),
        (req, res) => {
            // Successful authentication, redirect to saved route or success.
            const returnTo = req.session.returnTo;
            delete req.session.returnTo;
            res.redirect(returnTo || '/success');
        }
	);
};