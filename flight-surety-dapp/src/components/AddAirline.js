import React from 'react'
import { useForm } from 'react-hook-form'
import {
	Card,
	CardBody,
	Button,
	Modal,
	Form,
	Input,
	Label,
	FormGroup,
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

export default function AddAirlines({
	isOpen,
	toggle,
	handleAddAirline,
	accounts,
}) {
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
							<FormGroup>
								<Label for='name'>Airline Name</Label>
								<Input
									type='text'
									name='name'
									placeholder='Airline Name'
									{...register('name')}
								/>
							</FormGroup>
							<FormGroup>
								<Label for='address'>Airline Address</Label>
								<Input
									type='text'
									name='address'
									placeholder='Airline Address'
									{...register('address')}
								/>
							</FormGroup>
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
