const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const fs = require('fs')

const firstAirline = {
	name: 'Udacity Airlines',
	address: '0x85c2a38b0251fbe7e5bdbb43f34212c0e32e9d3b',
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
