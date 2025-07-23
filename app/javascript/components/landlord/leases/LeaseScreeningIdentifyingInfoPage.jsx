import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";

import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";

const LeaseScreeningIdentifyingInfoPage = ({baseLease, setBaseLease, setCurrentStep, baseLeaseResident, setBaseLeaseResident}) => {

    const { constants } = useSelector((state) => state.company)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(() => {
        insightUtils.scrollTo('top')

    }, []);

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            populateLease(baseLease, baseLeaseResident)
        }

    }, [baseLease, baseLeaseResident]);

    function populateLease(l, lr) {
        setLease(Object.assign({}, l))
        setLeaseResident(Object.assign({}, lr))
    }

    return (
        <>
            {lease && leaseResident &&
                <div className="section-table-wrap">

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={{lease: lease, lease_resident: leaseResident}}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            /*
                               SAVE LEASE
                             */

                            setBaseErrorMessage("")

                            values.lease_resident.current_step = constants.lease_resident_steps.screening.key

                            try {
                                const result = await store.dispatch(saveLeaseResident({leaseResident: values.lease_resident})).unwrap()
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

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            catch(err) {
                                setBaseErrorMessage("Unable to save screening information: " + (err || ""))
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">

                                    <h2>Screening</h2>
                                    <p>As a part of your application, the property manager requires credit, criminal and eviction reports from TransUnion. For your protection, you will need to verify your identity and answer a few security questions.</p>

                                    <p className="text-sensitive"><i className="fa fa-shield-check"></i>&nbsp;Your information is on a secure site.</p>

                                    <div className="text-left text-gray text-agreement">
                                        <ul>
                                            <li>Screening is performed with TransUnion, the leading national credit bureau.</li>
                                            <li>TransUnion Screening is trusted by millions of applicants each year.</li>
                                            <li>This screening is run as a soft inquiry, and will not negatively effect your credit.</li>
                                            <li>Property owner will only see the last four of your SSN or ITIN & only year of birth.</li>
                                        </ul>
                                    </div>

                                    <hr/>

                                    <h2 className="text-left">Screening Agreement</h2>

                                    <iframe src="/pdfs/resident-screening-terms.pdf" width="100%" height="300px"></iframe>

                                    <div className="form-row">
                                        <FormItem name="lease_resident.resident.screening_agreement"  label="I have read the Screening Agreement and authorize TransUnion Rental Screening Solutions to obtain my credit profile TransUnion and public records sources and to score such information and provide it to certain identified third parties who are requesting this information about me.  These reports may differ by jurisdiction." formItemClass="text-gray text-agreement" type="checkbox" />
                                    </div>
                                    <hr/>

                                    <h3 className="text-left">Confirm Information</h3>

                                    <div className="form-row">
                                        <div className="st-col-25 st-col-md-100 text-left">
                                            <strong>First Name: </strong> {values.lease_resident.resident.first_name}<br />
                                            <strong>Last Name: </strong> {values.lease_resident.resident.last_name}<br />
                                            <strong>Monthly Income: </strong> {values.lease_resident.resident.income}<br />
                                            {values.lease_resident.resident.resident_employment_histories && values.lease_resident.resident.resident_employment_histories.length > 0 &&
                                                <>
                                                    <strong>Employment Status: </strong> {insightUtils.getLabel(values.lease_resident.resident.resident_employment_histories[0].employment_status, constants.employment_statuses)}<br />
                                                </>
                                            }
                                            <br/>
                                            <a onClick={() => setCurrentStep(constants.lease_resident_steps.applicant_details.key)}>Update</a>
                                        </div>
                                        <div className="st-col-25 st-col-md-100 text-left">
                                            <strong>Phone: </strong> {values.lease_resident.resident.phone_number ? values.lease_resident.resident.phone_number : "(None)"}<br />
                                            {values.lease_resident.resident.resident_residence_histories && values.lease_resident.resident.resident_residence_histories.length > 0 &&
                                                <>
                                                    <strong>Address: </strong> {values.lease_resident.resident.resident_residence_histories[0].street}<br/>
                                                    <strong>City: </strong> {values.lease_resident.resident.resident_residence_histories[0].city}<br/>
                                                    <strong>State: </strong> {values.lease_resident.resident.resident_residence_histories[0].state}<br/>
                                                    <strong>Zip Code: </strong> {values.lease_resident.resident.resident_residence_histories[0].zip}<br/>
                                                </>
                                            }
                                            <a onClick={() => setCurrentStep(constants.lease_resident_steps.occupant_details.key)}>Update</a>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="st-col-50 st-col-md-100 text-left" style={{color: "#999"}}>
                                            <br/>
                                            If you have a credit freeze in place, call TransUnion at 888-909-8872 to lift it before submitting your application.
                                        </div>
                                        <div className="st-col-50 st-col-md-100 form-nav flex-right">
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                {isSubmitting && <span>Submitting...</span>}
                                                {!isSubmitting && <span>Verify Identity &gt;</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </Form>
                        )}
                    </Formik>




                </div>

            }
        </>

    )}

export default LeaseScreeningIdentifyingInfoPage;

