const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const fs = require('fs')

const firstAirline = {
	name: 'Udacity Airlines',
	address: '0xD9F476a47ABf1bE4Db978C79586169F3263Df636',
	status: 'Registered',
}

module.exports = function (deployer) {
	deployer
		.deploy(FlightSuretyApp, firstAirline.name, firstAirline.address)
		.then(() => {
			let config = {
				localhost: {
					url: 'http://localhost:7545',
					appAddress: FlightSuretyApp.address,
				},
				firstAirline,
			}

			// Helper function to setup config file and ABI to be available for Dapp to consume
			fs.writeFileSync(
				__dirname + '/../../flight-surety-dapp/src/contracts/config.json',
				JSON.stringify(config, null, '\t'),
				'utf-8'
			)
			fs.copyFileSync(
				__dirname + '/../build/contracts/FlightSuretyApp.json',
				__dirname +
					'/../../flight-surety-dapp/src/contracts/FlightSuretyApp.json'
			)
		})
}
