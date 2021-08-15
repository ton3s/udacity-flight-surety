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

const styles = {
	card_title: {
		fontSize: '28px',
		marginBottom: '20px',
	},
}

export default function Flights() {
	return (
		<Card>
			<CardBody className='text-center'>
				<CardTitle style={styles.card_title}>Flights</CardTitle>
				<Table>
					<thead>
						<tr className='text-left'>
							<th>#</th>
							<th>Name</th>
							<th>Time</th>
							<th>Airline</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr className='text-left'>
							<td className='text-center'>1</td>
							<td>UA123</td>
							<td>Monday, August 16, 2021 2:26:41 AM</td>
							<td>Udacity Airlines</td>
							<td>On Time</td>
						</tr>
					</tbody>
				</Table>
				<Button className='text-center' color='primary'>
					Add Airline
				</Button>
			</CardBody>
		</Card>
	)
}
