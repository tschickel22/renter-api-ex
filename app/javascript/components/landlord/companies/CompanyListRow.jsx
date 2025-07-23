import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {activateCompanyForPayments} from "../../../slices/companySlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import Modal from "../../shared/Modal";
import {Field, Form, Formik} from "formik";
import {saveCommunication} from "../../../slices/communicationSlice";
import FormItem from "../../shared/FormItem";


const CompanyListRow = ({company, handlePaymentsActivation}) => {

    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [rowMenuOpen, setRowMenuOpen] = useState(false)
    const [activatingPayments, setActivatingPayments] = useState(false)


    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-30 st-first-col">
                        {company.name}
                    </div>
                    <span className="st-col-25">
                        {company.external_screening_id ? "Activated" : "Not Activated"}
                    </span>
                    <span className="st-col-25">
                        {insightUtils.getLabel(company.payments_onboard_status, constants.payment_onboarding_statuses)}
                    </span>
                    <span className="st-nav-col">
                        <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            {company.payments_onboard_status == constants.payment_onboarding_statuses.submitted.key && <li onClick={()=>{setRowMenuOpen(false); setActivatingPayments(true) }}><i className="fal fa-file-search"></i> Activate for Payments</li>}
                            <li onClick={()=>{setRowMenuOpen(false); navigate(insightRoutes.companyHistory(company.hash_id)) }}><i className="fal fa-history"></i> View History</li>
                        </RowMenu>
                    </span>
                </div>
            </div>

            {activatingPayments &&
                <Modal closeModal={() => setActivatingPayments(false)}>
                    <h2>Activate {company.name} for Payments</h2>
                    <p>Enter the Zego ID below:</p>

                    <Formik
                        initialValues={company}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setBaseErrorMessage("")

                            try {
                                const results = await store.dispatch(activateCompanyForPayments({company: values})).unwrap()
                                const response = results.data

                                console.log(response)
                                setSubmitting(false);

                                if (response.success) {
                                    handlePaymentsActivation()
                                    setActivatingPayments(null)
                                } else if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base.join(", "))
                                    }
                                }
                            }
                            catch(e) {
                                console.log(e)
                                setBaseErrorMessage("Cannot send message")
                            }
                            finally {
                                setSubmitting(false)
                            }
                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form style={{width: "100%"}}>
                                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                <div className="form new-resident-form">
                                    <FormItem label="Zego ID" name="external_payments_id" />

                                    <div className="form-nav">
                                        <div onClick={() => setActivatingPayments(null)} className="btn btn-gray"><span>Cancel</span></div>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Activate" : "Activate..."}</span>
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Modal>
            }
        </>

    )}

export default CompanyListRow;

