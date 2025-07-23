import React, {useState} from 'react';
import {Form, Field, ErrorMessage, Formik} from 'formik';

import {Link} from "react-router-dom";
import store from "../../../app/store";
import {signInUser} from "../../../slices/userSlice";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";
import SignInButtons from "./SignInButtons";


const LandlordSignInPage = ({}) => {

    const [errors, setErrors] = useState("")

    return (
        <div className="sign-in-page">

            <div className="sign-in-wrapper overlay-box">
                <div className="logo-block">
                    <a href="https://www.renterinsight.com" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight"/></a>
                </div>
                <h2><a className="btn-signin-form active">Sign In</a> / <Link to={insightRoutes.landlordSignUp()} className="btn-create-account">Create Account</Link></h2>

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

                        store.dispatch(signInUser({email: values.email, password: values.password}))
                            .then((action) => {

                                if (action.payload) {
                                    const response = action.payload.data

                                    console.log(response)
                                    setSubmitting(false);

                                   if (response.success) {
                                       // Reload the page to ensure we have all the right data
                                       document.location.href = document.location.href
                                   }
                                   else if (response.errors) {
                                       setErrors(response.errors.join(", "))
                                   }
                                }
                                else if (action.error) {
                                    setErrors("Invalid email/password combination")
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
                                <FormItem label="Email" name="email" type="email" />
                                <FormItem label="Password" name="password" type="password" />

                                <SignInButtons forgotPasswordRoute={insightRoutes.landlordForgotPassword()} isSubmitting={isSubmitting} />
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

        </div>

    )}

export default LandlordSignInPage;

