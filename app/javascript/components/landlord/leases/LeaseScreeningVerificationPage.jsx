import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";
import {Link, useNavigate, useParams} from "react-router-dom";

import insightRoutes from "../../../app/insightRoutes";
import {client} from "../../../app/client";

import {ErrorMessage, Field, FieldArray, Form, Formik} from "formik";
import ResidentFormRow from "./ResidentFormRow";
import ResidentPetsForm from "./ResidentPetsForm";
import ResidentResidenceHistoryForm from "./ResidentResidenceHistoryForm";
import ResidentEmploymentHistoryForm from "./ResidentEmploymentHistoryForm";
import ResidentIncomeForm from "./ResidentIncomeForm";
import ResidentContactEmergencyForm from "./ResidentContactEmergencyForm";
import ResidentContactReferenceForm from "./ResidentContactReferenceForm";
import ResidentVehiclesForm from "./ResidentVehiclesForm";
import ResidentIdentificationForm from "./ResidentIdentificationForm";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {checkValidationAnswers, loadValidationQuestions, saveLeaseResident} from "../../../slices/leaseResidentSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {signOutUser} from "../../../slices/userSlice";

const LeaseScreeningVerificationPage = ({baseLease, setBaseLease, baseLeaseResident, setBaseLeaseResident}) => {

    const { constants } = useSelector((state) => state.company)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [verificationAttemptCount, setVerificationAttemptCount] = useState(99)
    const [verificationExam, setVerificationExam] = useState(null)
    const [authenticationAnswers, setAuthenticationAnswers] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(() => {
        insightUtils.scrollTo('top')
    }, []);

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            populateLease(baseLease, baseLeaseResident)

        }

    }, [baseLease, baseLeaseResident]);

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            // First time through?
            loadVerificationExam(baseLeaseResident)
        }

    }, [!!baseLease && !!baseLeaseResident]);

    function populateLease(l, lr) {
        setLease(Object.assign({}, l))
        setLeaseResident(Object.assign({}, lr))
        setVerificationAttemptCount(lr.verification_attempt_count || 0)
    }

    async function loadVerificationExam(baseLeaseResident) {
        const results = await store.dispatch(loadValidationQuestions({leaseResidentId: baseLeaseResident.hash_id})).unwrap()
        console.log(results)

        // Is this applicant already verified? If so, move on
        // THIS IS SOME TU-SPECIFIC CODE... Don't love it.
        if (results.data.verification_status == "Verified") {

            let prevBaseLeaseResident = Object.assign({}, baseLeaseResident)
            prevBaseLeaseResident.external_screening_status = "ReadyForReportRequest"
            setBaseLeaseResident(prevBaseLeaseResident)
        }
        else if (results.data.verification_status == "Unverified - No Questions") {
            // Just show them the message that will force them to call TU
            setVerificationAttemptCount(99)
        }
        else {

            let newAuthenticationAnswers = {}

            if (results.data.verification_exam) {
                results.data.verification_exam.authenticationQuestions.forEach((question) => {
                    newAuthenticationAnswers[question.questionKeyName] = ""
                })

                setVerificationExam(results.data.verification_exam)
            }

            setAuthenticationAnswers(newAuthenticationAnswers)
        }

    }

    function prepareForRadioButtonGroup(choices) {
        let newChoices = {}

        choices.forEach((choice) => {
            newChoices[choice.choiceKeyName] = {key: choice.choiceKeyName, value: choice.choiceDisplayName}
        })

        return newChoices
    }

    function handleSignOut() {
        store.dispatch(signOutUser())
    }

    return (
        <>
            {lease && leaseResident && <>

                {!verificationAttemptCount || verificationAttemptCount < 99 ?
                <>
                    {!verificationExam && <>
                        <div className="section-table-wrap">
                            <div className="add-property-wrap">

                                <h2 title={leaseResident.external_screening_id}>Identity Verification</h2>

                                <p>Loading verification questions...</p>
                            </div>
                        </div>
                    </>}

                    {verificationExam && <div className="section-table-wrap">

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={{ answers: authenticationAnswers}}
                        enableReinitialize={true}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            /*
                               Check Answers
                             */

                            setBaseErrorMessage("")

                            try {
                                const result = await store.dispatch(checkValidationAnswers({leaseResidentId: leaseResident.hash_id, examId: verificationExam.examId, answers: values.answers})).unwrap()
                                const response = result.data

                                console.log(response)

                                setSubmitting(false);

                                if (response.success) {
                                    setLease(null)
                                    setLeaseResident(null)

                                    setBaseLease(response.lease)
                                    setBaseLeaseResident(response.lease_resident)
                                }
                                else if (response.errors) {
                                    setErrors({lease_resident: response.errors})
                                    setVerificationAttemptCount(response.verification_attempt_count || 0)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    setVerificationExam(null)
                                    setAuthenticationAnswers(null)

                                    loadVerificationExam(baseLeaseResident)

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            catch(err) {
                                setBaseErrorMessage("Unable to save verification information: " + (err || ""))
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">

                                    <h2 title={leaseResident.external_screening_id}>Identity Verification</h2>

                                    {verificationExam.authenticationQuestions && verificationExam.authenticationQuestions.map((question, index) => (
                                        <div key={index}>
                                            <div className="form-row">
                                                <div className="flex-column form-item">
                                                    <label>{question.questionDisplayName}</label>
                                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                    <RadioButtonGroup name={`answers.${question.questionKeyName}`} options={prepareForRadioButtonGroup(question.choices)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="form-row">
                                        <div className="st-col-50 st-col-md-100 form-nav flex-right">
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                {isSubmitting && <span>Submitting...</span>}
                                                {!isSubmitting && <span>Verify Identity &gt;</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {false && <pre>{JSON.stringify(values)}</pre>}
                            </Form>
                        )}
                    </Formik>




                </div>}
                </>
                :
                <>
                    <div className="add-property-wrap">

                        <h2>Unable to Verify Your Identity</h2>
                        <h3>TransUnion&trade; Application ID <strong>{leaseResident.external_screening_id}</strong></h3>
                        <p>Your identity could not be verified. Please call TransUnion&trade; to verify your identity over the phone at 833-458-6338. If your identity can be verified over the phone, your reports will be updated in your application and your landlord will be notified.</p>
                        <a className="btn btn-red" onClick={handleSignOut}>Log Out</a>
                    </div>
                </>}
            </>
            }
        </>

    )}

export default LeaseScreeningVerificationPage;

