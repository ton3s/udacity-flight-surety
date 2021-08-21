import React from 'react'
import { Container, Card, CardBody, CardTitle, Table } from 'reactstrap'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
}

export default function User({ user }) {
	return (
		<Card>
			<CardBody className='text-center'>
				<CardTitle style={styles.card_title}>
					Selected Account Details
				</CardTitle>
				<Table>
					<thead>
						<tr className='text-left'>
							<th>Role</th>
							<th>Name</th>
							<th>Address</th>
							<th>Balance</th>
							{user.role === 'Passenger' && (
								<th className='text-center'>Amount Owed</th>
							)}
						</tr>
					</thead>
					<tbody>
						<tr className='text-left'>
							<td>{user.role}</td>
							<td>{user.name}</td>
							<td>{user.address}</td>
							<td>{user.balance}</td>
							{user.role === 'Passenger' && (
								<td className='text-center'>0.0 ETH</td>
							)}
						</tr>
					</tbody>
				</Table>
			</CardBody>
		</Card>
	)
}
