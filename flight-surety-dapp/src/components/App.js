import React, { useEffect, useState } from 'react'
import { Container } from 'reactstrap'
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
		if (window.ethereum) loadBlockchainData(network)
	}, [network])

	// Watch for web3 events
	useEffect(() => {
		// Check if metamask is setup
		if (!window.ethereum) {
			return displayAlert(
				'Metamask not detected. Please install metamask and try again!',
				'Error'
			)
		}
		// Check if the user changes accounts
		window.ethereum.on('accountsChanged', (accounts) => {
			if (accounts.length) updateUser(accounts[0])
		})

		web3.eth.getAccounts().then((accounts) => {
			if (accounts.length) updateUser(accounts[0])
		})
	}, [airlines, passengers])

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
			(passenger) => passenger.address.toLowerCase() === address.toLowerCase()
		)
		if (_passengers.length > 0) {
			_user = {
				name: _passengers[0].name,
				role: 'Passenger',
			}
		}
		return _user
	}

	async function loadBlockchainData(network) {
		await window.ethereum.send('eth_requestAccounts')
		window.ethereum.autoRefreshOnNetworkChange = false

		// Set contract
		const contract = new web3.eth.Contract(
			FlightSuretyApp.abi,
			Config[network].appAddress
		)
		setFlightSurety(contract)

		// Setup web3 event listeners
		setWeb3EventListeners(contract)
	}

	function displayAlert(message, type) {
		switch (type) {
			case 'Success': {
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
				break
			}
			case 'Error': {
				setAlert(
					<ReactBSAlert
						error
						style={{ display: 'block', marginTop: '-100px' }}
						title='Uh Oh!'
						onConfirm={() => hideAlert()}
						onCancel={() => hideAlert()}
						confirmBtnBsStyle='danger'
						btnSize=''>
						{message}
					</ReactBSAlert>
				)
				break
			}
		}
	}

	const hideAlert = () => {
		setAlert(null)
	}

	// Airline Handlers
	function handleAddAirline(name, address) {
		flightSurety.methods
			.registerAirline(name, address)
			.send({ from: user.address })
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to add an airline. Please check the console for more details.',
					'Error'
				)
			})
	}

	function handleFundAirline(account) {
		flightSurety.methods
			.fundAirline()
			.send({ from: account, value: web3.utils.toWei('10', 'ether') })
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to fund an airline. Please check the console for more details.',
					'Error'
				)
			})
	}

	function handleVoteAirline(airline) {
		flightSurety.methods
			.voteAirline(airline)
			.send({ from: user.address })
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to vote for an airline. Please check the console for more details.',
					'Error'
				)
			})
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

	function getAirline(address) {
		return airlines.filter(
			(airline) => airline.address.toLowerCase() === address.toLowerCase()
		)[0]
	}

	// Flight Handlers
	function handleAddFlight({ flightNumber, flightTime }) {
		flightSurety.methods
			.registerFlight(flightNumber, flightTime)
			.send({ from: user.address })
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to add a flight. Please check the console for more details.',
					'Error'
				)
			})
	}

	function handleFlightStatus(flight) {
		// Check the flight status by calling the smart contract which then queries the oracle
		flightSurety.methods
			.processFlightStatus(
				flight.airline,
				flight.flightNumber,
				flight.flightTime,
				10
			)
			.send({ from: user.address })
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to retrieve the status of a flight. Please check the console for more details.',
					'Error'
				)
			})
	}

	function handleFlightEdit(flight) {
		setFlights((flights) => {
			const isNewFlight =
				flights.filter((f) => f.flightKey === flight.flightKey).length === 0
			const updatedFlights = isNewFlight
				? [...flights, flight]
				: flights.map((f) => (f.flightKey === flight.flightKey ? flight : f))
			return updatedFlights
		})
	}

	function getFlight(flightKey) {
		return flights.filter(
			(flight) => flight.flightKey.toLowerCase() === flightKey.toLowerCase()
		)[0]
	}

	// Passengers Handlers
	function handlePurchaseInsurance(
		passenger,
		{ airline, flightNumber, flightTime }
	) {
		flightSurety.methods
			.buyInsurance(passenger.name, airline, flightNumber, flightTime)
			.send({
				from: user.address,
				value: web3.utils.toWei(passenger.insuredAmount.toString(), 'ether'),
			})
			.catch((err) => {
				console.log(err.message)
				displayAlert(
					'An error occurred while trying to purchase insurance. Please check the console for more details.',
					'Error'
				)
			})
	}

	function handlePassengerEdit(passenger) {
		setPassengers((passengers) => {
			const isNewPassenger =
				passengers.filter(
					(p) =>
						p.flightKey === passenger.flightKey &&
						p.address === passenger.address
				).length === 0
			const updatedPassengers = isNewPassenger
				? [...passengers, passenger]
				: passengers.map((p) =>
						p.flightKey === passenger.flightKey &&
						p.address === passenger.address
							? passenger
							: p
				  )
			return updatedPassengers
		})
	}

	function setWeb3EventListeners(contract) {
		// Airlines events
		const AirlineRegistered = {
			callback: (event) => {
				console.log('AirlineRegistered', event)
				handleAirlineEdit({
					name: event.name,
					address: event.airline,
					status: 'Registered',
				})
				displayAlert(`Successfully registered airline ${event.name}`, 'Success')
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
				displayAlert(`Successfully queued airline ${event.name}`, 'Success')
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
				displayAlert(`Successfully funded airline ${event.name}`, 'Success')
			},
		}

		const AirlineVoted = {
			callback: (event) => {
				console.log('AirlineVoted', event)
				displayAlert(`Successfully voted for airline ${event.name}`, 'Success')
			},
		}

		// Flights events
		const FlightRegistered = {
			callback: (flight) => {
				console.log('FlightRegistered', flight)
				handleFlightEdit({
					...flight,
					status: 'Unknown',
				})
				displayAlert(
					`Successfully registered flight ${flight.flightNumber}`,
					'Success'
				)
			},
		}

		const FlightStatus = {
			callback: (flight) => {
				console.log('FlightStatus', flight)
				displayAlert(
					`Successfully registered flight ${flight.flightNumber}`,
					'Success'
				)
			},
		}

		// Passenger events
		const PassengerPurchasedInsurance = {
			callback: (passenger) => {
				console.log('PassengerPurchasedInsurance', passenger)
				const newPassenger = {
					name: passenger.name,
					address: passenger.passenger,
					flightKey: passenger.flightKey,
					insuredAmount: parseFloat(
						web3.utils.fromWei(passenger.amount)
					).toFixed(2),
					amountOwed: 0,
				}
				handlePassengerEdit(newPassenger)
				displayAlert(
					`Successfully insured passenger ${newPassenger.name}`,
					'Success'
				)
			},
		}

		subscribeAllEvents(contract, {
			AirlineRegistered,
			AirlineQueued,
			AirlineFunded,
			AirlineVoted,
			FlightRegistered,
			FlightStatus,
			PassengerPurchasedInsurance,
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

	// Utility functions
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
					user={user}
					airlines={airlines}
					handleAddAirline={handleAddAirline}
					handleFundAirline={handleFundAirline}
					handleVoteAirline={handleVoteAirline}
					displayAlert={displayAlert}
				/>
				<Flights
					user={user}
					airlines={airlines}
					flights={flights}
					handleAddFlight={handleAddFlight}
					handleFlightStatus={handleFlightStatus}
					displayAlert={displayAlert}
					getAirline={getAirline}
				/>
				<Passengers
					user={user}
					passengers={passengers}
					flights={flights}
					handlePurchaseInsurance={handlePurchaseInsurance}
					displayAlert={displayAlert}
					getAirline={getAirline}
					getFlight={getFlight}
				/>
			</Container>
		</React.Fragment>
	)
}
