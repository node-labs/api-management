let isLoggedIn = require('./middlewares/isLoggedIn')
let Api = require('../models/api')
let then = require('express-then')

require('songbird')

module.exports = (app) => {

    let passport = app.passport

    app.get('/home', isLoggedIn, then(async(req, res) => {
        let apis = await Api.promise.find()
        console.log(apis)
        let apiConfig = {}
        for (let counter = 0; counter<apis.length; counter++) {
            apiConfig[apis[counter].url] = apis[counter]
        }
        app.config.apis = apiConfig
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
                let endpointurls = req.body.endpointurls
                let enablecaching = req.body.enablecaching
                let cacheparams = req.body.cacheparams
                let ttl = req.body.ttl
                let enabledebug = req.body.enabledebug
                let reqparams = req.body.reqparams
                let validators = req.body.validators

                if(!apiname.trim() || !url.trim() || !endpoint.trim()){
                    req.flash('error', 'Please fill all required fields marked by * !')
                    res.redirect('/addapi')
                }else if(enablecaching === true && (!cacheparams.trim() || !ttl.trim())){
                    req.flash('error', 'Please specify cache ttl and cache params!')
                    res.redirect('/addapi')
                }

                if(await Api.promise.findOne({apiname: apiname})){
                    console.log('API already registered')
                    req.flash('error', 'This API Name is already registered!')
                    res.redirect('/addapi')
                }

                if(await Api.promise.findOne({url: url})){
                    console.log('API already registered')
                    req.flash('error', 'This API URL is already registered!')
                    res.redirect('/addapi')
                }

                let newApi = new Api()
                newApi.apiname = apiname
                newApi.url = url
                newApi.endpoint = endpoint
                newApi.endpointurls = endpointurls
                newApi.enablecaching = enablecaching
                newApi.cacheparams = cacheparams
                newApi.ttl = ttl
                newApi.enabledebug = enabledebug
                newApi.reqparams = reqparams
                newApi.validators = validators
                await newApi.save()
                let apis = await Api.promise.find()
                app.validatorholder = await app.validatorinit.initializevalidators(apis)
                res.redirect('/home')
            } catch (e){
                console.log(e)
            }
    }))

 // Update API
    app.post('/updateapi/:apiname', isLoggedIn, then(async (req, res) => {
        try{
                let apiname = req.params.apiname
                let url = req.body.url
                let endpoint = req.body.endpoint
                let endpointurls = req.body.endpointurls
                let enablecaching = req.body.enablecaching
                let cacheparams = req.body.cacheparams
                let ttl = req.body.ttl
                let enabledebug = req.body.enabledebug
                let reqparams = req.body.reqparams
                let validators = req.body.validators

                if(enablecaching === true && (!cacheparams.trim() || !ttl.trim())){
                    req.flash('error', 'Please specify cache ttl and cache params!')
                    res.redirect('/updateapi/'+apiname)
                }

                let apifromDB = await Api.promise.findOne({apiname: req.params.apiname})
                if(!apifromDB){
                    console.log('Couldnt find API to update!')
                    req.flash('error', 'Couldnt find API to update!')
                    res.redirect('/updateapi')
                }
                apifromDB.endpoint = endpoint
                apifromDB.endpointurls = endpointurls
                apifromDB.enablecaching = enablecaching
                apifromDB.cacheparams = cacheparams
                apifromDB.ttl = ttl
                apifromDB.enabledebug = enabledebug
                apifromDB.reqparams = reqparams
                apifromDB.validators = validators
                await apifromDB.save()
                let apis = await Api.promise.find()
                app.validatorholder = await app.validatorinit.initializevalidators(apis)
                console.log(app.validatorholder)
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

