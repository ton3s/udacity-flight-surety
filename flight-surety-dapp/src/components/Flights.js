import React, { useEffect, useState } from 'react'
import {
	Container,
	Card,
	CardBody,
	CardTitle,
	Button,
	Alert,
	Table,
} from 'reactstrap'

// Components
import AddFlight from './AddFlight'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_action: {
		margin: '0px',
	},
}

export default function Flights({
	user,
	airlines,
	flights,
	handleAddFlight,
	handleFlightStatus,
	displayAlert,
}) {
	const [showFlightModal, setShowFlightModal] = React.useState(false)

	function handleAddFlightModal() {
		// Check that funded airline is currently selected
		if (
			user.role != 'Airline' ||
			airlines.filter((airline) => airline.name === user.name)[0].status !=
				'Funded'
		) {
			return displayAlert(
				'Please select a funded airline in order to add a flight',
				'Error'
			)
		}
		setShowFlightModal(true)
	}

	return (
		<>
			<AddFlight
				isOpen={showFlightModal}
				toggle={setShowFlightModal}
				handleAddAirline={handleAddFlight}
				airline={user.name}
			/>
			<Card>
				<CardBody className='text-center'>
					<CardTitle style={styles.card_title}>Flights</CardTitle>
					{flights.length === 0 && (
						<blockquote className='blockquote text-center'>
							<p className='mb-0'>
								Please register a flight from a funded airline
							</p>
						</blockquote>
					)}
					{flights.length > 0 && (
						<Table>
							<thead>
								<tr className='text-left'>
									<th className='text-center'>#</th>
									<th>Name</th>
									<th>Airline</th>
									<th>Time</th>
									<th>Status</th>
									<th className='text-right'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{flights.map((flight) => (
									<tr className='text-left'>
										<td className='text-center'>1</td>
										<td>{flight.flightNumber}</td>
										<td>{flight.airline}</td>
										<td>{flight.flightTime}</td>
										<td>{flight.status}</td>
										<td className='td-actions text-right'>
											<Button
												style={styles.button_action}
												color='primary'
												type='button'
												onClick={() => handleFlightStatus(flight)}>
												Status
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					)}
					<Button
						className='text-center'
						color='primary'
						onClick={handleAddFlightModal}>
						Add Flight
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
