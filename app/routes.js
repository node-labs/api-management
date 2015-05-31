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
const HTTP_OK = "200"

module.exports = (app) => {

    let esClient = app.esClient

    async function logMetrics(req, res){
        let timeTakenInMillis = new Date() - req.startTime
        let data = {}
        data.api = req.apiconfig.endpoint
        data.statusCode = res.statusCode
        data.responseCode = HTTP_OK
        data.responseTime = timeTakenInMillis
        console.log('Time taken in millis: ' + timeTakenInMillis)
        await esClient.postLogToES(data)
    }

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
        if(req.apiconfig.enabledebug) {
            console.log('Response:' + req.data)
        }
        let response
        if(req.cacheResponse) {
            let cache = new Cache()
            cache.key = req.cacheKey
            response = JSON.parse(req.data)
            cache.value = response
            cache.cachedTS = new Date()
            cache.save()
        }
        logMetrics(req, response)
        console.log('Response end..')
    })

    async function setConfig(req) {
        let urlarray = req.url.split('?')
        let url = urlarray[0]
        req.apiconfig = apis[url]
        let cacheparams = apis[url].cacheparams.split(',')
        let cacheKey = url
        for(let counter = 0; counter<cacheparams.length; counter++) {
            if(req.query[cacheparams[counter]]) {
                cacheKey = cacheKey + '|' + cacheparams[counter] + "=" + req.query[cacheparams[counter]]
            }
        }
        req.cacheKey = cacheKey
        if(req.apiconfig.enabledebug) {
            console.log('Request Url:' + req.url + '. Cache Key:' + cacheKey)
        }
    }

    app.get('/api/*', then(async(req, res) => {
        apis = app.config.apis
        req.startTime = new Date()
        await setConfig(req)
        let entry
        let entries = await Cache.getEntry(req.cacheKey, req.apiconfig.ttl)
        if(entries) entry = entries[0]
        if(entry) {
            console.log('Found the entry in the cache:' + req.cacheKey + ' with time:' + entry.cachedTS)
            req.cacheResponse = false
            if(req.apiconfig.enabledebug) {
                console.log('Response:' + JSON.stringify(entry.value))
            }
            res.json(entry.value)
        } else {
            req.cacheResponse = true
            proxy.web(req, res, { target: req.apiconfig.endpoint})
        }
    }))


    require('./adminroutes')(app)
}
