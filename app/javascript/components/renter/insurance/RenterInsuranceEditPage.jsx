import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadInsurance, saveInsurance} from "../../../slices/insuranceSlice";
import insightRoutes from "../../../app/insightRoutes";

import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import DatePicker from "react-datepicker";

import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import StateDropdown from "../../shared/StateDropdown";
import {loadLease} from "../../../slices/leaseSlice";
import InsuranceDeclarationsView from "./InsuranceDeclarationsView";

const RenterInsuranceEditPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { constants, properties } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [insurance, setInsurance] = useState(null)
    const [msiUrl, setMsiUrl] = useState(null)
    const declarationsBatchNumber = +new Date()

    useEffect(async () => {
        if (properties) {
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            const newLease = results.data.lease
            const newLeaseResident = results.data.lease.primary_resident

            const property = insightUtils.getCurrentProperty(properties, {propertyId: newLease.property_id})
            let newUrlAdditions = []

            newUrlAdditions.push("firstName=" + encodeURIComponent(newLeaseResident.resident.first_name))
            newUrlAdditions.push("lastName=" + encodeURIComponent(newLeaseResident.resident.last_name))
            newUrlAdditions.push("emailAddress=" + encodeURIComponent(newLeaseResident.resident.email))
            newUrlAdditions.push("addressLine1=" + encodeURIComponent(newLease.unit.street))
            newUrlAdditions.push("addressLine2=" + encodeURIComponent(newLease.unit.unit_number))
            newUrlAdditions.push("addressCity=" + encodeURIComponent(newLease.unit.city))
            newUrlAdditions.push("addressState=" + encodeURIComponent(newLease.unit.state))
            newUrlAdditions.push("addressZipcode5=" + encodeURIComponent(newLease.unit.zip))
            newUrlAdditions.push("communityPartyID=" + encodeURIComponent(property.external_insurance_id))
            newUrlAdditions.push("uniqueId=" + encodeURIComponent(newLeaseResident.hash_id))
            //newUrlAdditions.push("marketingSource=" + encodeURIComponent("TBD"))
            newUrlAdditions.push("zipCode5=" + encodeURIComponent(newLease.unit.zip))
            newUrlAdditions.push("phoneNumber=" + encodeURIComponent(newLeaseResident.resident.phone_number))
            newUrlAdditions.push("roommateCount=" + encodeURIComponent(newLease.secondary_residents.length + newLease.occupants.length))
            newUrlAdditions.push("moveInDate=" + encodeURIComponent(insightUtils.formatDate(newLease.move_in_on || newLease.lease_start_on)))

            console.log("Going onto the URL", newUrlAdditions)

            setMsiUrl(constants.env.msi_registration_url + "?" + newUrlAdditions.join("&"))
        }

    }, [properties])

    useEffect(async () => {
        const results = await store.dispatch(loadInsurance({leaseId: params.leaseId})).unwrap()

        console.log(results)

        let newInsurance = null

        if (results.data){

            const existingInsurance = results.data.insurances.find((i) => (i.api_partner_id == params.apiPartnerId))

            newInsurance = Object.assign({}, existingInsurance)
            newInsurance.effective_on = insightUtils.parseDate(newInsurance.effective_on)
            newInsurance.expires_on = insightUtils.parseDate(newInsurance.expires_on)
        }

        setInsurance(newInsurance)

    }, [])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        //values.declarations_batch_number = declarationsBatchNumber

        const results = await store.dispatch(saveInsurance({insurance: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView()
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    function closeView() {
        navigate(insightRoutes.renterLeaseShow(params.leaseId))
    }

    return (
        <>
            <div className="section">
                {insurance && insurance.api_partner_id == constants.env.insurance_api_partner_msi && <>
                    {msiUrl ?
                        <iframe width={isMobileDevice ? "400" : "768"} height="1200" src={msiUrl} style={{border: "none"}}></iframe>
                        :
                        <div className="loading">Loading...</div>
                    }
                </>}

                {insurance && insurance.api_partner_id == constants.env.insurance_api_partner_internal && <>
                    <h2>Upload Proof of Insurance</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={insurance}
                        onSubmit={handleFormikSubmit}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Policy Information</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Policy Effective Date" name="effective_on">
                                                <DatePicker className="form-input form-input-white" selected={values.effective_on} onChange={(date) => setFieldValue("effective_on", date)} />
                                            </FormItem>
                                            <FormItem label="Policy Expiration Date" name="expires_on">
                                                <DatePicker className="form-input form-input-white" selected={values.expires_on} onChange={(date) => setFieldValue("expires_on", date)} />
                                            </FormItem>

                                            <FormItem label="Insurance Company Name" name="insurance_company_name" />
                                        </div>

                                        <div className="form-row">
                                            <FormItem label="Policy #" name="policy_number" />
                                            <FormItem label="Liability Limit" name="liability_limit" mask={insightUtils.currencyMask()} />
                                            <FormItem label="# of Adults on Policy" name="adults_on_policy" />
                                        </div>

                                    </div>

                                    <hr/>

                                    <h3>Primary Insured</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="First Name" name="primary_insured_first_name" />
                                            <FormItem label="Middle Name" name="primary_insured_middle_name" optional={true} />
                                            <FormItem label="Last Name" name="primary_insured_last_name" />
                                            <FormItem label="Suffix" name="primary_insured_suffix" optional={true}>
                                                <BasicDropdown name="primary_insured_suffix" options={constants.suffixes} />
                                            </FormItem>
                                        </div>
                                    </div>

                                    <hr/>

                                    <h3>Insured Property Address</h3>
                                    <div className="well well-white">
                                        <div className="form-row">
                                            <FormItem label="Address" name="primary_insured_street" />
                                            <FormItem label="Unit #" name="primary_insured_unit_number" optional={true} />
                                            <FormItem label="City" name="primary_insured_city" />
                                            <FormItem label="State" name="primary_insured_state">
                                                <StateDropdown name="primary_insured_state" />
                                            </FormItem>
                                            <FormItem label="Zip" name="primary_insured_zip" mask={insightUtils.zipMask()} />
                                        </div>
                                    </div>

                                    <InsuranceDeclarationsView insurance={insurance} declarationsBatchNumber={declarationsBatchNumber} />

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>

    )}

export default RenterInsuranceEditPage;

