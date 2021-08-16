import React from 'react'
import { useForm } from 'react-hook-form'
import {
	Card,
	CardBody,
	Button,
	Modal,
	InputGroup,
	Form,
	Input,
} from 'reactstrap'

const styles = {
	button_modal: {
		fontSize: '16px',
		paddingTop: '15px',
	},
	button_close: {
		marginBottom: '15px',
	},
}

export default function AddAirlines({ isOpen, toggle, handleAddAirline }) {
	const { register, handleSubmit, reset } = useForm()

	function onSubmit(airline) {
		reset()
		toggle(false)
		handleAddAirline(airline.name, airline.address)
	}

	return (
		<Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card className=' card-login card-plain'>
					<div className='modal-header justify-content-center'>
						<button
							aria-label='Close'
							className=' close'
							data-dismiss='modal'
							type='button'
							onClick={() => toggle(!isOpen)}>
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
							Add Airline
						</Button>
					</div>
				</Card>
			</Form>
		</Modal>
	)
}
