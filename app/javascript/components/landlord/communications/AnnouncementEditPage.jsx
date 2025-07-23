import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import store from "../../../app/store";

import {Field, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {loadAnnouncement, saveAnnouncement} from "../../../slices/announcementSlice";
import DatePicker from "react-datepicker";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import AnnouncementAttachmentsView from "./AnnouncementAttachmentsView";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import {useSelector} from "react-redux";

const AnnouncementEditPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()
    const attachmentsBatchNumber = +new Date()

    const { settings } = useSelector((state) => state.company)

    const [announcement, setAnnouncement] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(async () => {
        if (settings) {
            // We only want company-level settings for the time zone
            setCurrentSettings(insightUtils.getSettings(settings, null))
        }
    }, [settings])

    useEffect(async() => {
        if (params.announcementId) {
            const results = await store.dispatch(loadAnnouncement({announcementId: params.announcementId})).unwrap()
            let newAnnouncement = Object.assign({}, results.data.announcement)
            newAnnouncement.send_at = insightUtils.parseDateTime(newAnnouncement.send_at)
            setAnnouncement(newAnnouncement)
        }
        else {
            setAnnouncement(insightUtils.emptyAnnouncement())
        }
    }, [])

    const filterPassedTime = (time) => {
        const currentDate = new Date();
        const selectedDate = new Date(time);

        if (currentDate.getTime() < selectedDate.getTime()) {
            // Now... is it between 8am and 5:00pm?
            return selectedDate.getHours() >= 8 && (selectedDate.getHours() <= 16 || (selectedDate.getHours() == 17 && selectedDate.getMinutes() == 0))
        }
        else {
            return false
        }
    };

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        values.attachments_batch_number = attachmentsBatchNumber
        if (!Array.isArray(values.mediums)) values.mediums = values.mediums.split(",")

        if (!values.mediums || values.mediums.length == 0) {
            setBaseErrorMessage("Please select one method of delivery (email, chat or text)")
            return;
        }

        const results = await store.dispatch(saveAnnouncement({announcement: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            navigate(insightRoutes.announcementEditRecipients(response.announcement.hash_id))
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base.join(", "))
            }

            insightUtils.scrollTo('errors')
        }
    }

    function closeView(newAnnouncementId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a announcement, send it back to the calling form
            if (newAnnouncementId && location.state.field_to_update) newValues[location.state.field_to_update] = newAnnouncementId

            navigate(location.state.return_url, {state: {values: newValues}})
        }
        else {
            navigate(insightRoutes.announcementList())
        }
    }

    return (
        <>
            <div className="section">
            {announcement && <>
                <img className="section-img" src="/images/photo-communications.jpg" />
                <h2>{announcement.id ? (announcement.sent_at ? "View Announcement" : "Edit Announcement") : "Add Announcement"}</h2>

                {announcement.sent_at ?
                    <p>This announcement has already been sent. You can see what was sent below.</p>
                    :
                    <p>Use this form to {announcement.id ? "edit" : "create"} a announcement.</p>
                }

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={announcement}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="add-property-wrap">
                                <div className="form-row">
                                    <FormItem label="Subject" name="subject" disabled={announcement.sent_at} />
                                </div>

                                <div className="form-row">
                                    <FormItem name="body" label="Message">
                                        <Field component="textarea" rows={4} name="body" className="form-input form-input-white" placeholder="Type your message" disabled={announcement.sent_at} />
                                    </FormItem>
                                </div>

                                <div className="form-row">
                                    <FormItem formItemClass="form-item-33" name="mediums" label="How Do You Want to Send It?">
                                        <CheckBoxGroup name="mediums" options={[{id: "email", name: "Email"}, {id: "chat", name: "Chat"}, {id: "text", name: "Text"}]} direction="row" disabled={announcement.sent_at} />
                                    </FormItem>

                                    <FormItem formItemClass="form-item-33" name="send_when" label="When Do You Want to Send It?">
                                        <RadioButtonGroup name="send_when" options={[{id: "immediately", name: "Immediately"}, {id: "scheduled", name: "At a Scheduled Time"}]} direction="row" disabled={announcement.sent_at} />
                                    </FormItem>

                                    {values.send_when == "scheduled" &&

                                        <FormItem formItemClass="form-item-33 renter-insight-time-picker" label="Send at" name="send_at" optional={true}>
                                            <DatePicker className="form-input form-input-white"
                                                        selected={values.send_at}
                                                        onChange={(date) => setFieldValue("send_at", date)}
                                                        showTimeSelect
                                                        timeFormat="h:mm aa"
                                                        timeIntervals={15}
                                                        filterTime={filterPassedTime}
                                                        minDate={new Date()}
                                                        dateFormat="MM/dd/yyyy h:mm aa"
                                                        disabled={announcement.sent_at}
                                            />
                                            <div className="text-muted text-left" style={{marginTop: "5px"}}>{currentSettings.time_zone}</div>
                                        </FormItem>
                                    }

                                </div>

                                <AnnouncementAttachmentsView announcement={announcement} attachmentsBatchNumber={attachmentsBatchNumber} preventDelete={announcement.sent_at} preventUpload={announcement.sent_at} />

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? (!announcement.sent_at ? "Continue to Select Recipients" : "Continue to View Recipients") : "Continuing..."}</span>
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </>}
            </div>
        </>
    )
}

export default AnnouncementEditPage;

