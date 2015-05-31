let elasticsearch = require('elasticsearch')
require('songbird')

module.exports = class ESClient {
	constructor(config) {
		this.config = config
		console.log('config: ' + JSON.stringify(config))
	}


	async initialize() {
		console.log('ES Enabled Flag: ' + this.config.elasticsearch.enabled)
		if(this.config.elasticsearch.enabled === 'true'){
			let esClientStub = new elasticsearch.Client({
				host: 'localhost:9200',
				log: 'info'
			})
			await esClientStub.promise.ping({
				requestTimeout: Infinity,
				hello: "elasticsearch!"
			}).then((body) => {if(body) console.log('Connection to ES Successful')})
			.catch(e => console.log(e.stack ? e.stack : e))
			this.esClientStub = esClientStub
		}
		// Return this to allow chaining
		return this
	}

	async postLogToES(data){
		data.timestamp = null
		await this.esClientStub.promise.create({
			index: this.config.elasticsearch.index,
			type: this.config.elasticsearch.type,
			body: data
		}).then(result => console.log(result))
		.catch(e => console.log(e.stack ? e.stack : e))
	}
}
