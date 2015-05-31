let then = require('express-then')
let httpProxy = require('http-proxy')
let proxy = httpProxy.createProxyServer({})
let Cache = require("../models/cache")

require('songbird')
// let apis = {
//     "/api/categories/viewmenu": {
//         apiname: "viewmenu",
//         url: "api/categories/viewmenu",
//         endpoint: "http://oses4004.wal-mart.com:40181",
//         enablecaching: true,
//         cacheparams: "categorylevel,requestorigin",
//         ttl: 60,
//         enabledebug: true,
//         reqparams: null,
//         validators: null
//     }
// }

let apis

proxy.on('proxyRes', function (proxyRes, req) {
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

    async function setConfig(req) {
        let urlarray = req.url.split('?')
        let url = urlarray[0]
        req.apiconfig = apis[url]
        let cacheparams = apis[url].cacheparams.split(',')
        let cacheKey = url
        for(let counter = 0; counter<cacheparams.length; counter++) {
            console.log(req.query[cacheparams[counter]])
            if(req.query[cacheparams[counter]]) {
                cacheKey = cacheKey + '|' + cacheparams[counter] + "=" + req.query[cacheparams[counter]]
            }
        }
        req.cacheKey = cacheKey
    }

    app.get('/api/*', then(async(req, res) => {
        apis = app.config.apis
        await setConfig(req)
        let entry
        let entries = await Cache.getEntry(req.cacheKey, req.apiconfig.ttl)
        if(entries) entry = entries[0]
        if(entry) {
            console.log('found the entry in the cache:' + req.cacheKey + ' with time:' + entry.cachedTS)
            req.cacheResponse = false
            res.json(entry.value)
        } else {
            req.cacheResponse = true
            proxy.web(req, res, { target: req.apiconfig.endpoint})
        }
    }))


    require('./adminroutes')(app)
}
