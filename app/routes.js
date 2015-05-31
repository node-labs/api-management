let isLoggedIn = require('./middlewares/isLoggedIn')
let Api = require('../models/api')
let multiparty = require('multiparty')
let then = require('express-then')
let nodeify = require('bluebird-nodeify')
let request = require('request')
let nodeifyit = require('nodeifyit')
let Promise = require("bluebird")
let DataUri = require('datauri')
let httpProxy = require('http-proxy')
let proxy = httpProxy.createProxyServer({})
let Cache = require("../models/cache")

require('songbird')
let apis = {
    "/api/categories/viewmenu": {
        apiname: "viewmenu",
        url: "api/categories/viewmenu",
        endpoint: "http://oses4004.wal-mart.com:40181",
        enablecaching: true,
        cacheparams: "categorylevel,requestorigin",
        ttl: 60,
        enabledebug: true,
        reqparams: null,
        validators: null
    }
}

proxy.on('proxyRes', function (proxyRes, req, res) {
    req.data = ""
    proxyRes.on('data', function (dataBuffer) {
        console.log('---------------------------------------------------------------------------------------------------')
        let data = dataBuffer.toString('utf8')
        req.data = req.data + data
        console.log("Response chunk from target server : "+ data)
        console.log('---------------------------------------------------------------------------------------------------')
    })
})

proxy.on('end', function(req) {
    console.log('proxied')
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log("Complete Response from target server : "+ req.data)
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    if(req.cacheResponse) {
        let cache = new Cache()
        cache.key = req.cacheKey
        cache.value = JSON.parse(req.data)
        cache.cachedTS = new Date()
        cache.save()
    }
})

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

    app.get('/api/*', then(async(req, res) => {
        await setConfig(req)
        console.log(req.cacheKey)
        let cache = await Cache.promise.findOne({key: req.cacheKey})
        if(cache) {
            console.log('found in the cache:' + JSON.stringify(cache.value))
            req.cacheResponse = false
            res.json(cache.value)
        } else {
            req.cacheResponse = true
            let endPointUrl = req.apiconfig.endpoint + req.query
            console.log(endPointUrl)
            proxy.web(req, res, { target: req.apiconfig.endpoint})
        }
    }))

    async function setConfig(req) {
        let urlarray = req.url.split('?')
        let url = urlarray[0]
        let query = urlarray[1]
        req.apiconfig = apis[url]
        console.log(query)
        req.query = query
        let cacheparams = apis[url].cacheparams.split(',')
        let cacheKey = url
        for(let counter=0; counter<cacheparams.length; counter++) {
            if(req.query[cacheparams[counter]]) {
                cacheKey = cacheKey + '|' + cacheparams[counter] + "=" + req.query[cacheparams[counter]]     
            }
        }
        req.cacheKey = cacheKey
    }

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
                    req.flash('error', 'Couldnt find API to update!')
                    res.redirect('/updateapi') 
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
