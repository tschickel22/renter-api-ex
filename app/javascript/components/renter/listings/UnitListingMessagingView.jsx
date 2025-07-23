import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadUnitListingsForDisplay, saveUnitListing} from "../../../slices/unitListingSlice";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {Field, Form, Formik} from "formik";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import FormItem from "../../shared/FormItem";
import DatePicker from "react-datepicker";
import BasicDropdown from "../../shared/BasicDropdown";
import {saveLease} from "../../../slices/leaseSlice";

const UnitListingMessagingView = ({company, propertyListing, unitListings, unitListing, unit, applyMode, setApplyMode, hideApplyOption}) => {

    const { constants } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [lease, setLease] = useState(null)

    useEffect(() => {

        let newLease = {company_id: company.id, property_id: propertyListing.property_id}

        newLease.primary_resident = insightUtils.emptyLeaseResident()
        newLease.primary_resident.lead_info = {unit_id: unit.id, unit_listing_id: unitListing.id, beds: unit.beds, baths: unit.baths, square_feet: unit.square_feet, move_in_on: new Date(), comment: "", reply_via_text: ""}

        setLease(newLease)

    }, []);

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        if (applyMode == "apply") {
            values.primary_resident.type = "LeaseResidentPrimary"
            values.primary_resident.current_step = constants.lease_resident_steps.invitation.key
            values.lease_action = constants.lease_actions.begin_application.key

            const results = await store.dispatch(saveLease({lease: values})).unwrap()
            const response = results.data

            console.log(response)
            setSubmitting(false);

            if (response.success) {
                setApplyMode("apply_email_sent")
            }
            else if (response.errors) {
                setErrors(response.errors)

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }
                else {
                    setBaseErrorMessage("Please correct the errors and resubmit")
                }

                insightUtils.scrollTo('errors')
            }
        }
        else if (applyMode == "message") {

            values.primary_resident.type = "LeaseResidentPrimary"
            values.primary_resident.current_step = constants.lease_resident_steps.lead.key
            values.lease_action = constants.lease_actions.adding_lead.key

            const results = await store.dispatch(saveLease({lease: values})).unwrap()
            const response = results.data

            console.log(response)
            setSubmitting(false);

            if (response.success) {
                setApplyMode("message_sent")
            }
            else if (response.errors) {
                setErrors(response.errors)

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }
                else {
                    setBaseErrorMessage("Please correct the errors and resubmit")
                }

                insightUtils.scrollTo('errors')
            }
        }
    }

    return (
        <>
            {lease &&
            <div className="lp-details-column lp-details-contact">
                <h3>Contact Property Manager</h3>

                <Formik
                    initialValues={lease}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="lp-contact-manager">

                                <div className="lp-prop-avatar">
                                    <img className="flex-img-avatar" src="/images/avatar-white-red.svg"/>
                                </div>

                                <div className="lp-prop-manager-info">
                                    <strong>{propertyListing.contact_name}</strong><br/>
                                    {company.name}<br/>
                                    <a><i className="fal fa-phone"></i> {insightUtils.formatPhone(propertyListing.contact_phone)}</a><br/>
                                </div>
                            </div>

                            {!hideApplyOption &&
                                <div className="lp-details-nav">
                                    <div onClick={() => setApplyMode("apply")} className={"btn btn-gray btn-sibling" + (applyMode == "apply" || applyMode == "apply_email_sent" ? " active" : "")}><span>Apply Online</span></div>
                                    <div onClick={() => setApplyMode("message")} className={"btn btn-gray btn-sibling" + (applyMode == "message" || applyMode == "message_sent" ? " active": "")}><span>Message Property</span></div>
                                </div>
                            }

                            {applyMode == "apply" &&
                                <div className="form lp-form-apply-online">
                                    <h3>Apply online in a few easy steps!</h3>

                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                    <div className="form-row">
                                        <FormItem label="First Name" name="primary_resident.resident.first_name" />
                                        <FormItem label="Last Name" name="primary_resident.resident.last_name" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Email" name="primary_resident.resident.email" type="email" />
                                    </div>

                                    <div className="form-nav">
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Submit" : "Submitting..."}</span>
                                        </button>
                                    </div>
                                </div>
                            }


                            {applyMode == "message" &&
                                <div className="form lp-form-message-property">
                                    <h3>Send a message to this property</h3>

                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                    <div className="form-row">
                                        <FormItem label="First Name" name="primary_resident.resident.first_name" />
                                        <FormItem label="Last Name" name="primary_resident.resident.last_name" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Email" name="primary_resident.resident.email" type="email" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Cell Phone" name="primary_resident.resident.phone_number" mask={insightUtils.phoneNumberMask()} />
                                        <FormItem label="Text me back" name="primary_resident.lead_info.reply_via_text" formItemClass="form-checkbox-near-text-input" type="checkbox" optional={true} />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Desired Move-In Date" name="primary_resident.lead_info.move_in_on">
                                            <DatePicker className="form-input form-input-white" selected={values.primary_resident.lead_info.move_in_on} onChange={(date) => setFieldValue("primary_resident.lead_info.move_in_on", date)} />
                                        </FormItem>
                                    </div>

                                    {unitListings && <div className="form-row">
                                        <FormItem label="Desired Unit / Floor Plan" name="primary_resident.lead_info.unit_listing_id">
                                            <BasicDropdown name="primary_resident.lead_info.unit_listing_id" options={unitListings} />
                                        </FormItem>
                                    </div>}

                                    <div className="form-row">
                                        <FormItem label="Add a Message" name="primary_resident.lead_info.comment" optional={true}>
                                            <Field component="textarea" rows={5} name="primary_resident.lead_info.comment" className="form-textarea form-input-white" placeholder="Add a Message"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-nav">
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Send" : "Sending..."}</span>
                                        </button>
                                    </div>
                                </div>
                            }

                            {applyMode == "message_sent" &&
                                <div>
                                    <h3>Message Sent</h3>
                                    <p>Thank you! Your message has been sent to the property. We will respond to you as soon as we can.</p>
                                </div>
                            }

                            {applyMode == "apply_email_sent" &&
                            <div>
                                <h3>Application Process</h3>
                                <p>Thank you! We have received your information and have sent you an email with a link to begin your application.</p>
                            </div>
                            }

                        </Form>
                    )}
                </Formik>

            </div>
            }

        </>

    )}

export default UnitListingMessagingView;

