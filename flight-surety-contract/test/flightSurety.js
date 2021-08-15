const FlightSuretyApp = artifacts.require('./FlightSuretyApp.sol')

let flightSuretyAppInstance

contract('FlightSuretyApp', function (accounts) {
	// accounts[0] is the default account
	// Test case 1
	it('Contract deployment', function () {
		// Fetching the contract instance of our smart contract
		return FlightSuretyApp.deployed().then(function (instance) {
			// We save the instance in a gDlobal variable and all smart contract functions are called using this
			flightSuretyAppInstance = instance
			assert(
				flightSuretyAppInstance !== undefined,
				'FlightSuretyApp contract should be defined'
			)
		})
	})
})
