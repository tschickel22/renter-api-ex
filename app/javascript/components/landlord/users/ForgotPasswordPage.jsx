import React, {useState} from 'react';
import {Form, Field, ErrorMessage, Formik} from 'formik';

import store from "../../../app/store";
import {sendForgotPasswordInstructions, signInUser} from "../../../slices/userSlice";
import FormItem from "../../shared/FormItem";


const ForgotPasswordPage = ({}) => {

    const [errors, setErrors] = useState("")
    const [emailSent, setEmailSent] = useState(false)

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>

                <h2><a className="btn-signin-form active">Forgot Password</a></h2>

                {errors && <div className="text-error">{errors}</div>}

                {!emailSent && <Formik
                    initialValues={{ email: ''}}
                    validate={values => {
                        const errors = {};
                        if (!values.email) {
                            errors.email = 'Required';
                        } else if (
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                        ) {
                            errors.email = 'Invalid email address';
                        }
                        return errors;
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        setErrors("")

                        store.dispatch(sendForgotPasswordInstructions({email: values.email}))
                            .then((action) => {

                                    if (action.payload) {
                                        const response = action.payload.data

                                        console.log(response)
                                        setSubmitting(false);

                                        if (response.success) {
                                            // Reload the page to ensure we have all the right data
                                            setEmailSent(true)
                                        }
                                        else if (response.errors) {
                                            setErrors(response.errors.join(", "))
                                        }
                                    }
                                    else if (action.error) {
                                        setErrors("Unable to send instructions. Please try again")
                                        setSubmitting(false);
                                    }
                                },
                                () => {
                                    // Error!
                                    setErrors("Invalid Email / Password Combination")
                                    setSubmitting(false);
                                })
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="sign-in-form">
                                <p>Enter your email address below and we will email you password reset instructions.</p>
                                <FormItem label="Email" name="email" type="email" />

                                <button className="btn btn-red btn-signin-submit" type="submit" disabled={isSubmitting}>
                                    <span>Submit</span>
                                </button>
                                <a href={document.location.href.replace('forgot_password', '')} className="btn-forgot-password" style={{marginTop: "30px"}}>Go Back</a>
                            </div>
                        </Form>
                    )}
                </Formik>}

                {emailSent && <p style={{padding: "20px"}}>
                    We have emailed you instructions to reset your password.
                </p>}
            </div>

        </div>

    )}

export default ForgotPasswordPage;

