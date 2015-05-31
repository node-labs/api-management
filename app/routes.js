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

    require('./adminroutes')(app)
}
