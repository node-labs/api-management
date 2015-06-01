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
				log: this.config.elasticsearch.loglevel
			})
			await esClientStub.promise.ping({
				requestTimeout: Infinity,
				hello: "elasticsearch!"
			}).then((body) => {if(body) console.log('Connection to ES Successful')})
			.catch(e => console.log(e.stack ? e.stack : e))
			this.esClientStub = esClientStub
		}
		// let data = {
		// 	'api': '/api/merchandisedcontent/view',
		// 	'responsecode': '500',
		// 	'responsetime': '1200'
		// }
		// this.postLogToES(data)
		// Return this to allow chaining
		return this
	}

	async postLogToES(data){
		console.log('inside postLogToES: ' + data)
		data.timestamp = await this.getTimeStamp()
		let index = this.config.elasticsearch.index
		await this.esClientStub.promise.create({
			index: index,
			type: this.config.elasticsearch.type,
			body: data
		}).then(result => console.log(result))
		.catch(e => console.log(e.stack ? e.stack : e))
	}

	async getTimeStamp(){
		let date = new Date()
		return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate() + 'T' +
			date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds() + date.getTimezoneOffset()
	}

	async getDayofTheMonth(){
		let date = new Date()
		return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate()
	}
}
