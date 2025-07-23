import {Link, useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import store from "../../app/store";
import {loadLease, saveLease} from "../../slices/leaseSlice";

import insightUtils from "../../app/insightUtils";
import insightRoutes from "../../app/insightRoutes";

import {FieldArray, Form, Formik} from "formik";
import RadioButtonGroup from "../shared/RadioButtonGroup";
import LeaseIntentionsRow from "../landlord/leases/LeaseIntentionsRow";
import FormItem from "../shared/FormItem";

import InsightDatePicker from "../shared/InsightDatePicker";
import RenterStatusBlock from "./RenterStatusBlock";

const RenterMoveOutOrRenewPage = ({}) => {
    let params = useParams();
    let navigate = useNavigate()

    const { constants, settings, properties } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [lease, setLease] = useState(null)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const property = (properties || []).find((property) => lease && property.id == lease.property_id)


    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(async () => {

        /*
           Load Lease
         */
        if (!lease) {

            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            if (results.data.success) {
                let newLease = Object.assign({}, results.data.lease)

                // Are we only dealing with one resident?
                if (newLease.secondary_residents.length == 0) {
                    if (!newLease.move_out_step || newLease.move_out_step == constants.lease_move_out_steps.start.key) {
                        newLease.move_out_step = constants.lease_move_out_steps.move_out_some.key
                    }
                }

                newLease.security_deposit_refund_mode = constants.lease_refund_modes.paper_check.key
                if (newLease.notice_given_on) newLease.notice_given_on = insightUtils.parseDate(newLease.notice_given_on)
                setLease(newLease)
            }
            else {
                // Error!
                setBaseErrors("Unable to load lease. Please try again.")
            }
        }
    }, []);

    function readMoveOutValues(v) {
        return {
            id: v.id,
            move_out_intention: v.move_out_intention,
            forwarding_street: v.forwarding_street,
            forwarding_city: v.forwarding_city,
            forwarding_state: v.forwarding_state,
            forwarding_zip: v.forwarding_zip
        }
    }

    function closeView() {
        navigate(insightRoutes.renterLeaseShow(lease.hash_id))
    }

    function anyMoveOuts(values) {
        return (values.primary_resident.move_out_intention == constants.lease_resident_move_out_intentions.move_out.key || values.secondary_residents.find((lr) => lr.move_out_intention == constants.lease_resident_move_out_intentions.move_out.key))
    }

    return (
        <>
            {currentSettings && property && lease &&
            <div className="section">
                <RenterStatusBlock lease={lease} title="Renew / Move-out" hidePaymentNav={true} />

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={lease}
                    enableReinitialize
                    onSubmit={async(values, { setSubmitting, setErrors }) => {
                        setBaseErrorMessage("")

                        if (anyMoveOuts(values) && !values.notice_given_on) {
                            setErrors({notice_given_on: "can't be blank"})
                        }
                        else {

                            let leaseValues = {
                                hash_id: lease.hash_id,
                                move_out_step: values.move_out_step,
                                notice_given_on: values.notice_given_on,
                                lease_action: constants.lease_actions.requesting_move_out.key
                            }

                            if (values.primary_resident) {
                                leaseValues.primary_resident = readMoveOutValues(values.primary_resident)
                            }

                            if (values.secondary_residents) {
                                leaseValues.secondary_residents = values.secondary_residents.map((sr) => (readMoveOutValues(sr)))
                            }

                            try {

                                const results = await store.dispatch(saveLease({lease: leaseValues})).unwrap()

                                console.log(results.data)
                                setSubmitting(false);

                                if (results.data.success) {
                                    let newLease = Object.assign({}, results.data.lease)
                                    if (newLease.notice_given_on) newLease.notice_given_on = insightUtils.parseDate(newLease.notice_given_on)

                                    setLease(newLease)
                                } else if (results.data.errors) {
                                    setErrors(results.data.errors)

                                    if (results.data.errors.base) {
                                        setBaseErrorMessage(results.data.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            } catch {
                                // Error!
                                setBaseErrorMessage("Unable to continue move-out process")
                                setSubmitting(false);
                            }
                        }
                    }}
                >
                    {({ isSubmitting, setSubmitting, handleSubmit, values, setFieldValue }) => (
                        <Form>
                            <div className="add-property-wrap">

                                <hr />

                                {(!lease.move_out_step || lease.move_out_step == constants.lease_move_out_steps.start.key) &&
                                <div className="flex-column flex-center">
                                    <h3>Begin Lease Renewal / Move-Out</h3>
                                    <p className="text-center">What are your intentions?</p>

                                    <RadioButtonGroup name="move_out_step" extraClassName="centered-radio-button-group" options={[{id: constants.lease_move_out_steps.renew_all.key, name: "Renew lease for all residents"}, {id: constants.lease_move_out_steps.move_out_some.key, name: "Some residents are moving out"}, {id: constants.lease_move_out_steps.move_out_all.key, name: "All residents are moving out"}]} />
                                </div>
                                }

                                {lease.move_out_step == constants.lease_move_out_steps.move_out_some.key &&
                                <div className="flex-column flex-center">
                                    <h3>Lease Renewal / Move-Out</h3>
                                    <p className="text-left">Indicate your intentions:</p>

                                    <LeaseIntentionsRow residentType='primary_resident' lease={lease} leaseResident={lease.primary_resident}/>

                                    {<FieldArray
                                        name="secondary_residents"
                                        render={() => (
                                            <>
                                                {values.secondary_residents && values.secondary_residents.map((secondaryResident, i) => (
                                                    <LeaseIntentionsRow key={i} residentType={"secondary_residents." + i} lease={lease} leaseResident={secondaryResident}/>
                                                ))}
                                            </>
                                        )}
                                    />}

                                    {anyMoveOuts(values) &&
                                        <>
                                            <p>When would you like to move out?</p>
                                            <div className="form-row">
                                                <div className="form-item-25">&nbsp;</div>
                                                <FormItem className="form-item-25" label="Requested Move-out Date" name="notice_given_on">
                                                    <InsightDatePicker name="notice_given_on" selected={values.notice_given_on} onChange={(date) => setFieldValue("notice_given_on", date)} />
                                                </FormItem>
                                                <div className="form-item-25">&nbsp;</div>
                                            </div>
                                        </>
                                    }
                                </div>
                                }



                                {lease.move_out_step == constants.lease_move_out_steps.resident_requested.key &&
                                    <div className="flex-column flex-center">
                                        <h3>Request Received</h3>
                                        <p className="text-center">Your landlord has been notified of your request.</p>
                                    </div>
                                }


                                {lease.move_out_step != constants.lease_move_out_steps.resident_requested.key &&
                                <div className="form-nav">
                                    <a onClick={closeView} className="btn btn-gray"><span>Cancel</span></a>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Continue" : "Continuing..."}</span></button>
                                </div>
                                }
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
            }
        </>
    )}

export default RenterMoveOutOrRenewPage;