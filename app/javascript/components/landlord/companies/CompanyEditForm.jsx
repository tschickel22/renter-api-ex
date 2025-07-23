import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom'

import {Form, Formik} from "formik";
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import {saveCompany} from "../../../slices/companySlice";
import store from "../../../app/store";
import StateDropdown from "../../shared/StateDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import BasicDropdown from "../../shared/BasicDropdown";
import insightRoutes from "../../../app/insightRoutes";

const CompanyEditForm = ({mode, closeModal}) => {
    const navigate = useNavigate()

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    const { currentCompany, constants } = useSelector((state) => state.company)
    const [company, setCompany] = useState(null)
    const [editingTaxId, setEditingTaxId] = useState(false)

    useEffect(() => {
        if (currentCompany) {
            let newCompany = {...currentCompany}

            if ([constants.tax_reporting_onboard_statuses.started.key, constants.tax_reporting_onboard_statuses.pending.key].includes(newCompany.tax_reporting_onboard_status)) {
                newCompany.generate_1099 = true
            }

            setCompany(newCompany)
        }
    }, [currentCompany])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        let companyValues = Object.assign({}, values)

        companyValues.company_action = mode

        store.dispatch(saveCompany({company: companyValues}))
            .then((action) => {
                    const response = action.payload.data
                    console.log(response)

                    setSubmitting(false);

                    if (response.success) {
                        // Special situation here... are continuing on to activate 1099?
                        if (companyValues.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.started.key && response.company.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.pending.key) {
                            navigate(insightRoutes.taxReportingList())
                        }
                        // Special situation here... are we done activating 1099?
                        else if (companyValues.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.pending.key && response.company.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.completed.key) {
                            navigate(insightRoutes.taxReportingList())
                        }
                        else {
                            closeModal()
                        }
                    }
                    else if (response.errors) {
                        setErrors(response.errors)

                        if (response.errors.base) {
                            setBaseErrorMessage(response.errors.base)
                        }

                        insightUtils.scrollTo('errors')
                    }

                },
                () => {
                    // Error!
                    setBaseErrorMessage("Unable to activate screening")
                    setSubmitting(false);
                })
    }

    return (
        <>
            <div className="section">
            {mode == "screening-activation" && <>
                <h2>Activate Screening</h2>
                <p>Use this form to activate screening. First, confirm your company's information is correct, then click Continue.</p>
            </>}

            {mode != "screening-activation" && <>
                <h2>Manage Account</h2>
                <p>Use this form to update your company information.</p>
            </>}

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                {company &&
                <Formik
                    initialValues={company}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div>
                                <div className="form-row">
                                    <FormItem label="Company Name (Legal Name)" name="name"/>
                                    <FormItem label="DBA (if different)" name="legal_business_dba" optional={true}/>
                                    <FormItem label="Account Number" name="hash_id" optional={true}>
                                        <div className="form-value">{currentCompany.hash_id}</div>
                                    </FormItem>
                                </div>

                                <div className="form-row">
                                    <FormItem label="Cell Phone" name="cell_phone" mask={insightUtils.phoneNumberMask()}/>
                                </div>

                                <h3 className="text-left">Shipping Address</h3>
                                <div className="form-row">
                                    <FormItem label="Address" name="street" optional={true}/>
                                    <FormItem label="Address Line 2" name="street_2" optional={true}/>
                                    <FormItem label="City" name="city" optional={true}/>
                                    <FormItem label="State" name={`state`} optional={true}>
                                        <StateDropdown name={`state`}/>
                                    </FormItem>
                                    <FormItem label="Zip" name="zip" mask={insightUtils.zipMask()} optional={true}/>
                                </div>

                                {mode != "screening-activation" && <>
                                    <div className="form-row">
                                        <FormItem formItemClass="form-item-100" label="Bill to Address: Use same as shipping address" name="billing_same_as_shipping" type="checkbox"/>
                                    </div>

                                    {!values.billing_same_as_shipping && <>
                                        <h3 className="text-left">Billing Address</h3>
                                        <div className="form-row">
                                            <FormItem label="Address" name="billing_street" optional={true}/>
                                            <FormItem label="Address Line 2" name="billing_street_2" optional={true}/>
                                            <FormItem label="City" name="billing_city" optional={true}/>
                                            <FormItem label="State" name={`billing_state`} optional={true}>
                                                <StateDropdown name={`billing_state`}/>
                                            </FormItem>
                                            <FormItem label="Zip" name="billing_zip" mask={insightUtils.zipMask()} optional={true}/>
                                        </div>
                                    </>
                                    }

                                    {company.tax_reporting_onboard_status && <>
                                        <h3 className="text-left">1099</h3>
                                        <div className="form-row">
                                            <FormItem formItemClass="form-item-100" label="Generate 1099 (if payments over IRS standard)?" name="generate_1099" type="checkbox"/>
                                        </div>
                                        <div className="form-row">
                                            <FormItem label="" formItemClass="form-item-15" name={`tax_id_type`} optional={!values.generate_1099}>
                                                <RadioButtonGroup name={`tax_id_type`} direction="row" options={[{id: "ein", name: "EIN"}, {id: "ssn", name: "SSN"}]}/>
                                            </FormItem>
                                            {currentCompany.tax_id && !editingTaxId &&
                                                <FormItem label="" formItemClass="form-item-25" name="tax_id">
                                                    <div className="form-value">{currentCompany.tax_id_masked}&nbsp;&nbsp;&nbsp;<a onClick={() => setEditingTaxId(true)}>Edit</a></div>
                                                </FormItem>
                                            }
                                            {(!currentCompany.tax_id || editingTaxId) &&
                                                <FormItem label="" formItemClass="form-item-25" name="tax_id" optional={!values.generate_1099} mask={values.tax_id_type == "ssn" ? insightUtils.ssnMask() : insightUtils.einMask()} placeholder="Enter Tax ID"/>
                                            }
                                        </div>
                                        {[constants.tax_reporting_onboard_statuses.pending.key, constants.tax_reporting_onboard_statuses.completed.key].includes(company.tax_reporting_onboard_status) &&
                                            <div className="form-row">
                                                <FormItem label="Nelco Email" name="nelco_username" />
                                                <FormItem label="Nelco Password" name="nelco_password" type="password" />
                                            </div>
                                        }
                                    </>}
                                </>}

                                <div className="form-nav">
                                    <a onClick={() => closeModal()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{isSubmitting ? "Submitting..." : (mode == "screening-activation" ? "Continue" : "Save")}</span>
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
                }
            </div>
        </>
    )
}

export default CompanyEditForm;

