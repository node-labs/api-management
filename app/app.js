let path = require('path')
let express = require('express')
let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)
let mongoose = require('mongoose')
let routes = require('./routes')
let passportMiddleware = require('./middlewares/passport')
let flash = require('connect-flash')
let ESClient = require('./esclient')
let Api = require('../models/api')
let fs = require('fs')

require('songbird')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = class App {
    constructor(config) {
        let app = this.app = express()
        this.port = process.env.PORT || 8000
        console.log('config: ' + JSON.stringify(config))

		app.config = {
			elasticsearch: config.elasticsearch[NODE_ENV],
			database: config.database[NODE_ENV],
			apis: {}
		}

		passportMiddleware.configure()
		app.passport = passportMiddleware.passport
		// connect to the database
		mongoose.connect(config.database[NODE_ENV].url)

		// set up our express middleware
		app.use(morgan('dev')) // log every request to the console
		app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
		app.use(bodyParser.json()) // get information from html forms
		app.use(bodyParser.urlencoded({ extended: true }))

		app.set('views', path.join(__dirname, '../views'))
		app.set('view engine', 'ejs') // set up ejs for templating

		this.sessionMiddleware = session({
			secret: 'ilovethenodejs',
			store: new MongoStore({db: 'api-management'}),
			resave: true,
			saveUninitialized: true
		})

		// required for passport
		app.use(this.sessionMiddleware)
		// Setup passport authentication middleware
		app.use(app.passport.initialize())
		// persistent login sessions
		app.use(app.passport.session())
		// Flash messages stored in session
		app.use(flash())
    }

	async initialize(port) {
		await this.app.promise.listen(port)
		if(this.app.config.elasticsearch.enabled === 'true'){
			let esClient = new ESClient(this.app.config)
			this.app.esClient = await esClient.initialize(this.app.config)
		}
		let apis = await Api.promise.find()
		let apiConfig = {}
        for (let counter = 0; counter<apis.length; counter++) {
            apiConfig[apis[counter].url] = apis[counter]
        }
        this.app.config.apis = apiConfig
        await this.initializevalidators(apis)
		// configure routes
		routes(this.app)
		// Return this to allow chaining
		return this
	}

	/*This function gets the list of validators specified in all the APIs and load the respoective modules. 
	If an validator is not found, it skips with an error message in the log.
	It loads the RequiredParamsValidator by default.*/
	async initializevalidators(apis){
		let availablevalidators = []
		for (let counter = 0; counter<apis.length; counter++) {
            if(apis[counter].validators){
            	let validatorsarray = apis[counter].validators.split(',')
            	validatorsarray = validatorsarray.filter(Boolean)
            	for (let valcounter = 0; valcounter<validatorsarray.length; valcounter++)
            		availablevalidators.push(validatorsarray[valcounter])
        	}
        }
        // Validator start
        availablevalidators.push('reqparamsvalidator')
        let validatorholder = {}
        for (let counter = 0; counter<availablevalidators.length; counter++) {
        	await fs.promise.stat(__dirname+'/validators/'+availablevalidators[counter]+'.js').then(
        			() => {
        				let a = require(__dirname+'/validators/'+availablevalidators[counter])
						let b = new a(this.app.config)
						validatorholder[availablevalidators[counter]] = b
        			}, () => {
        				console.log('Validator ' +availablevalidators[counter]+ ' doesnt exists')
        			}
        		)	        	
			}
		this.app.validatorholder = validatorholder
		console.log(this.app.validatorholder)

		//Validator end
	}
}
