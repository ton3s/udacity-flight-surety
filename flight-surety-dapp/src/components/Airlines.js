import React from 'react'
import { Card, CardTitle, CardBody, Button, Table } from 'reactstrap'

// Components
import AddAirline from './AddAirline'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_action: {
		margin: '0px',
	},
}

export default function Airlines({
	user,
	airlines,
	handleAddAirline,
	handleFundAirline,
	handleVoteAirline,
	displayAlert,
}) {
	const [showAirlineModal, setShowAirlineModal] = React.useState(false)

	function handleAddAirlineModal() {
		// Check that funded or registered airline is currently selected
		if (
			user.role !== 'Airline' ||
			airlines.filter((airline) => airline.name === user.name)[0].status !==
				'Funded'
		) {
			return displayAlert('Only funded airlines can register airlines', 'Error')
		}
		setShowAirlineModal(true)
	}

	return (
		<>
			<AddAirline
				isOpen={showAirlineModal}
				toggle={setShowAirlineModal}
				handleAddAirline={handleAddAirline}
				airlines={airlines}
			/>
			<Card>
				<CardBody className='text-center'>
					<CardTitle style={styles.card_title}>Airlines</CardTitle>
					<Table>
						<thead>
							<tr className='text-left'>
								<th className='text-center'>#</th>
								<th>Name</th>
								<th>Address</th>
								<th>Status</th>
								<th className='text-right'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{airlines.map((airline, index) => (
								<tr key={index} className='text-left'>
									<td className='text-center'>{index + 1}</td>
									<td>{airline.name}</td>
									<td>{airline.address.toLowerCase()}</td>
									<td>{airline.status}</td>
									<td className='td-actions text-right'>
										{airline.status === 'Registered' && (
											<Button
												style={styles.button_action}
												color='primary'
												type='button'
												onClick={() => handleFundAirline(airline.address)}>
												Fund
											</Button>
										)}
										{airline.status === 'Queued' && (
											<Button
												style={styles.button_action}
												className='text-center'
												color='primary'
												type='button'
												onClick={() => handleVoteAirline(airline.address)}>
												Vote
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</Table>
					<Button
						className='text-center'
						color='primary'
						onClick={handleAddAirlineModal}>
						Add Airline
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
