import FlightSuretyApp from './contracts/FlightSuretyApp.json'
import Config from './contracts/config.json'
import Web3 from 'web3'
import express from 'express'

// Constrants
const ORACLE_COUNT = 1
const STATUS_CODE_UNKNOWN = 0
const STATUS_CODE_ON_TIME = 10
const STATUS_CODE_LATE_AIRLINE = 20
const STATUS_CODE_LATE_WEATHER = 30
const STATUS_CODE_LATE_TECHNICAL = 40
const STATUS_CODE_LATE_OTHER = 50

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

	// Register oracles
	await flightSuretyApp.methods.registerOracle().send({
		from: accounts[0],
		value: fee,
		gas: config.gas,
	})
	const result = await flightSuretyApp.methods.getMyIndexes().call({
		from: accounts[0],
	})
	console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`)
}

function setupWeb3Listeners() {
	flightSuretyApp.events.OracleRequest(
		{
			fromBlock: 0,
		},
		function (error, event) {
			if (error) console.log(error)
			console.log(event)
		}
	)
}

export default app
