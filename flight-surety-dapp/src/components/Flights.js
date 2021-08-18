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
	airlines,
	flights,
	handleAddFlight,
	handleFlightStatus,
}) {
	const [showFlightModal, setShowFlightModal] = React.useState(false)
	return (
		<>
			<AddFlight
				isOpen={showFlightModal}
				toggle={setShowFlightModal}
				handleAddAirline={handleAddFlight}
				airlines={airlines}
			/>
			<Card>
				<CardBody className='text-center'>
					<CardTitle style={styles.card_title}>Flights</CardTitle>
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
							<tr className='text-left'>
								<td className='text-center'>1</td>
								<td>UA123</td>
								<td>Udacity Airlines</td>
								<td>Monday, August 16, 2021 2:26:41 AM</td>
								<td>On Time</td>
								<td className='td-actions text-right'>
									<Button
										style={styles.button_action}
										color='primary'
										type='button'
										onClick={() => handleFlightStatus(flights)}>
										Status
									</Button>
								</td>
							</tr>
						</tbody>
					</Table>
					<Button
						className='text-center'
						color='primary'
						onClick={() => setShowFlightModal(true)}>
						Add Flight
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
