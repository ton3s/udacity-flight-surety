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
	const [user, setUser] = useState({})

	// Contract
	const [flightSurety, setFlightSurety] = useState()
	const [web3, setWeb3] = useState(
		new Web3(Web3.givenProvider || Config[network].url)
	)

	// Utility
	const [visible, setVisible] = useState(false)
	const [message, setMessage] = useState()

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

	async function updateUser(address) {
		const balance = parseFloat(
			web3.utils.fromWei(await web3.eth.getBalance(address))
		).toFixed(2)
		setUser({
			role: getUserRole(address),
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
		setVisible(true)
		setMessage(message)
		setTimeout(() => setVisible(false), 3000)
	}

	function handleAddAirline(name, address) {
		flightSurety.methods
			.registerAirline(name, address)
			.send({ from: user.address })
	}

	function handleFundAirline(account) {
		flightSurety.methods
			.fundAirline()
			.send({ from: account, value: web3.utils.toWei('10', 'ether') })
	}

	function handleVoteAirline(airline) {
		flightSurety.methods.voteAirline(airline).send({ from: user.address })
	}

	// Sets account role depending on the address selected
	// Address that is neither or passenger or airline is defined as unknown
	function getUserRole(address) {
		let role = 'Unknown'
		if (
			airlines.filter(
				(airline) => airline.address.toLowerCase() === address.toLowerCase()
			).length > 0
		) {
			role = 'Airline'
		} else if (
			passengers.filter(
				(passengers) =>
					passengers.address.toLowerCase() === address.toLowerCase()
			).length > 0
		) {
			role = 'Passenger'
		}
		return role
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
				displayAlert(
					`Successfully registered airline ${event.name} with address ${event.airline}`
				)
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
				displayAlert(
					`Successfully queued airline ${event.name} with address ${event.airline}`
				)
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
				displayAlert(
					`Successfully funded airline ${event.name} with address ${event.airline}`
				)
			},
		}

		const AirlineVoted = {
			callback: (event) => {
				console.log('AirlineVoted', event)
				displayAlert(
					`Successfully voted for airline ${event.name} from address ${event.fromAirline}`
				)
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
				<Alert
					color='success'
					isOpen={visible}
					toggle={() => setVisible(false)}>
					{message}
				</Alert>

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
