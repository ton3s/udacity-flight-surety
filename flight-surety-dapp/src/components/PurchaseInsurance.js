import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
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

export default function PurchaseInsurance({
	isOpen,
	toggle,
	handlePurchaseInsurance,
	user,
	flights,
	displayAlert,
	getAirline,
}) {
	const { register, handleSubmit, reset } = useForm()

	function onSubmit(passenger) {
		// Set default value if not set
		if (!passenger.flight) passenger.flight = 0

		console.log(passenger)

		reset()
		toggle(false)
		// handlePurchaseInsurance(
		// 	passenger.airline,
		// 	passenger.flightNumber,
		// 	passenger.flightTime
		// )
	}

	function getFlightDetails(flight) {
		return `${flight.flightNumber}, ${moment(
			parseInt(flight.flightTime)
		).format('MM/DD/YY, h:mm:ss a')}, ${getAirline(flight.airline).name}`
	}

	return (
		<Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
			<Form onSubmit={handleSubmit(onSubmit)}>
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
								<Label for='name'>Full Name</Label>
								<Input
									type='text'
									name='name'
									placeholder='Full Name'
									{...register('name')}
								/>
							</FormGroup>
							<FormGroup>
								<Label for='flight'>Flight</Label>
								<Input
									type='select'
									name='flight'
									id='flight'
									{...register('flight')}>
									{flights.map((flight, index) => (
										<option key={flight.flightKey} value={index}>
											{getFlightDetails(flight)}
										</option>
									))}
								</Input>
							</FormGroup>
						</CardBody>
					</div>
					<div className='modal-footer text-center'>
						<Button
							type='submit'
							block
							className='btn-neutral btn-round'
							style={styles.button_modal}
							color='primary'>
							Purchase Insurance
						</Button>
					</div>
				</Card>
			</Form>
		</Modal>
	)
}
