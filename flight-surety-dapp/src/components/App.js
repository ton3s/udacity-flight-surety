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
	const [account, setAccount] = useState()
	const [flightSurety, setFlightSurety] = useState()
	const [visible, setVisible] = useState(false)
	const [message, setMessage] = useState()

	// Initialize web3
	useEffect(() => {
		loadBlockchainData(network)
	}, [])

	// Watch for events in web3
	useEffect(() => {
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
	}

	function displayAlert(message) {
		setVisible(true)
		setMessage(message)
		setTimeout(() => setVisible(false), 3000)
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
				<Airlines
					flightSurety={flightSurety}
					firstAirline={Config.firstAirline}
				/>
				<Flights flightSurety={flightSurety} />
				<Passengers flightSurety={flightSurety} />
			</Container>
		</React.Fragment>
	)
}
