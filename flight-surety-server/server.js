import FlightSuretyApp from './contracts/FlightSuretyApp.json'
import Config from './contracts/config.json'
import Web3 from 'web3'
import express from 'express'

// Constants
const NUM_ORACLES = 20
const STATUS_CODE_UNKNOWN = 0
const STATUS_CODE_ON_TIME = 10
const STATUS_CODE_LATE_AIRLINE = 20
const STATUS_CODE_LATE_WEATHER = 30
const STATUS_CODE_LATE_TECHNICAL = 40
const STATUS_CODE_LATE_OTHER = 50

const statusCodes = [STATUS_CODE_ON_TIME, STATUS_CODE_LATE_AIRLINE]

let oracles = {}

// Setup Web3
let config = Config['localhost']
let web3 = new Web3(
	new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'))
)

// Smart contract
let flightSuretyApp = new web3.eth.Contract(
	FlightSuretyApp.abi,
	config.appAddress
)

// Register Oracles
registerOracles()

// Web3 Event Listeners
setupWeb3Listeners()

const app = express()
app.get('/api', (req, res) => {
	res.send({
		message: 'An API for use with your Dapp!',
	})
})

async function registerOracles() {
	// Get accounts
	const accounts = await web3.eth.personal.getAccounts()
	web3.eth.defaultAccount = accounts[0]

	// Retrieve registration fee
	const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call()

	// Check if there are enough accounts to generate the required number of oracles
	let numOracles = NUM_ORACLES
	if (accounts.length < NUM_ORACLES) {
		console.log(
			`Number of accounts (${accounts.length}) is less than the requested oracle count of ${NUM_ORACLES}.  Registering ${accounts.length} oracles`
		)
		numOracles = accounts.length
	}

	// Register oracles
	for (let i = 0; i < numOracles; i++) {
		await flightSuretyApp.methods.registerOracle().send({
			from: accounts[i],
			value: fee,
			gas: config.gas,
		})

		// Get the indexes assigned to the oracle
		const result = await flightSuretyApp.methods.getMyIndexes().call({
			from: accounts[i],
		})

		// Store the registered oracle details
		oracles[accounts[i]] = result
		console.log(
			`Oracle Registered (${accounts[i]}): ${result[0]}, ${result[1]}, ${result[2]}`
		)
	}
}

function setupWeb3Listeners() {
	// AirlineRegistered
	flightSuretyApp.events.AirlineRegistered({}, (error, event) =>
		logEvent(error, event)
	)

	// AirlineQueued
	flightSuretyApp.events.AirlineQueued({}, (error, event) =>
		logEvent(error, event)
	)

	// AirlineFunded
	flightSuretyApp.events.AirlineFunded({}, (error, event) =>
		logEvent(error, event)
	)

	// AirlineVoted
	flightSuretyApp.events.AirlineVoted({}, (error, event) =>
		logEvent(error, event)
	)

	// FlightRegistered
	flightSuretyApp.events.FlightRegistered({}, (error, event) =>
		logEvent(error, event)
	)

	// FlightStatus
	flightSuretyApp.events.FlightStatus({}, (error, event) =>
		logEvent(error, event)
	)

	// FlightCreditInsurees
	flightSuretyApp.events.FlightCreditInsurees({}, (error, event) =>
		logEvent(error, event)
	)

	// PassengerPurchasedInsurance
	flightSuretyApp.events.PassengerPurchasedInsurance({}, (error, event) =>
		logEvent(error, event)
	)

	// PassengerWithdrawBalance
	flightSuretyApp.events.PassengerWithdrawBalance({}, (error, event) =>
		logEvent(error, event)
	)

	// OracleRequest
	flightSuretyApp.events.OracleRequest({}, (error, event) => {
		logEvent(error, event)
		sendOracleResponse(event.returnValues)
	})

	// OracleReport
	flightSuretyApp.events.OracleReport({}, (error, event) =>
		logEvent(error, event)
	)
}

function sendOracleResponse(request) {
	const { index, airline, flight, timestamp } = request

	// Get a random status code
	let randomStatusCode =
		statusCodes[Math.floor(Math.random() * statusCodes.length)]

	// Loop through oracles for matching index
	Object.keys(oracles).forEach((oracle) => {
		let found = oracles[oracle].find((i) => i === index)
		if (found) {
			flightSuretyApp.methods
				.processFlightStatus(airline, flight, timestamp, randomStatusCode)
				.send({ from: oracle, gas: config.gas })
				.catch((err) => {
					console.log(err.message)
				})
		}
	})
}

function logEvent(error, event) {
	if (error) console.log(error)
	console.log(event)
}

export default app
