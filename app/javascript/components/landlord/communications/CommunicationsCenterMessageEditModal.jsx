import React, {useEffect, useState} from 'react';

import Modal from "../../shared/Modal";
import store from "../../../app/store";
import {loadCommunication, saveCommunication} from "../../../slices/communicationSlice";
import insightUtils from "../../../app/insightUtils";
import {Field, Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const CommunicationsCenterMessageEditModal = ({editingCommunicationHashId, setEditingCommunicationHashId, setReloadCommunications, leaseResidents, templates}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

    const [communication, setCommunication] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [previewing, setPreviewing] = useState(false)
    const [leaseResident, setLeaseResident] = useState(null)
    const [communicationTypeOptions, setCommunicationTypeOptions] = useState([])

    useEffect(async() => {
        const results = await store.dispatch(loadCommunication({communicationId: editingCommunicationHashId.split(":")[0]})).unwrap()

        let newCommunication = Object.assign({}, results.data.communication)

        // Is this going to a specific lease resident?
        if (editingCommunicationHashId.indexOf(":") > 0) {
            newCommunication.related_object_id = editingCommunicationHashId.split(":")[1]
            updateSelectedLeaseResident(newCommunication.related_object_id)
        }
        else {
            if (properties.length == 1) newCommunication.property_id = properties[0].id
        }

        setCommunication(newCommunication)
    }, [])

    function handleLeaseResidentSelected(e) {
        return updateSelectedLeaseResident(e.target.value)
    }

    async function updateSelectedLeaseResident(leaseResidentId) {
        const newLeaseResident = leaseResidents.find((lr) => (lr.hash_id == leaseResidentId))

        let newCommunicationTypeOptions = [{id: "email", name: "Email"}, {id: "chat", name: "Chat"}]

        if (newLeaseResident && newLeaseResident.resident && newLeaseResident.resident.phone_number && !newLeaseResident.resident.text_opted_out_at) {
            newCommunicationTypeOptions.push({id: "text", name: "Text"})
        }

        await setCommunicationTypeOptions(newCommunicationTypeOptions)
        setLeaseResident(newLeaseResident)
    }

    return (
        <Modal closeModal={() => setEditingCommunicationHashId(null)} extraClassName="overlay-box-medium">
            {communication &&
            <Formik
                initialValues={communication}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    if (!values.body) {
                        setSubmitting(false)
                        return;
                    }

                    if (insightUtils.isCompanyUserAtLeast(currentUser) && !values.related_object_id) {
                        setBaseErrorMessage("Please select a recipient")
                        insightUtils.scrollTo('errors')
                    }
                    else if (insightUtils.isCompanyUserAtLeast(currentUser) && (!values.mediums || values.mediums.length == 0)) {
                        setBaseErrorMessage("Please select one form of delivery")
                        insightUtils.scrollTo('errors')
                    }
                    else if (insightUtils.isResident(currentUser) && !values.property_id) {
                        setBaseErrorMessage("Please select a property")
                        insightUtils.scrollTo('errors')
                    }
                    else {

                        if (!Array.isArray(values.mediums)) values.mediums = values.mediums.split(",")

                        // Is this resident eligible for text messgaes?
                        if (values.mediums && values.mediums.indexOf("text") >= 0 && insightUtils.isCompanyUserAtLeast(currentUser)) {
                            if (leaseResident) {
                                if (!leaseResident.resident) {
                                    setBaseErrorMessage("Resident record is incomplete")
                                    return;
                                }
                                else if (!leaseResident.resident.phone_number || leaseResident.resident.text_opted_out_at) {
                                    // Don't tell the user, just un-check the box
                                    values.mediums.splice(values.mediums.indexOf("text"), 1)
                                }
                            }
                        }

                        try {
                            values.sub_type = "communications_center"

                            // Find the leaseResident associated with this property
                            if (insightUtils.isResident(currentUser)) {
                                const matchingLeaseResident = leaseResidents.find((lr) => (lr.lease.property_id == parseInt(values.property_id)))
                                values.related_object_id = matchingLeaseResident.hash_id
                            }

                            const results = await store.dispatch(saveCommunication({communication: values, relatedObjectType: "LeaseResident", relatedObjectHashId: values.related_object_id})).unwrap()
                            const response = results.data

                            console.log(response)
                            setSubmitting(false);

                            if (response.success) {
                                if (setReloadCommunications) setReloadCommunications(true)
                                setEditingCommunicationHashId(null)
                            }
                            else if (response.errors) {
                                setErrors(response.errors)

                                if (response.errors.base) {
                                    setBaseErrorMessage([response.errors.base].flat().join(", "))
                                }

                                insightUtils.scrollTo('errors')
                            }
                        }
                        catch(e) {
                            console.log(e)
                            setBaseErrorMessage("Cannot send message")
                        }
                        finally {
                            setSubmitting(false)
                        }
                    }

                }}
            >
                {({ isSubmitting, values, handleChange, setFieldValue, handleSubmit }) => (
                    <Form style={{width: "100%"}}>

                        <div className="nm-form">

                            <h2 className="message-name">New Message</h2>

                            <p className="text-center nm-introtext">Create a message using the form below.</p>

                            {baseErrorMessage && <><div className="text-error text-center">{baseErrorMessage}</div><br/></>}

                            <div className="form-row">
                                {insightUtils.isResident(currentUser) && properties && properties.length > 1 &&
                                    <FormItem name="property_id">
                                        <AutocompleteDropdown name="property_id"
                                                              label="Select Property"
                                                              options={[{id: "", label: "All Properties" }].concat(properties)}
                                        />
                                    </FormItem>
                                }

                                {insightUtils.isCompanyUserAtLeast(currentUser) && leaseResidents && <>
                                    {editingCommunicationHashId.indexOf(":") < 0 &&
                                        <FormItem name="property_id">
                                            <AutocompleteDropdown name="property_id"
                                                              label="Property"
                                                              options={[{id: "", label: "All Properties" }].concat(properties)}
                                                               />
                                        </FormItem>
                                    }

                                    <FormItem name="related_object_id">
                                        <AutocompleteDropdown name="related_object_id" label="Recipient"
                                                              options={leaseResidents.filter((lr) => (lr.resident && (!values.property_id || (lr.lease && lr.lease.property_id == values.property_id)))).map((lr) => ({id: lr.hash_id, name: lr.resident.name}))}
                                                              value={leaseResident ? {id: leaseResident.hash_id, name: leaseResident.resident.name} : null}
                                                              handleChange={updateSelectedLeaseResident} />
                                    </FormItem>
                                </>}

                                {templates && <FormItem name="template_id">
                                    <BasicDropdown name="template_id" options={templates} />
                                </FormItem>}
                            </div>

                            <div className="form-row">
                                <FormItem name="body" optional={true}>
                                    <Field component="textarea" rows={4} name="body" className="form-input form-input-white" placeholder="Type your message"/>
                                    {values.mediums && values.mediums.indexOf("text") >= 0 && <div className={"character-count" + ((values.body || "").length > 140 ? " text-red" : "")}>{(values.body || "").length}/140</div>}
                                </FormItem>
                            </div>

                            {leaseResident && communicationTypeOptions && insightUtils.isCompanyUserAtLeast(currentUser) && <div className="form-row">
                                <div className="form-item">
                                    <div className="form-radio">
                                        <FormItem name="type" label="How Do You Want to Send It?">
                                            <CheckBoxGroup name="mediums" options={communicationTypeOptions} direction="row-centered" />
                                        </FormItem>
                                    </div>
                                </div>
                            </div>}

                            {false && <div className="nm-form-item nm-form-btn nm-form-attachments text-center">
                                <i className="fal fa-paperclip"></i> Add Attachments
                            </div>}

                            {values.type == "CommunicationAnnouncement" && <div className="nm-form-item nm-form-btn text-center">
                                <i className="fal fa-calendar"></i> Set Date to Remove from Resident Portal
                            </div>}

                            <div className="smallspacer"></div>

                            {values.type == "CommunicationAnnouncement" && <div className="nm-form-item nm-form-announce-details text-center">
                                <small>Sent by Email, Text, & Resident Portal</small>
                            </div>}

                            <div className="form-nav">
                                <div onClick={() => setEditingCommunicationHashId(null)} className="btn btn-gray"><span>Cancel</span></div>
                                <div onClick={handleSubmit} className="btn btn-red">
                                    <span>{!isSubmitting ? "Send Message" : "Sending..."}</span>
                                </div>
                                {values.type == "CommunicationAnnouncement" && <div onClick={() => setPreviewing(true)} className="btn btn-red btn-review-announcement"><span>Preview Announcement</span></div>}
                            </div>
                        </div>

                    </Form>
                )}
            </Formik>}

            {previewing &&
                <div className="nm-preview">
                    <h2>Review & Send</h2>
                    <p className="text-center">Your announcement will be sent on <strong className="nm-preview-date">March 07, 2022</strong></p>

                    <p><strong>Sending to:</strong> All Properties</p>
                    <p><strong>Subject:</strong> Snow Removal</p>
                    <p><strong>Message:</strong> It's going to snow and we all need to plow by Friday. Be careful out there and try to keep your sidewalk salted.</p>
                    <p><strong>Resident Center Removal Date:</strong> May 07, 2022</p>

                    <div className="form-nav">
                        <div className="btn btn-gray btn-nm-preview-back"><span>Edit</span></div>
                        <div className="btn btn-red"><span>Send Announcement</span></div>
                    </div>

                </div>}
        </Modal>
    )}

export default CommunicationsCenterMessageEditModal;

