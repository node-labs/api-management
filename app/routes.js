let isLoggedIn = require('./middlewares/isLoggedIn')

require('songbird')

module.exports = (app) => {
    let passport = app.passport

    app.get('/home', isLoggedIn, (req, res) => {
        res.render('home.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.get('/adduser', (req, res) => {
        res.render('adduser.ejs', {message: req.flash('error') })
    })

    app.post('/login', passport.authenticate('local', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash: true
	}))

	app.post('/adduser', passport.authenticate('local-signup', {
		successRedirect: '/home',
		failureRedirect: '/adduser',
		failureFlash: true
	}))
}
