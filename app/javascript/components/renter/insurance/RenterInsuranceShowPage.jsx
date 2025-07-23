import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadInsurance} from "../../../slices/insuranceSlice";
import insightRoutes from "../../../app/insightRoutes";

import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";

import {Form, Formik} from "formik";
import {useSelector} from "react-redux";
import InsuranceDeclarationsView from "./InsuranceDeclarationsView";
import {loadLease} from "../../../slices/leaseSlice";

const RenterInsuranceShowPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { constants } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [insurance, setInsurance] = useState(null)
    const [lease, setLease] = useState(null)

    useEffect(async () => {

        const leaseResults = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

        setLease(leaseResults.data.lease)

        const results = await store.dispatch(loadInsurance({leaseId: params.leaseId})).unwrap()

        console.log(results)

        let newInsurance = null

        if (results.data){
            newInsurance = Object.assign({}, insightUtils.findActiveInsurance(results.data.insurances))
            newInsurance.effective_on = insightUtils.parseDate(newInsurance.effective_on)
            newInsurance.expires_on = insightUtils.parseDate(newInsurance.expires_on)
        }

        setInsurance(newInsurance)

    }, [])

    function closeView() {
        navigate(insightRoutes.renterLeaseShow(params.leaseId))
    }

    return (
        <>
            <div className="section">
                {insurance && insurance.api_partner_id == constants.env.insurance_api_partner_msi && <>
                    <h2>Policy Confirmation</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={insurance}
                    >
                        {({ values }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Policy Information</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Policy Number" name="policy_number" type="read-only" />
                                            <FormItem label="Policy Effective Date" name="effective_on">
                                                <div className="text-left">{insightUtils.formatDate(values.effective_on)}</div>
                                            </FormItem>
                                            <FormItem label="Policy Expiration Date" name="expires_on">
                                                <div className="text-left">{insightUtils.formatDate(values.expires_on)}</div>
                                            </FormItem>
                                        </div>
                                    </div>

                                    <hr/>

                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Insurance Company Name" name="insurance_company_name" type="read-only" />
                                            <FormItem label="Insured Property Address" name="insured_property_address">
                                                <div className="text-left">{lease.unit.full_address}</div>
                                            </FormItem>
                                        </div>
                                    </div>

                                    <hr/>

                                    <div className="well well-white">
                                        <div className="form-row">
                                            <div className="st-col-33">
                                                <h3>Coverage</h3>
                                            </div>
                                            <div className="st-col-33">
                                                <h3>Deductibles</h3>
                                            </div>
                                            <div className="st-col-33">
                                                <h3>Insured</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-nav">
                                        <a href={constants.env.msi_pay_now_url} target="_blank" className="btn btn-gray">
                                            <span>Pay Now</span>
                                        </a>
                                        <a href={constants.env.msi_file_claim_url} target="_blank" className="btn btn-gray">
                                            <span>File Claim</span>
                                        </a>
                                        <a href={constants.env.msi_manage_policy_url} target="_blank" className="btn btn-gray">
                                            <span>Manage Policy</span>
                                        </a>
                                        <a onClick={() => closeView()} className="btn btn-red">
                                            <span>Done</span>
                                        </a>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}

                {insurance && insurance.api_partner_id == constants.env.insurance_api_partner_internal && <>
                    <h2>Proof of 3rd Party Insurance</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={insurance}
                    >
                        {({ values }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Policy Information</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Policy Effective Date" name="effective_on">
                                                <div className="text-left">{insightUtils.formatDate(values.effective_on)}</div>
                                            </FormItem>
                                            <FormItem label="Policy Expiration Date" name="expires_on">
                                                <div className="text-left">{insightUtils.formatDate(values.expires_on)}</div>
                                            </FormItem>
                                            <FormItem label="Insurance Company Name" name="insurance_company_name" type="read-only" />
                                        </div>

                                        <div className="form-row">
                                            <FormItem label="Policy #" name="policy_number" type="read-only" />
                                            <FormItem label="Liability Limit" name="liability_limit">
                                                <div className="text-left">{insightUtils.numberToCurrency(values.liability_limit)}</div>
                                            </FormItem>
                                            <FormItem label="# of Adults on Policy" name="adults_on_policy"type="read-only" />
                                        </div>

                                    </div>

                                    <hr/>

                                    <h3>Primary Insured</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="First Name" name="primary_insured_first_name" type="read-only" />
                                            <FormItem label="Middle Name" name="primary_insured_middle_name" optional={true} type="read-only" />
                                            <FormItem label="Last Name" name="primary_insured_last_name" type="read-only" />
                                            <FormItem label="Suffix" name="primary_insured_suffix" optional={true} type="read-only" />
                                        </div>
                                    </div>

                                    <hr/>

                                    <h3>Insured Property Address</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Address" name="primary_insured_street"  type="read-only" />
                                            <FormItem label="Unit #" name="primary_insured_unit_number" optional={true}  type="read-only" />
                                            <FormItem label="City" name="primary_insured_city"  type="read-only" />
                                            <FormItem label="State" name="primary_insured_state" type="read-only" />
                                            <FormItem label="Zip" name="primary_insured_zip" type="read-only" />
                                        </div>
                                    </div>

                                    <InsuranceDeclarationsView insurance={insurance} readOnly={true} />

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray">
                                            <span>Back</span>
                                        </a>
                                        <a onClick={() => navigate(insightRoutes.renterInsuranceEdit(params.leaseId, insurance.api_partner_id))} className="btn btn-red">
                                            <span>Edit</span>
                                        </a>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>

    )}

export default RenterInsuranceShowPage;

