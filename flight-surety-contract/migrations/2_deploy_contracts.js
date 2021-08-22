const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const FlightSuretyData = artifacts.require('FlightSuretyData')
const fs = require('fs')
require('dotenv').config()

const firstAirline = {
	name: process.env.FIRST_AIRLINE_NAME,
	address: process.env.FIRST_AIRLINE_PUBLIC_KEY,
	status: 'Registered',
}

module.exports = function (deployer) {
	deployer
		.deploy(FlightSuretyData, firstAirline.name, firstAirline.address)
		.then(() => {
			return deployer
				.deploy(FlightSuretyApp, FlightSuretyData.address)
				.then(() => {
					let config = {
						localhost: {
							url: 'http://localhost:7545',
							appAddress: FlightSuretyApp.address,
						},
						firstAirline,
					}

					// Helper function to setup config file and ABI to be available

					// Dapp
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

					// Server / Oracle
					fs.writeFileSync(
						__dirname + '/../../flight-surety-server/contracts/config.json',
						JSON.stringify(config, null, '\t'),
						'utf-8'
					)
					fs.copyFileSync(
						__dirname + '/../build/contracts/FlightSuretyApp.json',
						__dirname +
							'/../../flight-surety-server/contracts/FlightSuretyApp.json'
					)
				})
		})
}
