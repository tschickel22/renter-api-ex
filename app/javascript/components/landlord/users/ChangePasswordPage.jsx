import React, {useState} from 'react';
import {Form, Formik} from 'formik';

import {useSearchParams} from "react-router-dom";

import store from "../../../app/store";
import {savePassword} from "../../../slices/userSlice";

import FormItem from "../../shared/FormItem";


const ChangePasswordPage = ({}) => {

    const [searchParams, _setSearchParams] = useSearchParams()

    const [errors, setErrors] = useState("")

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>

                <h2><a className="btn-signin-form active">Change Password</a></h2>

                {errors && <div className="text-error">{errors}</div>}

                <Formik
                    initialValues={{ password: '', password_confirmation: '' }}
                    validate={values => {
                        const errors = {};
                        if (!values.password) {
                            errors.password = 'Required';
                        }
                        else if (!values.password_confirmation) {
                            errors.password_confirmation = 'Required';
                        }
                        return errors;
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        setErrors("")

                        store.dispatch(savePassword({password: values.password, passwordConfirmation: values.password_confirmation, resetPasswordToken: searchParams.get('reset_password_token')}))
                            .then((action) => {

                                    if (action.payload) {
                                        const response = action.payload.data

                                        setSubmitting(false);

                                        if (response.success) {
                                            // Reload the page to ensure we have all the right data
                                            document.location.href = '/dashboard?password-reset=true'
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
                                <p>Enter your new password below:</p>
                                <FormItem label="Password" name="password" type="password" />
                                <FormItem label="Confirm Password" name="password_confirmation" type="password" />

                                <button className="btn btn-red btn-signin-submit" type="submit" disabled={isSubmitting}>
                                    <span>Change Password</span>
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>

            </div>
        </div>

    )}

export default ChangePasswordPage;

