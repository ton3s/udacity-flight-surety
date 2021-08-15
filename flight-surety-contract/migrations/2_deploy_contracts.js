const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const fs = require('fs')

const firstAirline = {
	name: 'Udacity Airlines',
	address: '0x85C2A38b0251fbe7E5bDBb43f34212c0E32e9D3B',
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
