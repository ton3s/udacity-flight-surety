import React, { useEffect, useState } from 'react'
import { Container, Alert, Button } from 'reactstrap'
import Web3 from 'web3'

// Contracts
import FlightSuretyApp from '../contracts/FlightSuretyApp.json'
import Config from '../contracts/config.json'

// Components
import User from './User'
import Airlines from './Airlines'
import Flights from './Flights'
import Passengers from './Passengers'

const styles = {
	app_title: {
		paddingTop: '20px',
	},
	description_text: {
		marginBottom: '50px',
	},
}

export default function FlightSuretyDapp({ network }) {
	const [airlines, setAirlines] = useState([Config.firstAirline])
	const [flights, setFlights] = useState([])
	const [passengers, setPassengers] = useState([])
	const [account, setAccount] = useState()
	const [flightSurety, setFlightSurety] = useState()
	const [visible, setVisible] = useState(false)
	const [message, setMessage] = useState()

	// Initialize web3
	useEffect(() => {
		loadBlockchainData(network)
	}, [network])

	// Watch for web3 events
	useEffect(() => {
		// Check if the user changes accounts
		window.ethereum.on('accountsChanged', (accounts) => {
			setAccount(accounts[0])
		})
	}, [])

	async function loadBlockchainData(network) {
		const web3 = new Web3(Web3.givenProvider || Config[network].url)

		// Set eth accounts
		const accounts = await web3.eth.getAccounts()
		setAccount(accounts[0])

		// Set contract
		const contract = new web3.eth.Contract(
			FlightSuretyApp.abi,
			Config[network].appAddress
		)
		setFlightSurety(contract)

		// Setup web3 event listeners
		subscribeLogEvent(web3, contract, 'AirlineRegistered', (event) => {
			setAirlines((airlines) => [
				...airlines,
				{ name: event.name, address: event.airline },
			])
			displayAlert(
				`Successfully registered airline ${event.name} with address ${event.airline}`
			)
		})
	}

	function displayAlert(message) {
		setVisible(true)
		setMessage(message)
		setTimeout(() => setVisible(false), 3000)
	}

	function handleAddAirline(name, address) {
		flightSurety.methods.registerAirline(name, address).send({ from: account })
	}

	function subscribeLogEvent(web3, contract, eventName, callback) {
		const eventJsonInterface = web3.utils._.find(
			contract._jsonInterface,
			(o) => o.name === eventName && o.type === 'event'
		)
		web3.eth.subscribe(
			'logs',
			{
				fromBlock: 0,
				address: contract.options.address,
				topics: [eventJsonInterface.signature],
			},
			(error, result) => {
				if (!error) {
					const eventObj = web3.eth.abi.decodeLog(
						eventJsonInterface.inputs,
						result.data,
						result.topics.slice(1)
					)
					callback(eventObj)
				}
			}
		)
	}

	return (
		<React.Fragment>
			<Container className='tim-container'>
				<Alert color='danger' isOpen={visible} toggle={() => setVisible(false)}>
					{message}
				</Alert>

				<h1 style={styles.app_title} className='text-center'>
					Flight Surety
				</h1>
				<h4 style={styles.description_text} className='text-center'>
					Insurance for your flight on the blockchain!
				</h4>

				<User flightSurety={flightSurety} account={account} />
				<Airlines airlines={airlines} handleAddAirline={handleAddAirline} />
				<Flights flightSurety={flightSurety} />
				<Passengers flightSurety={flightSurety} />
			</Container>
		</React.Fragment>
	)
}
