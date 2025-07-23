import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";
import Modal from "../../shared/Modal";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";

import StateDropdown from "../../shared/StateDropdown";
import {useSelector} from "react-redux";
import {loadLeaseResident, saveLeaseResident} from "../../../slices/leaseResidentSlice";

const ResidentEditModal = ({}) => {
    let params = useParams()
    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [leaseResident, setLeaseResident] = useState(null)
    const [lease, setLease] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        /*
           Load Resident
         */
        if (!leaseResident) {
            const results = await store.dispatch(loadLeaseResident({leaseResidentId: params.leaseResidentId})).unwrap()
            console.log(results)
            setLease(results.data.lease)
            setLeaseResident(results.data.lease_resident)
        }
    }, []);

    function closeModal() {
        navigate(-1)
    }

    return (
        <>
        {leaseResident &&
        <Modal closeModal={closeModal}>

            <h2>Edit info for {leaseResident.resident.first_name} {leaseResident.resident.last_name}</h2>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={leaseResident}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    let leaseResidentValues = {
                        hash_id: leaseResident.hash_id,
                        resident: {
                            id: leaseResident.resident.id,
                            first_name: values.resident.first_name,
                            last_name: values.resident.last_name,
                            email: values.resident.email,
                            phone_number: values.resident.phone_number
                        }
                    }

                    if (lease.status == constants.lease_statuses.former.key) {
                        leaseResidentValues.forwarding_street = values.forwarding_street
                        leaseResidentValues.forwarding_city = values.forwarding_city
                        leaseResidentValues.forwarding_state = values.forwarding_state
                        leaseResidentValues.forwarding_zip = values.forwarding_zip
                    }

                    try {
                        const result = await store.dispatch(saveLeaseResident({leaseResident: leaseResidentValues})).unwrap()
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
                                <FormItem label="Email" name="resident.email" type="email" />
                                <FormItem label="Phone" name="resident.phone_number" mask={insightUtils.phoneNumberMask()} />
                            </div>

                            <div className="form-row">
                                &nbsp;
                            </div>

                            {lease && lease.status == constants.lease_statuses.former.key && <>
                                <div className="form-row">
                                    <FormItem label="Forwarding Address" name="forwarding_street" optional={true} />
                                </div>

                                <div className="form-row">
                                    <FormItem label="City" name="forwarding_city" optional={true} />
                                    <FormItem label="State" name="forwarding_state" optional={true}>
                                        <StateDropdown name="forwarding_state"/>
                                    </FormItem>
                                    <FormItem label="Zip" name="forwarding_zip" mask={insightUtils.zipMask()} optional={true} />
                                </div>

                                <div className="form-row">
                                    &nbsp;
                                </div>
                            </>}

                            <div className="form-nav">
                                <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
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

export default ResidentEditModal;

