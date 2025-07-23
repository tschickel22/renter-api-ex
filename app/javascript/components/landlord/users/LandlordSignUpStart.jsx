import React, {useState} from 'react';
import {Form, Field, ErrorMessage, Formik} from 'formik';

import {Link} from "react-router-dom";
import {client} from "../../../app/client";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {createUser} from "../../../slices/userSlice";


const LandlordSignUpStart = ({}) => {
    let query = insightUtils.useQuery()

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [emailSent, setEmailSent] = useState(false)

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>
                <h2><Link to={insightRoutes.landlordSignIn()} className="btn-signin-form">Sign In</Link> / <a className="btn-create-account active">Create Account</a></h2>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={{ first_name: '',last_name: '',email: '', password: '', company_name: '', cell_phone: '', number_of_units: '', agreement: '' }}
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

                        if (!values.company_name) {
                            errors.company_name = 'Required';
                        }

                        if (!values.number_of_units) {
                            errors.number_of_units = 'Required';
                        }

                        if (!values.cell_phone) {
                            errors.cell_phone = 'Required';
                        }

                        if (!values.password) {
                            errors.password = 'Required';
                        }

                        if (!values.agreement) {
                            errors.agreement = 'You must read and agree';
                        }


                        return errors;
                    }}
                    onSubmit={async (values, { setSubmitting, setErrors }) => {
                        setBaseErrorMessage("")
                        let zc_gad = document.getElementById('zc_gad')

                        values.user_type = "company_admin"
                        values.zc_gad = zc_gad['value']
                        values.affiliate_click_code = insightUtils.parseParam(atob(query.get('coming_from')), 'irclickid')

                        try {
                            const results = await store.dispatch(createUser({user: values})).unwrap()
                            const response = results.data

                            setSubmitting(false);

                            if (response.success) {
                                // Update CSRF token
                                document.querySelector('meta[name="csrf-token"]').content = response.new_csrf

                                setEmailSent(true)
                            }
                            else if (response.errors) {
                                setErrors(response.errors)

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base.join(", "))
                                }
                            }
                        }
                        catch {
                            setBaseErrorMessage("Unable to create account. Please try again.")
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="create-account-form">
                                <div className="ca-steps-container">
                                    <p className="text-center">Create your Renter Insight Account - It's Free!</p>

                                    {!emailSent &&
                                        <div className="ca-step ca-step-1">
                                            <div className="form-row">
                                                <FormItem label="First Name" name="first_name" />
                                                <FormItem label="Last Name" name="last_name" />
                                            </div>

                                            <div className="form-row">
                                                <FormItem label="Company Name" name="company_name" />
                                                <FormItem label="Number of Units" name="number_of_units" />
                                                <FormItem label="Cell Phone" name="cell_phone" mask={insightUtils.phoneNumberMask()} />
                                            </div>

                                            <div className="form-row">
                                                <FormItem label="Business Email" name="email" type="email" />
                                                <FormItem label="Create Password" name="password" type="password" />
                                            </div>

                                            <div>
                                                <p className="text-center text-red"><strong>If you are a renter, contact your landlord for a resident portal invite.</strong></p>
                                            </div>

                                            <div className="ca-nav">
                                                <FormItem label={<>I have read and accept Renter Insight's <a href="https://www.renterinsight.com/termsofuse" target="_blank">Terms of Use</a> and <a href="https://www.renterinsight.com/privacypolicy" target="_blank">Privacy Policy</a></>} name="agreement" type="checkbox" avoidCheckBoxLabelAutoClick={true} optional={true} />
                                                <button className="btn btn-red btn-ca-step1-next" type="submit" disabled={isSubmitting}>
                                                    {!isSubmitting && <span>Submit <i className="fas fa-chevron-right"></i></span>}
                                                    {isSubmitting && <span>Submitting...</span>}
                                                </button>
                                            </div>

                                            <input type="hidden" id="zc_gad" name="zc_gad" value="" />

                                        </div>
                                    }

                                    {emailSent &&
                                        <div className="ca-step">
                                            <p className="text-center"><strong>An email has been sent to you to complete the set up.</strong></p>
                                            <img src="https://ct.capterra.com/capterra_tracker.gif?vid=2228595&vkey=a1da03785b99a75dd21e5a376d455a6f" />
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






            </div>

        </div>

    )}

export default LandlordSignUpStart;

