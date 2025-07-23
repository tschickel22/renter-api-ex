import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";
import Modal from "../../shared/Modal";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {loadResident, saveResident} from "../../../slices/residentSlice";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";
import {useSelector} from "react-redux";

const ResidentAddModal = ({}) => {
    let params = useParams()
    let navigate = useNavigate()
    const { constants } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    function closeModal() {
        navigate(-1)
    }

    return (
        <Modal extraClassName="overlay-box-small" closeModal={closeModal}>

            <h2>Add {params.leaseResidentType == "LeaseResidentOccupant" ? "Occupant" : "Applicant"}</h2>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={Object.assign( insightUtils.emptyLeaseResident(), {type: params.leaseResidentType, lease_hash_id: params.leaseId})}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    try {
                        values.current_step = params.leaseResidentType == "LeaseResidentOccupant" ? null : constants.lease_resident_steps.invitation.key

                        const result = await store.dispatch(saveLeaseResident({leaseResident: values})).unwrap()
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
                        setBaseErrorMessage("Unable to save resident")
                        setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="add-property-wrap">

                            <div className="form-row">
                                <FormItem label="First Name" name="resident.first_name" />
                                <FormItem label="Last Name" name="resident.last_name" />
                            </div>

                            <div className="form-row">
                                <FormItem label="Email" name="resident.email" type="email" optional={params.leaseResidentType == "LeaseResidentOccupant"} />
                                <FormItem label="Phone" name="resident.phone_number" mask={insightUtils.phoneNumberMask()} optional={true} />
                            </div>

                            <div className="form-row">
                                &nbsp;
                            </div>

                            <div className="form-nav">
                                <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    )}

export default ResidentAddModal;

