require('songbird')
let fs = require('fs')

module.exports = class ValidatorInit {
	constructor(config) {
		this.config = config
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
						let b = new a()
						validatorholder[availablevalidators[counter]] = b
        			}, () => {
        				console.log('Validator ' +availablevalidators[counter]+ ' doesnt exists')
        			}
        		)	        	
			}
		 return validatorholder

		//Validator end
	}
}
