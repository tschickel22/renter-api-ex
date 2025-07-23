import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";
import Modal from "../../shared/Modal";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {deleteResidentVehicle, loadResidentVehicle, saveResidentVehicle} from "../../../slices/residentVehicleSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import {deleteResidentPet, loadResidentPet} from "../../../slices/residentPetSlice";

const ResidentVehicleEditModal = ({}) => {
    let params = useParams()
    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [residentVehicle, setResidentVehicle] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        /*
           Load ResidentVehicle
         */
        if (!residentVehicle) {
            if (params.residentId) {
                setResidentVehicle(Object.assign( insightUtils.emptyResidentVehicle(), {resident_id: params.residentId}))
            }
            else {
                const results = await store.dispatch(loadResidentVehicle({residentVehicleId: params.residentVehicleId})).unwrap()
                setResidentVehicle(results.data.resident_vehicle)
            }
        }
    }, []);

    async function confirmDeletion() {
        if (confirm('Are you sure you want to delete this vehicle record?')) {
            await store.dispatch(deleteResidentVehicle({residentVehicle: residentVehicle})).unwrap()
            closeModal()
        }
    }


    function closeModal() {
        navigate(-1)
    }

    return (
        <>
        {residentVehicle &&
        <Modal extraClassName="overlay-box-small" closeModal={closeModal}>

            <h2>{residentVehicle.id ? <>Edit Vehicle Info</> : <>Add Vehicle</>}</h2>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={residentVehicle}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    try {
                        const result = await store.dispatch(saveResidentVehicle({residentVehicle: values})).unwrap()
                        const response = result.data

                        console.log(response)

                        setSubmitting(false);

                        if (response.success) {
                            closeModal()
                        }
                        else if (response.errors) {
                            setErrors(response.errors)

                            if (response.errors.base) {
                                setBaseErrorMessage(response.errors.base)
                            }

                            insightUtils.scrollTo('errors')
                        }
                    }
                    catch(err) {
                        console.log("UH-OH", err)
                        setBaseErrorMessage("Unable to save resident vehicle")
                        setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="add-property-wrap">

                            <div className="form-row">
                                <FormItem label="Make" name="make" />
                                <FormItem label="Model" name="model" />
                            </div>

                            <div className="form-row">
                                <FormItem label="Year" name="year" optional={true} />
                                <FormItem label="License Plate" name="plate_number" optional={true} />
                            </div>

                            <div className="form-row">
                                <FormItem label="Color" name="color" optional={true} />
                                <FormItem label="Parking Spot #" name="parking_spot" optional={true} />
                            </div>

                            <div className="form-row">
                                &nbsp;
                            </div>

                            <div className="form-nav">
                                <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                {residentVehicle.id && <a onClick={confirmDeletion} className="btn btn-gray"><span>Delete</span></a>}
                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
        }
        </>
    )}

export default ResidentVehicleEditModal;

