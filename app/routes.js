let isLoggedIn = require('./middlewares/isLoggedIn')
let Api = require('../models/api')
let multiparty = require('multiparty')
let then = require('express-then')
let nodeify = require('bluebird-nodeify')
let request = require('request')
let nodeifyit = require('nodeifyit')
let Promise = require("bluebird")
let DataUri = require('datauri')

require('songbird')

module.exports = (app) => {
    let passport = app.passport

    app.get('/home', isLoggedIn, then(async(req, res) => {
        let apis = await Api.promise.find()
        console.log(apis)
        res.render('home.ejs', {
            user: req.user,
            apis: apis,
            message: req.flash('error')
        })
    }))

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

    app.get('/addapi', isLoggedIn, (req, res) => {
        res.render('addapi.ejs', {message: req.flash('error') })
    })

    app.get('/updateapi/:apiname', isLoggedIn, then(async(req, res) => {
        let apifromDB = await Api.promise.findOne({apiname: req.params.apiname})
        if(!apifromDB){
           return req.flash('error', 'Couldnt find API to update!') 
        }
        res.render('updateapi.ejs', {apiInfo: apifromDB, message: req.flash('error') })
    }))

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

     // Add new API
    app.post('/addapi/', isLoggedIn, then(async (req, res) => {
        try{
                let apiname = req.body.apiname
                let url = req.body.url
                let endpoint = req.body.endpoint
                let enablecaching = req.body.enablecaching
                let cacheparams = req.body.cacheparams
                let ttl = req.body.ttl
                let enabledebug = req.body.enabledebug
                let reqparams = req.body.reqparams
                let validators = req.body.validators

                if(await Api.promise.findOne({apiname: apiname})){
                    console.log('API already registered')
                    return req.flash('error', 'This API Name is already registered!')
                }

                if(await Api.promise.findOne({url: url})){
                    console.log('API already registered')
                    return req.flash('error', 'This API URL is already registered!')
                }

                let newApi = new Api()
                newApi.apiname = apiname
                newApi.url = url
                newApi.endpoint = endpoint
                newApi.enablecaching = enablecaching
                newApi.cacheparams = cacheparams
                newApi.ttl = ttl
                newApi.enabledebug = enabledebug
                newApi.reqparams = reqparams
                newApi.validators = validators
                await newApi.save()
                res.redirect('/home')
            } catch (e){
                console.log(e)
            }
    }))

 // Update API
    app.post('/updateapi/:apiname', isLoggedIn, then(async (req, res) => {
        try{
                let apiname = req.body.apiname
                let url = req.body.url
                let endpoint = req.body.endpoint
                let enablecaching = req.body.enablecaching
                let cacheparams = req.body.cacheparams
                let ttl = req.body.ttl
                let enabledebug = req.body.enabledebug
                let reqparams = req.body.reqparams
                let validators = req.body.validators

                let apifromDB = await Api.promise.findOne({apiname: req.params.apiname})
                if(!apifromDB){
                    console.log('Couldnt find API to update!')
                   return req.flash('error', 'Couldnt find API to update!') 
                }
                apifromDB.endpoint = endpoint
                apifromDB.enablecaching = enablecaching
                apifromDB.cacheparams = cacheparams
                apifromDB.ttl = ttl
                apifromDB.enabledebug = enabledebug
                apifromDB.reqparams = reqparams
                apifromDB.validators = validators
                await apifromDB.save()
                res.redirect('/home')
            } catch (e){
                console.log(e)
            }
    }))

    // Delete API
    app.post('/deleteapi/:apiname', isLoggedIn, then(async (req, res) => {
        try{
                let apifromDB = await Api.promise.findOne({apiname: req.params.apiname})
                if(!apifromDB){
                    console.log('Couldnt find API to Delete!')
                   return req.flash('error', 'Couldnt find API to delete!') 
                }
                await apifromDB.remove()
                res.redirect('/home')
            } catch (e){
                console.log(e)
            }
    }))
}
