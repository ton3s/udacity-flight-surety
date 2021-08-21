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

		// Check if the amount sent is 1 ether or less
		if (passenger.insuredAmount <= 0 || passenger.insuredAmount > 1) {
			return displayAlert(
				`Insured amount needs to be greater than 0 and less than or equal to 1 Ether`,
				'Error'
			)
		}

		// Get the flight
		const flight = flights[passenger.flight]

		// Get passenger name
		if (user.role === 'Passenger') passenger.name = user.name

		reset()
		toggle(false)
		handlePurchaseInsurance(passenger, flight)
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
						{user.role === 'Passenger' && (
							<h5 className='modal-title'>{user.name}</h5>
						)}
					</div>
					<div className='modal-body'>
						<CardBody>
							{user.role === 'Unknown' && (
								<FormGroup>
									<Label for='name'>Full Name</Label>
									<Input
										type='text'
										name='name'
										placeholder='Full Name'
										{...register('name')}
									/>
								</FormGroup>
							)}
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
							<FormGroup>
								<Label for='insuredAmount'>
									Insured Amount (Up to 1 Ether)
								</Label>
								<Input
									type='number'
									step='.01'
									name='insuredAmount'
									placeholder='Insured Amount'
									{...register('insuredAmount')}
								/>
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
