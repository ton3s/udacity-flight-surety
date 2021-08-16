import React, { useEffect, useState } from 'react'
import { Card, CardTitle, CardBody, Button, Table } from 'reactstrap'

// Components
import AddAirline from './AddAirline'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_action: {
		marginRight: '10px',
	},
}

export default function Airlines({ airlines, handleAddAirline }) {
	const [showAirlineModal, setShowAirlineModal] = React.useState(false)

	return (
		<>
			<AddAirline
				isOpen={showAirlineModal}
				toggle={setShowAirlineModal}
				handleAddAirline={handleAddAirline}
			/>
			<Card>
				<CardBody className='text-center'>
					<CardTitle style={styles.card_title}>Airlines</CardTitle>
					<Table>
						<thead>
							<tr className='text-left'>
								<th>#</th>
								<th>Name</th>
								<th>Address</th>
								<th>Status</th>
								<th className='text-center'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{airlines.map((airline, index) => (
								<tr key={index} className='text-left'>
									<td className='text-center'>{index + 1}</td>
									<td>{airline.name}</td>
									<td>{airline.address}</td>
									<td>Registered</td>
									<td className='td-actions text-right'>
										<Button
											style={styles.button_action}
											color='primary'
											type='button'>
											Fund
										</Button>
										<Button
											className='text-center'
											color='primary'
											type='button'>
											Vote
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
					<Button
						className='text-center'
						color='primary'
						onClick={() => setShowAirlineModal(true)}>
						Register Airline
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
