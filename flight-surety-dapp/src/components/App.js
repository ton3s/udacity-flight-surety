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

// Libraries
import ReactBSAlert from 'react-bootstrap-sweetalert'

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
	const [user, setUser] = useState({})

	// Contract
	const [flightSurety, setFlightSurety] = useState()
	const [web3, setWeb3] = useState(
		new Web3(Web3.givenProvider || Config[network].url)
	)

	// Utility
	const [alert, setAlert] = React.useState(null)

	// Initialize blockchain
	useEffect(() => {
		loadBlockchainData(network)
	}, [network])

	// Watch for web3 events
	useEffect(() => {
		// Check if the user changes accounts
		window.ethereum.on('accountsChanged', (accounts) => {
			updateUser(accounts[0])
		})
		web3.eth.getAccounts().then((accounts) => updateUser(accounts[0]))
	}, [airlines])

	React.useEffect(() => {
		return function cleanup() {
			var id = window.setTimeout(null, 0)
			while (id--) {
				window.clearTimeout(id)
			}
		}
	}, [])

	async function updateUser(address) {
		const balance = parseFloat(
			web3.utils.fromWei(await web3.eth.getBalance(address))
		).toFixed(2)
		let { name, role } = getUserDetails(address)
		setUser({
			role,
			name,
			address: address,
			balance: `${balance} ETH`,
		})
	}

	async function loadBlockchainData(network) {
		// Set contract
		const contract = new web3.eth.Contract(
			FlightSuretyApp.abi,
			Config[network].appAddress
		)
		setFlightSurety(contract)

		// Setup web3 event listeners
		setWeb3EventListeners(contract)
	}

	function displayAlert(message) {
		setAlert(
			<ReactBSAlert
				success
				style={{ display: 'block', marginTop: '-100px' }}
				title='Good job!'
				onConfirm={() => hideAlert()}
				onCancel={() => hideAlert()}
				confirmBtnBsStyle='info'
				btnSize=''>
				{message}
			</ReactBSAlert>
		)
	}

	const hideAlert = () => {
		setAlert(null)
	}

	function handleAddAirline(name, address) {
		flightSurety.methods
			.registerAirline(name, address)
			.send({ from: user.address })
			.catch((err) => console.log('handleAddAirline: ', err))
	}

	function handleFundAirline(account) {
		flightSurety.methods
			.fundAirline()
			.send({ from: account, value: web3.utils.toWei('10', 'ether') })
			.catch((err) => console.log('handleFundAirline: ', err))
	}

	function handleVoteAirline(airline) {
		flightSurety.methods
			.voteAirline(airline)
			.send({ from: user.address })
			.catch((err) => console.log('handleVoteAirline: ', err))
	}

	// Sets account role depending on the address selected
	// Address that is neither or passenger or airline is defined as unknown
	function getUserDetails(address) {
		let _user = {
			name: 'Unknown',
			role: 'Unknown',
		}

		let _airlines = airlines.filter(
			(airline) => airline.address.toLowerCase() === address.toLowerCase()
		)
		if (_airlines.length > 0) {
			_user = {
				name: _airlines[0].name,
				role: 'Airline',
			}
		}

		let _passengers = passengers.filter(
			(passengers) => passengers.address.toLowerCase() === address.toLowerCase()
		)
		if (_passengers.length > 0) {
			_user = {
				name: _passengers[0].name,
				role: 'Passenger',
			}
		}
		return _user
	}

	function handleAirlineEdit(airline) {
		setAirlines((airlines) => {
			const isNewAirline =
				airlines.filter(
					(a) => a.address.toLowerCase() === airline.address.toLowerCase()
				).length === 0
			const updatedAirlines = isNewAirline
				? [...airlines, airline]
				: airlines.map((a) =>
						a.address.toLowerCase() === airline.address.toLowerCase()
							? airline
							: a
				  )
			return updatedAirlines
		})
	}

	function setWeb3EventListeners(contract) {
		// Airlines
		const AirlineRegistered = {
			callback: (event) => {
				console.log('AirlineRegistered', event)
				handleAirlineEdit({
					name: event.name,
					address: event.airline,
					status: 'Registered',
				})
				displayAlert(`Successfully registered airline ${event.name}`)
			},
		}

		const AirlineQueued = {
			callback: (event) => {
				console.log('AirlineQueued', event)
				handleAirlineEdit({
					name: event.name,
					address: event.airline,
					status: 'Queued',
				})
				displayAlert(`Successfully queued airline ${event.name}`)
			},
		}

		const AirlineFunded = {
			callback: (event) => {
				console.log('AirlineFunded', event)
				handleAirlineEdit({
					name: event.name,
					address: event.airline,
					status: 'Funded',
				})
				displayAlert(`Successfully funded airline ${event.name}`)
			},
		}

		const AirlineVoted = {
			callback: (event) => {
				console.log('AirlineVoted', event)
				displayAlert(`Successfully voted for airline ${event.name}`)
			},
		}

		subscribeAllEvents(contract, {
			AirlineRegistered,
			AirlineQueued,
			AirlineFunded,
			AirlineVoted,
		})
	}

	function subscribeAllEvents(contract, events) {
		const eventInterfaces = {}
		Object.keys(events).forEach((event) => {
			const eventInterface = getEventJSONInterface(contract, event)
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
						events[eventName].callback(eventObj)
					}
				}
			}
		)
	}

	function getEventJSONInterface(contract, eventName) {
		return web3.utils._.find(
			contract._jsonInterface,
			(o) => o.name === eventName && o.type === 'event'
		)
	}

	return (
		<React.Fragment>
			<Container className='tim-container'>
				{alert}

				<h1 style={styles.app_title} className='text-center'>
					Flight Surety
				</h1>
				<h4 style={styles.description_text} className='text-center'>
					Insurance for your flight on the blockchain!
				</h4>

				<User user={user} />
				<Airlines
					airlines={airlines}
					handleAddAirline={handleAddAirline}
					handleFundAirline={handleFundAirline}
					handleVoteAirline={handleVoteAirline}
				/>
				<Flights flightSurety={flightSurety} />
				<Passengers flightSurety={flightSurety} />
			</Container>
		</React.Fragment>
	)
}
