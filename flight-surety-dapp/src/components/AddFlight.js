import React, { useState } from 'react'
import {
	Card,
	CardBody,
	Button,
	Modal,
	Form,
	Input,
	Label,
	FormGroup,
} from 'reactstrap'
import Datetime from 'react-datetime'
import moment from 'moment'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_modal: {
		fontSize: '16px',
		paddingTop: '15px',
	},
	button_close: {
		marginBottom: '15px',
	},
}

export default function AddFlight({
	isOpen,
	toggle,
	handleAddFlight,
	user,
	flights,
	displayAlert,
}) {
	const newFlight = {
		flightNumber: '',
		flightTime: '',
		airline: user.address,
		status: 'Unknown',
	}
	const [flight, setFlight] = useState(newFlight)

	function handleAdd({ flightNumber, flightTime }) {
		newFlight.flightNumber = flightNumber
		newFlight.flightTime = moment(flightTime).valueOf()

		// Check if this flight/time combination has already been register
		if (isNewFlight(newFlight)) {
			// Submit transaction to the smart contract
			handleAddFlight(newFlight)

			// Reset modal
			setFlight({
				flightNumber: '',
				flightTime: '',
			})
			toggle(false)
		} else {
			displayAlert(
				`This flight number and flight time has already been registered`,
				'Error'
			)
		}
	}

	function isNewFlight(flight) {
		// Check against existing flights
		return (
			flights.filter(
				(f) =>
					f.flightNumber === flight.flightNumber &&
					f.flightTime === flight.flightTime.toString() &&
					f.airline === flight.airline
			).length === 0
		)
	}

	function handleChange(changes) {
		const updatedFlight = { ...flight, ...changes }
		setFlight(updatedFlight)
	}

	return (
		<Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
			<Form>
				<Card className='card-login card-plain'>
					<div className='modal-header justify-content-center'>
						<button
							aria-label='Close'
							className=' close'
							data-dismiss='modal'
							type='button'
							onClick={() => toggle(!isOpen)}>
							<span aria-hidden={true}>×</span>
						</button>
						<h5 className='modal-title'>{user.name}</h5>
					</div>
					<div className='modal-body'>
						<CardBody>
							<FormGroup>
								<Label for='name'>Flight Number</Label>
								<Input
									type='text'
									name='flightNumber'
									placeholder='Flight Number'
									value={flight.flightNumber}
									onChange={(event) =>
										handleChange({ flightNumber: event.target.value })
									}
								/>
							</FormGroup>
							<FormGroup>
								<Label for='flightTime'>Flight Time</Label>
								<Datetime
									name='flightTime'
									id='flightTime'
									value={flight.flightTime}
									inputProps={{ placeholder: 'Flight Time' }}
									onChange={(flightTime) => handleChange({ flightTime })}
								/>
							</FormGroup>
						</CardBody>
					</div>
					<div className='modal-footer text-center'>
						<Button
							type='button'
							block
							className='btn-neutral btn-round'
							style={styles.button_modal}
							color='primary'
							onClick={() => handleAdd(flight)}>
							Add Flight
						</Button>
					</div>
				</Card>
			</Form>
		</Modal>
	)
}
