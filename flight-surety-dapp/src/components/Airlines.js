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

export default function Airlines() {
	return (
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
						</tr>
					</thead>
					<tbody>
						<tr className='text-left'>
							<td className='text-center'>1</td>
							<td>Udacity Airlines</td>
							<td>0x5B38Da6a701c568545dCfcB03FcB875f56beddC4</td>
							<td>Registered</td>
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
