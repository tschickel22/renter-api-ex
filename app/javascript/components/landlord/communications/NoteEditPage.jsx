import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import store from "../../../app/store";

import {Field, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {loadCommunication, saveCommunication} from "../../../slices/communicationSlice";
import {useSelector} from "react-redux";
import {loadLease} from "../../../slices/leaseSlice";
import StatusBlock from "../leases/blocks/StatusBlock";
import LeaseNav from "../leases/LeaseNav";

const NoteEditPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { currentUser } = useSelector((state) => state.user)

    const [lease, setLease] = useState(null)
    const [note, setNote] = useState(null)
    const [relatedObjectType, setRelatedObjectType] = useState(null)
    const [relatedObjectHashId, setRelatedObjectHashId] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {
        if (params.noteId) {
            const results = await store.dispatch(loadCommunication({communicationId: params.noteId})).unwrap()

            setRelatedObjectType(results.data.communication.related_object_type)
            setRelatedObjectHashId(results.data.communication.related_object.hash_id)

            if (results.data.communication.related_object_type == "Lease") {
                await loadLeaseById(results.data.communication.related_object.hash_id)
            }

            setNote(results.data.communication)
        }
        else {
            if (params.leaseId) {
                setRelatedObjectType("Lease")
                setRelatedObjectHashId(params.leaseId)
                await loadLeaseById(params.leaseId)
            }
            else if (params.propertyId) {
                setRelatedObjectType("Property")
                setRelatedObjectHashId(params.propertyId)
            }
            else {
                setRelatedObjectType("Company")
                setRelatedObjectHashId(currentUser.company_id)
            }

            setNote(insightUtils.emptyCommunication())
        }
    }, [])

    async function loadLeaseById(leaseId) {
        const results = await store.dispatch(loadLease({leaseId: leaseId})).unwrap()
        setLease(results.data.lease)
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        if (!values.subject && !values.body) {
            setBaseErrorMessage("Enter an activity and/or a note")
            setSubmitting(false);
            return false
        }

        values.type = "CommunicationNotePrivate"
        values.sub_type = "notes"

        // Always include chat
        values.mediums = ["chat"]

        const results = await store.dispatch(saveCommunication({communication: values, relatedObjectType: relatedObjectType, relatedObjectHashId: relatedObjectHashId})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView(response.communication.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage([response.errors.base].flat().join(", "))
            }

            insightUtils.scrollTo('errors')
        }

    }

    function closeView(newNoteId) {
        insightUtils.handleBackNavigation(insightRoutes.noteList(), location, navigate, newNoteId)
    }

    return (
        <>
            <div className="section">
                {lease && note && <>
                    <StatusBlock lease={lease} title={note.id ? "Edit Activity" : "Record Activity"} />
                    <LeaseNav lease={lease} />
                </>
                }
                {note && <>
                    {relatedObjectType && relatedObjectType != "Lease" && <>
                        <img className="section-img" src="/images/photo-communications.jpg" />
                        <h2>{note.id ? "Edit Activity" : "Record Activity"}</h2>

                        <p>Use this form to {note.id ? "edit" : "record"} activity.</p>
                    </>}

                    <Formik
                        initialValues={note}
                        onSubmit={handleFormikSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form style={{width: "100%"}}>

                                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                {currentUser.communications_edit && <>
                                    <div className="form-row">
                                        <FormItem label="Activity" name="subject" optional={true} placeholder="Ex: Called Resident" />
                                    </div>
                                    <div className="form-row">
                                        <FormItem label="Notes" name="body" optional={true}>
                                            <Field component="textarea" rows={4} name="body" className="form-textarea form-input-white" placeholder="Ex: Left Voicemail"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-nav">
                                        <a onClick={() => (closeView())} className="btn btn-gray"><span>Back</span></a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </>}
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>
    )
}

export default NoteEditPage;

