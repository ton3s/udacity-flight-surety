const FlightSuretyData = artifacts.require('./FlightSuretyData.sol')
const FlightSuretyApp = artifacts.require('./FlightSuretyApp.sol')
const truffleAssert = require('truffle-assertions')

let flightSuretyData
let flightSuretyApp

contract('FlightSuretyApp', function (accounts) {
	const airline1 = { name: 'Udacity Airlines', address: accounts[0] }
	const airline2 = { name: 'American Airlines', address: accounts[1] }
	const airline3 = { name: 'Qantas', address: accounts[2] }
	const airline4 = { name: 'US Airways', address: accounts[3] }
	const airline5 = { name: 'Philippine Airlines', address: accounts[4] }
	const passenger1 = { name: 'Wade', address: accounts[5] }
	const passenger2 = { name: 'Nash', address: accounts[6] }

	console.log(`Airline #1: ${airline1.name} ${airline1.address}`)
	console.log(`Airline #2: ${airline2.name} ${airline2.address}`)
	console.log(`Airline #3: ${airline3.name} ${airline3.address}`)
	console.log(`Airline #4: ${airline4.name} ${airline4.address}`)
	console.log(`Airline #5: ${airline5.name} ${airline5.address}`)
	console.log(`Passenger #1: ${passenger1.name} ${passenger1.address}`)
	console.log(`Passenger #2: ${passenger2.name} ${passenger2.address}`)

	it('Contract deployment', async () => {
		flightSuretyData = await FlightSuretyData.new(
			airline1.name,
			airline1.address
		)
		flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address)
		assert(
			flightSuretyApp !== undefined,
			'FlightSuretyApp contract should be defined'
		)
	})

	it('Successfully fund a registered airline', async () => {
		// Fund airline 1
		const txReceipt = await flightSuretyApp.fundAirline({
			from: airline1.address,
			to: flightSuretyApp.address,
			value: web3.utils.toWei('10', 'ether'),
		})
		truffleAssert.eventEmitted(txReceipt, 'AirlineFunded', {
			name: airline1.name,
		})
	})

	it('Only existing funded airline may register a new airline', async () => {
		// Register the airline 2 from funded airline 1
		const txReceipt = await flightSuretyApp.registerAirline(
			airline2.name,
			airline2.address,
			{
				from: airline1.address,
			}
		)
		// Check airline 2 was registered
		truffleAssert.eventEmitted(txReceipt, 'AirlineRegistered', {
			name: airline2.name,
		})
	})

	it('A registered airline cannot register a new airline', async () => {
		// Attempt to register airline 3 from registered airline 2
		try {
			await flightSuretyApp.registerAirline(airline3.name, airline3.address, {
				from: airline2.address,
			})
		} catch (err) {
			assert.equal(
				err.reason,
				'Airline is not funded',
				'Error: Airline can only be registered by a funded airline'
			)
		}
	})

	it('The fifth airline is queued', async () => {
		// Register the airline 3
		const txReceipt1 = await flightSuretyApp.registerAirline(
			airline3.name,
			airline3.address,
			{
				from: airline1.address,
			}
		)
		// Check that airline 3 was registered
		truffleAssert.eventEmitted(txReceipt1, 'AirlineRegistered', {
			name: airline3.name,
		})

		// Register the airline 4
		const txReceipt2 = await flightSuretyApp.registerAirline(
			airline4.name,
			airline4.address,
			{
				from: airline1.address,
			}
		)
		// Check that airline 4 was registered
		truffleAssert.eventEmitted(txReceipt2, 'AirlineRegistered', {
			name: airline4.name,
		})

		// Queue airline 5
		const txReceipt3 = await flightSuretyApp.registerAirline(
			airline5.name,
			airline5.address,
			{
				from: airline1.address,
			}
		)
		// Check that airline 5 was queued
		truffleAssert.eventEmitted(txReceipt3, 'AirlineQueued', {
			name: airline5.name,
		})
	})

	it('Attempting to fund an airline with less than 10 Ether should fail', async () => {
		// Attempt to fund airline 2 with less than 10 ether
		try {
			await flightSuretyApp.fundAirline({
				from: airline2.address,
				to: flightSuretyApp.address,
				value: web3.utils.toWei('9', 'ether'),
			})
		} catch (err) {
			assert.equal(
				err.reason,
				'Ether sent is less than the required amount',
				'Error: Airline is funded with less than 10 Ether'
			)
		}
	})

	it('Successfully fund airline 2 with 10 ether', async () => {
		// Fund airline 2 with 10 ether
		const txReceipt1 = await flightSuretyApp.fundAirline({
			from: airline2.address,
			to: flightSuretyApp.address,
			value: web3.utils.toWei('10', 'ether'),
		})
		truffleAssert.eventEmitted(txReceipt1, 'AirlineFunded', {
			name: airline2.name,
		})

		// Fund airline 3 with 10 ether
		const txReceipt2 = await flightSuretyApp.fundAirline({
			from: airline3.address,
			to: flightSuretyApp.address,
			value: web3.utils.toWei('10', 'ether'),
		})
		truffleAssert.eventEmitted(txReceipt2, 'AirlineFunded', {
			name: airline3.name,
		})
	})

	it('Queued airline needs at least 50 percent in order to be registered', async () => {
		// Vote for airline 5 with funded airline 1
		const txReceipt1 = await flightSuretyApp.voteAirline(airline5.address, {
			from: airline1.address,
		})
		// Check airline 5 received a vote
		truffleAssert.eventEmitted(txReceipt1, 'AirlineVoted', {
			name: airline5.name,
		})

		// Vote for airline 5 with funded airline 2
		const txReceipt2 = await flightSuretyApp.voteAirline(airline5.address, {
			from: airline2.address,
		})

		// Check airline 5 received a vote
		truffleAssert.eventEmitted(txReceipt2, 'AirlineVoted', {
			name: airline5.name,
		})

		// Vote for airline 5 with funded airline 3
		const txReceipt3 = await flightSuretyApp.voteAirline(airline5.address, {
			from: airline3.address,
		})

		// Check airline 5 received a vote
		truffleAssert.eventEmitted(txReceipt3, 'AirlineVoted', {
			name: airline5.name,
		})

		// Check airline 5 has changed from queued to registered
		truffleAssert.eventEmitted(txReceipt3, 'AirlineRegistered', {
			name: airline5.name,
		})
	})
})
