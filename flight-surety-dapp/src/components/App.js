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
	// Models
	const [airlines, setAirlines] = useState([Config.firstAirline])
	const [flights, setFlights] = useState([])
	const [passengers, setPassengers] = useState([])

	// User
	const [account, setAccount] = useState()
	const [role, setRole] = useState()

	// Contract
	const [flightSurety, setFlightSurety] = useState()

	// Utility
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
			setUserRole(accounts[0])
		})
	}, [])

	async function loadBlockchainData(network) {
		const web3 = new Web3(Web3.givenProvider || Config[network].url)

		// Set eth accounts
		const accounts = await web3.eth.getAccounts()
		setAccount(accounts[0])
		setUserRole(accounts[0])

		// Set contract
		const contract = new web3.eth.Contract(
			FlightSuretyApp.abi,
			Config[network].appAddress
		)
		setFlightSurety(contract)

		// Setup web3 event listeners
		setWeb3EventListeners(web3, contract)
		// Airlines
		// subscribeLogEvent(web3, contract, 'AirlineRegistered', (event) => {
		// 	console.log('AirlineRegistered', event)
		// 	setAirlines((airlines) => [
		// 		...airlines,
		// 		{ name: event.name, address: event.airline, status: 'Registered' },
		// 	])
		// 	displayAlert(
		// 		`Successfully registered airline ${event.name} with address ${event.airline}`
		// 	)
		// })

		// subscribeLogEvent(web3, contract, 'AirlineQueued', (event) => {
		// console.log('AirlineQueued', event)
		// setAirlines((airlines) => [
		// 	...airlines,
		// 	{ name: event.name, address: event.airline, status: 'Queued' },
		// ])
		// displayAlert(
		// 	`Successfully queued airline ${event.name} with address ${event.airline}`
		// )
		// })

		// subscribeLogEvent(web3, contract, 'AirlineFunded', (event) => {
		// 	console.log('AirlineFunded', event)
		// 	setAirlines((airlines) => [
		// 		...airlines,
		// 		{ name: event.name, address: event.airline, status: 'Funded' },
		// 	])
		// 	displayAlert(
		// 		`Successfully funded airline ${event.name} with address ${event.airline}`
		// 	)
		// })

		// subscribeLogEvent(web3, contract, 'AirlineVoted', (event) => {
		// 	console.log('AirlineVoted', event)
		// 	displayAlert(
		// 		`Successfully voted for airline ${event.name} from address ${event.fromAirline}`
		// 	)
		// })
	}

	function displayAlert(message) {
		setVisible(true)
		setMessage(message)
		setTimeout(() => setVisible(false), 3000)
	}

	function handleAddAirline(name, address) {
		flightSurety.methods.registerAirline(name, address).send({ from: account })
	}

	// Sets account role depending on the address selected
	// Address that is neither or passenger or airline is defined as unknown
	function setUserRole(account) {
		if (
			airlines.filter(
				(airline) => airline.address.toLowerCase() == account.toLowerCase()
			).length > 0
		) {
			setRole('Airline')
		} else if (
			passengers.filter(
				(passengers) =>
					passengers.address.toLowerCase() == account.toLowerCase()
			).length > 0
		) {
			setRole('Passenger')
		} else {
			setRole('Unknown')
		}
	}

	function setWeb3EventListeners(web3, contract) {
		// Airlines
		const AirlineRegistered = {
			callback: (event) => {
				console.log('AirlineRegistered', event)
				setAirlines((airlines) => [
					...airlines,
					{ name: event.name, address: event.airline, status: 'Registered' },
				])
				displayAlert(
					`Successfully registered airline ${event.name} with address ${event.airline}`
				)
			},
		}
		const AirlineQueued = {
			callback: (event) => {
				console.log('AirlineQueued', event)
				setAirlines((airlines) => [
					...airlines,
					{ name: event.name, address: event.airline, status: 'Queued' },
				])
				displayAlert(
					`Successfully queued airline ${event.name} with address ${event.airline}`
				)
			},
		}
		subscribeAllEvents(web3, contract, { AirlineRegistered, AirlineQueued })
	}

	function subscribeAllEvents(web3, contract, events) {
		const eventInterfaces = {}
		Object.keys(events).forEach((event) => {
			const eventInterface = getEventJSONInterface(web3, contract, event)
			eventInterfaces[eventInterface.signature] = eventInterface
		})
		web3.eth.subscribe(
			'logs',
			{
				fromBlock: 0,
				address: contract.options.address,
			},
			(error, result) => {
				if (!error) {
					const eventObj = web3.eth.abi.decodeLog(
						eventInterfaces[result.topics[0]].inputs,
						result.data,
						result.topics.slice(1)
					)
					const eventName = eventInterfaces[result.topics[0]].name
					if (events[eventName].callback) {
						events[eventName].callback({
							...eventObj,
						})
					}
				}
			}
		)
	}

	function getEventJSONInterface(web3, contract, eventName) {
		return web3.utils._.find(
			contract._jsonInterface,
			(o) => o.name === eventName && o.type === 'event'
		)
	}

	return (
		<React.Fragment>
			<Container className='tim-container'>
				<Alert color='info' isOpen={visible} toggle={() => setVisible(false)}>
					{message}
				</Alert>

				<h1 style={styles.app_title} className='text-center'>
					Flight Surety
				</h1>
				<h4 style={styles.description_text} className='text-center'>
					Insurance for your flight on the blockchain!
				</h4>

				<User flightSurety={flightSurety} account={account} role={role} />
				<Airlines airlines={airlines} handleAddAirline={handleAddAirline} />
				<Flights flightSurety={flightSurety} />
				<Passengers flightSurety={flightSurety} />
			</Container>
		</React.Fragment>
	)
}
