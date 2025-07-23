import React, {useState} from 'react';
import {Form, Field, ErrorMessage, Formik} from 'formik';

import {Link} from "react-router-dom";
import {client} from "../../../app/client";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";
import SignInButtons from "./SignInButtons";


const ResidentSignInPage = ({}) => {

    const [errors, setErrors] = useState("")

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>
                <h2><a className="btn-signin-form active">Sign In</a></h2>

                {errors && <div className="text-error">{errors}</div>}

                <Formik
                    initialValues={{ email: '', password: '' }}
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

                        client.post("/users/sign_in", {user: values})
                            .then((response) => {
                               console.log(response)
                                setSubmitting(false);

                               if (response.success) {
                                   // Reload the page to ensure we have all the right data
                                   document.location.href = document.location.href
                               }
                               else if (response.errors) {
                                   setErrors(response.errors.join(", "))
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
                                <FormItem label="Email" name="email" type="email" />
                                <FormItem label="Password" name="password" type="password" />

                                <SignInButtons forgotPasswordRoute={insightRoutes.residentForgotPassword()} isSubmitting={isSubmitting} />

                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

        </div>

    )}

export default ResidentSignInPage;

