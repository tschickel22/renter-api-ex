import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom'
import {Form, Formik} from "formik";
import Modal from "../shared/Modal";
import FormItem from "../shared/FormItem";
import insightUtils from "../../app/insightUtils";
import store from "../../app/store";
import {loadResident, saveResident} from "../../slices/residentSlice";

const RenterProfileEditModal = ({}) => {

    let navigate = useNavigate()

    const [resident, setResident] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        /*
           Load Resident
         */
        if (!resident) {
            const results = await store.dispatch(loadResident({residentId: "my"})).unwrap()
            setResident(results.data.resident)
        }
    }, []);

    function closeModal() {
        navigate(-1)
    }

    return (
        <>
        {resident &&
        <Modal extraClassName="overlay-box-small" closeModal={closeModal}>

            <h2>Edit Profile</h2>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={resident}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    try {
                        const result = await store.dispatch(saveResident({resident: values})).unwrap()
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
                                <FormItem label="First Name" name="first_name" />
                                <FormItem label="Last Name" name="last_name" />
                            </div>

                            <div className="form-row">
                                <FormItem label="Email" name="email" type="email" />
                                <FormItem label="Phone" name="phone_number" mask={insightUtils.phoneNumberMask()} />
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
        }
        </>
    )}

export default RenterProfileEditModal;

