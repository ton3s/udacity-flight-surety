import React from 'react'
import { Container, Card, CardBody, CardTitle, Button, Table } from 'reactstrap'

// Components
import PurchaseInsurance from './PurchaseInsurance'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_action: {
		margin: '0px',
	},
}

export default function Passengers({
	user,
	passengers,
	flights,
	handlePurchaseInsurance,
	displayAlert,
	getAirline,
}) {
	const [showPurchaseInsuranceModal, setShowPurchaseInsuranceModal] =
		React.useState(false)

	function handlePurchaseInsuranceModal() {
		if (user.role === 'Airline') {
			return displayAlert(
				'An airline account cannot purchase insurance',
				'Error'
			)
		}
		setShowPurchaseInsuranceModal(true)
	}
	return (
		<>
			<PurchaseInsurance
				isOpen={showPurchaseInsuranceModal}
				toggle={setShowPurchaseInsuranceModal}
				handlePurchaseInsurance={handlePurchaseInsurance}
				user={user}
				flights={flights}
				displayAlert={displayAlert}
				getAirline={getAirline}
			/>
			<Card>
				<CardBody className='text-center'>
					<CardTitle style={styles.card_title}>Insured Passengers</CardTitle>
					{passengers.length === 0 && (
						<blockquote className='blockquote text-center'>
							<p className='mb-0'>Purchase insurance for a flight</p>
						</blockquote>
					)}
					{passengers.length > 0 && (
						<Table>
							<thead>
								<tr className='text-left'>
									<th className='text-center'>#</th>
									<th>Passenger Address</th>
									<th>Flight Number</th>
									<th>Flight Time</th>
									<th>Airline</th>
									<th>Insured Amount</th>
								</tr>
							</thead>
							<tbody>
								{passengers.map((passenger, index) => (
									<tr key={index} className='text-left'>
										<td className='text-center'>{index + 1}</td>
										<td>{passenger.address}</td>
										<td>{passenger.flightNumber}</td>
										<td>{passenger.flightTime}</td>
										<td>{getAirline(passenger.airline).name}</td>
										<td>{passenger.insuredAmount}</td>
									</tr>
								))}
							</tbody>
						</Table>
					)}
					<Button
						className='text-center'
						color='primary'
						onClick={handlePurchaseInsuranceModal}>
						Purchase Insurance
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
