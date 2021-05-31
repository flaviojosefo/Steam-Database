const passport = require('passport');

module.exports = app => {
    
    app.get('/', function (req, res) {
        let date = new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'full',
            timeStyle: 'long'
        }).format(new Date());
        res.render('index', {
            date_tag: date,
            message_tag: 'Access your Google Account',
        });
    });

    app.get('/success', (req, res) => {
        res.render('error', {
            message_tag: 'Not implemented yet'
        });
    });

    app.get('/protected', (req, res, next) => {
        res.render('error', {
            message_tag: 'Not implemented yet'
        });
    });

    app.get('/error', (req, res) => {
        res.render('error', {
            message_tag: 'Authentication error'
        });
    });

    app.get('/logout', (req, res) => {
        res.render('error', {
            message_tag: 'Not implemented yet'
        });
    });

    // app.get('/login',
    //     passport.authenticate('google', {
    //         scope: ['profile', 'email'],
    //         accessType: 'offline' // Requests a refresh token
    //     })
    // );

    app.get('/login', (req, res) => {
        res.render('error', {
            message_tag: 'Not implemented yet'
        });
    });

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/error'
        }),
        function (req, res) {
            // Successful authentication, redirect to success.
            res.redirect('/success');
        });
};