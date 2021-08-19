import React from 'react'
import { Container, Card, CardBody, CardTitle, Button, Table } from 'reactstrap'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
}

export default function Passengers() {
	return (
		<Card>
			<CardBody className='text-center'>
				<CardTitle style={styles.card_title}>Insured Passengers</CardTitle>
				<Table>
					<thead>
						<tr className='text-left'>
							<th>#</th>
							<th>Passenger Address</th>
							<th>Flight Number</th>
							<th>Flight Time</th>
							<th>Airline</th>
							<th>Insured Amount</th>
						</tr>
					</thead>
					<tbody>
						<tr className='text-left'>
							<td className='text-center'>1</td>
							<td>0x5B38Da6a701c568545dCfcB03FcB875f56beddC4</td>
							<td>UA123</td>
							<td>Monday, August 16, 2021 2:26:41 AM</td>
							<td>Udacity Airlines</td>
							<td>1 Ether</td>
						</tr>
					</tbody>
				</Table>
				<Button className='text-center' color='primary'>
					Purchase Insurance
				</Button>
			</CardBody>
		</Card>
	)
}
