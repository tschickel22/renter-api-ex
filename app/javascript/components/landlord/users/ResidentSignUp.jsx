import React, {useEffect, useState} from 'react';
import {Form, Formik} from 'formik';

import {useParams} from "react-router-dom";
import {client} from "../../../app/client";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";
import store from "../../../app/store";
import {loadLeaseResident} from "../../../slices/leaseResidentSlice";
import {useSelector} from "react-redux";


const ResidentSignUp = ({}) => {

    let params = useParams();

    const { constants } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [accountCreated, setAccountCreated] = useState(false)
    const [lease, setLease] = useState(null)
    const [resident, setResident] = useState(null)

    useEffect(async ()  => {
        const results = await store.dispatch(loadLeaseResident({leaseResidentId: params.leaseResidentId})).unwrap()
        let newResident = Object.assign({}, results.data.lease_resident.resident)
        newResident.password = ""

        setResident(newResident)
        setLease(results.data.lease)
    }, []);

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>
                <h2><a className="btn-create-account active">Create Account</a></h2>

                {lease && <>
                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={resident}
                    validate={values => {
                        const errors = {};

                        if (!values.email) {
                            errors.email = 'Required';
                        }
                        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                            errors.email = 'Invalid email address';
                        }

                        if (!values.first_name) {
                            errors.first_name = 'Required';
                        }

                        if (!values.last_name) {
                            errors.last_name = 'Required';
                        }

                        if (!values.password) {
                            errors.password = 'Required';
                        }

                        return errors
                    }}
                    onSubmit={(values, { setSubmitting, setErrors }) => {
                        setBaseErrorMessage("")

                        values.user_type = "resident"

                        client.post("/users", {user: values, lease_id: lease.hash_id, resident_id: resident.hash_id})
                            .then((response) => {
                                    setSubmitting(false);

                                    if (response.success) {
                                        // Update CSRF token
                                        document.querySelector('meta[name="csrf-token"]').content = response.new_csrf

                                        setAccountCreated(true)
                                    }
                                    else if (response.errors) {
                                        setErrors(response.errors)

                                        if (response.errors.base) {
                                            setBaseErrorMessage(response.errors.base.join(", "))
                                        }
                                    }
                                },
                                () => {
                                    // Error!
                                    setBaseErrorMessage("Unable to create account. Please try again.")
                                    setSubmitting(false);
                                })
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="create-account-form">
                                <div className="ca-steps-container">


                                    {!accountCreated &&
                                        <>
                                            <p className="text-center">Create your Renter Insight Account - It's Free!</p>

                                            <div className="ca-step ca-step-1">
                                                <div className="form-row">
                                                    <FormItem label="First Name" name="first_name" />
                                                    <FormItem label="Last Name" name="last_name" />
                                                </div>

                                                <div className="form-row">
                                                    <FormItem label="Email" name="email" type="email" />
                                                    <FormItem label="Create Password" name="password" type="password" />
                                                </div>

                                                <div className="ca-nav">
                                                    <button className="btn btn-red btn-ca-step1-next" type="submit" disabled={isSubmitting}>
                                                        <span>Next <i className="fas fa-chevron-right"></i></span>
                                                    </button>
                                                </div>

                                            </div>
                                        </>
                                    }

                                    {accountCreated &&
                                        <div className="ca-step">
                                            {[constants.lease_statuses.renewing.key, constants.lease_statuses.future.key, constants.lease_statuses.current.key].indexOf(lease.status) >= 0 ?
                                                <>
                                                    <p className="text-center">
                                                        Congratulations! Your Renter Insight account has been created.  Click the link below to access the portal:
                                                    </p>
                                                    <a className="btn btn-red" href={insightRoutes.renterLeaseShow(lease.hash_id)}>
                                                        <span>Continue &gt;</span>
                                                    </a>
                                                </>
                                                :
                                                <>
                                                    <p className="text-center">
                                                        Congratulations! Your Renter Insight account has been created.  Click the link below to continue the application process:
                                                    </p>
                                                    <a className="btn btn-red" href={insightRoutes.residentApplicationEdit(params.leaseResidentId)}>
                                                        <span>Continue &gt;</span>
                                                    </a>
                                                </>
                                            }
                                            <br/><br/>
                                        </div>
                                    }

                                </div>

                                <div className="footer-buffer">
                                    <div className="footer-block"></div>
                                    <div className="footer-block"></div>
                                </div>

                            </div>
                        </Form>
                    )}
                </Formik>

                </>}

                {!lease && <>Loading...</>}




            </div>

        </div>

    )}

export default ResidentSignUp;

