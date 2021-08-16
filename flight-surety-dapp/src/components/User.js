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
		fontSize: '24px',
		marginBottom: '20px',
	},
}

export default function User({ account, role }) {
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
							<th>Address</th>
						</tr>
					</thead>
					<tbody>
						<tr className='text-left'>
							<td>{role}</td>
							<td>{account}</td>
						</tr>
					</tbody>
				</Table>
			</CardBody>
		</Card>
	)
}
