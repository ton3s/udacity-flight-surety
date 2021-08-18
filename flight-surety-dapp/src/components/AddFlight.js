import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
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

const styles = {
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
	airlines,
}) {
	const newFlight = {
		id: uuidv4(),
		flightNumber: '',
		flightTime: '',
		airline: airlines[0].name,
	}
	const [flight, setFlight] = useState(newFlight)

	function handleAdd(flight) {
		toggle(false)
		// handleAddFlight(flight.name, flight.address)
		console.log(flight)
		setFlight(newFlight)
	}

	function handleChange(changes) {
		const updatedFlight = { ...flight, ...changes }
		setFlight(updatedFlight)
	}

	return (
		<Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
			<Form>
				<Card className=' card-login card-plain'>
					<div className='modal-header justify-content-center'>
						<button
							aria-label='Close'
							className=' close'
							data-dismiss='modal'
							type='button'
							onClick={() => toggle(!isOpen)}>
							<span aria-hidden={true}>×</span>
						</button>
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
								<Label for='airline'>Airline</Label>
								<Input
									type='select'
									name='airline'
									id='airline'
									onChange={(event) =>
										handleChange({ airline: event.target.value })
									}>
									{airlines
										.filter((airline) => airline.status === 'Funded')
										.map((airline, index) => (
											<option key={index} value={airline.name}>
												{airline.name}
											</option>
										))}
								</Input>
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
