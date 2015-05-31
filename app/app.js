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

require('songbird')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = class App {
    constructor(config) {
        let app = this.app = express()
        this.port = process.env.PORT || 8000
        console.log('config: ' + JSON.stringify(config))
		app.config = {
			elasticsearch: config.elasticsearch[NODE_ENV],
			database: config.database[NODE_ENV]
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

		// configure routes
		routes(this.app)

    }

	async initialize(port) {
		await this.app.promise.listen(port)
		if(this.app.config.elasticsearch.enabled === 'true'){
			let esClient = new ESClient(this.app.config)
			this.app.esClient = await esClient.initialize(this.app.config)
		}
		// Return this to allow chaining
		return this
	}
}
