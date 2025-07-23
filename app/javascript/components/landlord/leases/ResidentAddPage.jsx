import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom'
import {FieldArray, Form, Formik} from "formik";
import moment from 'moment';
import store from "../../../app/store";

import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";
import ResidentCompactFormRow from "./ResidentCompactFormRow";
import BasicDropdown from "../../shared/BasicDropdown";
import DatePicker from "react-datepicker";
import {createExistingLease} from "../../../slices/leaseSlice";

const ResidentAddPage = ({}) => {
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    let navigate = useNavigate();

    const { properties, constants } = useSelector((state) => state.company)

    const [units, setUnits] = useState(null)

    function closeModal() {
        navigate(insightRoutes.residentList())
    }

    function updateSelectedProperty(e) {
        const propertyId = e.target.value
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))

        if (property) {
            setUnits(property.units)
        }
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        try {
            // Tom doesn't want lease end for MTM
            if (values.lease_term == -1) {
                values.lease_end_on = null
            }

            const results = await store.dispatch(createExistingLease(values)).unwrap()

            const response = results.data
            console.log(response)
            setSubmitting(false);

            if (response.status == "success") {
                if (response.lease_hash_id) {
                    navigate(insightRoutes.leaseShow(response.lease_hash_id))
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
        }
        catch {
            // Error!
            setBaseErrorMessage("Unable to add resident")
            setSubmitting(false);
        }
    }

    function addNewResident(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyLeaseResident())
    }

    return (
        <>
        {properties &&

            <div className="section">
                <h2>Add Existing Resident</h2>
                <p className="text-center">Use this form to add an existing lease.</p>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={{invite_to_portal: true, secondary_residents: []}}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div>
                                <div className="form-row">
                                    <FormItem label="Property" name="property_id" >
                                        <BasicDropdown name="property_id" blankText="-- Select Property --" options={properties.filter((p) => p.units && p.units.length > 0 && p.status == "active")} onChange={(e) => {updateSelectedProperty(e)}} />
                                    </FormItem>
                                    <FormItem label="Unit" name="unit_id">
                                        {units ?
                                            <BasicDropdown name={`unit_id`} blankText="-- Select Unit --" options={units} />
                                            :
                                            <select className="form-select"><option>Please select a property</option></select>
                                        }
                                    </FormItem>
                                </div>

                                <ResidentCompactFormRow residentLabel="Resident" residentType="primary_resident" resident={values.primary_resident} mode="compact" index={0} />

                                <h3>Co-Residents</h3>

                                <div>
                                    {<FieldArray
                                        name="secondary_residents"
                                        render={arrayHelpers => (
                                            <>
                                                {values.secondary_residents && values.secondary_residents.map((secondary_resident, index) => (
                                                    <ResidentCompactFormRow residentLabel="Co-Resident" key={index} index={index} arrayHelpers={arrayHelpers} residentType={"secondary_residents." + index} resident={secondary_resident} />
                                                ))
                                                }

                                                {values.secondary_residents && values.secondary_residents.length < 2 &&
                                                    <div className="form-row">
                                                        <div className="form-item">
                                                            <a onClick={() => addNewResident(arrayHelpers)}>Add Co-Resident</a>
                                                        </div>
                                                    </div>
                                                }
                                            </>
                                        )}
                                    />}
                                </div>
                                <hr/>

                                <div className="form-row">
                                    <FormItem label="Lease Term" name="lease_term">
                                        <BasicDropdown name="lease_term" options={constants.lease_term_options} />
                                    </FormItem>

                                    {values.lease_term == "other" && <FormItem label="Enter Months" name="lease_term_other" />}

                                    <FormItem label="Lease Start Date" name="lease_start_on">
                                        <DatePicker className="form-input form-input-white" selected={values.lease_start_on} onChange={(date) => setFieldValue("lease_start_on", date)} />
                                    </FormItem>

                                    {values.lease_term != -1 ?
                                        <FormItem label="Lease End Date" name="lease_end_on">
                                            <DatePicker className="form-input form-input-white" selected={values.lease_end_on} openToDate={values.lease_start_on ? moment(values.lease_start_on).add(Math.abs((values.lease_term == "other" ? values.lease_term_other : values.lease_term) || 12), 'months').toDate() : null} onChange={(date) => setFieldValue("lease_end_on", date)} />
                                        </FormItem>
                                        :
                                        <div className="form-item"></div>
                                    }

                                    {values.lease_term != "other" && <div className="form-item"></div>}
                                </div>

                                <div className="form-row">
                                    <FormItem label="Rent" name="rent" mask={insightUtils.currencyMask()} />
                                    <FormItem label="Security Deposit" name="security_deposit" mask={insightUtils.currencyMask()} />
                                    <FormItem label="Outstanding Balance" name="outstanding_balance_amount" mask={insightUtils.currencyMask()} />
                                    <div className="form-item"></div>
                                </div>

                                <div className="form-row">
                                    <FormItem label="Email Invite to Resident Portal" name="invite_to_portal" type="checkbox" optional={true} />
                                </div>

                                <div className="form-nav">
                                    <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        {!isSubmitting && <span>Save Resident</span>}
                                        {isSubmitting && <span>Saving...</span>}
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        }
        </>
    )}

export default ResidentAddPage;

