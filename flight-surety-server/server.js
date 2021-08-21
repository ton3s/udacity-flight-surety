import FlightSuretyApp from './contracts/FlightSuretyApp.json'
import Config from './contracts/config.json'
import Web3 from 'web3'
import express from 'express'

// Constrants
const ORACLE_COUNT = 20
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
	const accounts = web3.eth.personal.getAccounts()
	web3.eth.defaultAccount = accounts[0]
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
