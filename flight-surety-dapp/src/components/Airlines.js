import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	Container,
	Card,
	CardBody,
	CardTitle,
	Button,
	Alert,
	Table,
	Modal,
	ModalBody,
	ModalFooter,
	InputGroup,
	InputGroupAddon,
	InputGroupText,
	Form,
	Input,
} from 'reactstrap'

const styles = {
	card_title: {
		fontSize: '24px',
		marginBottom: '20px',
	},
	button_action: {
		marginRight: '10px',
	},
	button_modal: {
		fontSize: '16px',
		paddingTop: '15px',
	},
}

export default function Airlines({ firstAirline }) {
	const [modalAirline, setModalAirline] = React.useState(false)
	const { register, handleSubmit, reset } = useForm()

	function onSubmit(data) {
		setModalAirline(false)
		console.log(data)
	}

	function ModalAddAirline() {
		return (
			<Modal
				isOpen={modalAirline}
				toggle={() => setModalAirline(!modalAirline)}>
				<Card className=' card-login card-plain'>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<div className=' modal-header justify-content-center'>
							<button
								aria-label='Close'
								className=' close'
								data-dismiss='modal'
								type='button'
								onClick={() => setModalAirline(!modalAirline)}>
								<span aria-hidden={true}>×</span>
							</button>
						</div>
						<div className='modal-body'>
							<CardBody>
								<InputGroup>
									<Input
										name='name'
										placeholder='Airline Name'
										type='text'
										{...register('name')}
									/>
								</InputGroup>
								<InputGroup>
									<Input
										name='address'
										placeholder='Airline Address'
										type='text'
										{...register('address')}
									/>
								</InputGroup>
							</CardBody>
						</div>
						<div className='modal-footer text-center'>
							<Button
								type='submit'
								block
								className='btn-neutral btn-round'
								style={styles.button_modal}
								color='primary'>
								Register Airline
							</Button>
						</div>
					</Form>
				</Card>
			</Modal>
		)
	}

	return (
		<>
			<ModalAddAirline />
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
							<tr className='text-left'>
								<td className='text-center'>1</td>
								<td>{firstAirline.name}</td>
								<td>{firstAirline.address}</td>
								<td>Registered</td>
								<td className='td-actions text-right'>
									<Button
										style={styles.button_action}
										color='primary'
										type='button'>
										Fund
									</Button>
									<Button className='text-center' color='primary' type='button'>
										Vote
									</Button>
								</td>
							</tr>
						</tbody>
					</Table>
					<Button
						className='text-center'
						color='primary'
						onClick={() => setModalAirline(true)}>
						Register Airline
					</Button>
				</CardBody>
			</Card>
		</>
	)
}
