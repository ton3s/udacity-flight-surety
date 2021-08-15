import React, { useEffect, useState } from 'react'
import { Container, Alert } from 'reactstrap'
import Web3 from 'web3'

// Contracts
import FlightSuretyApp from '../contracts/FlightSuretyApp.json'
import Config from '../contracts/config.json'

// Components
import Airlines from './Airlines'

const styles = {
	description_text: {
		marginBottom: '50px',
	},
}

export default function FlightSuretyDapp({ network }) {
	const [account, setAccount] = useState()
	const [flightSurety, setFlightSurety] = useState()
	const [visible, setVisible] = useState(false)
	const [message, setMessage] = useState()

	useEffect(() => {
		loadBlockchainData(network)
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
				<h1 className='text-center'>Flight Surety</h1>
				<h4 style={styles.description_text} className='text-center'>
					Insurance for your flight on the blockchain!
				</h4>
				<Airlines flightSurety={flightSurety} />
			</Container>
		</React.Fragment>
	)
}
