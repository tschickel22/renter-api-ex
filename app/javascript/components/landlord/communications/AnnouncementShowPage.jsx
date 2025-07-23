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

const AnnouncementShowPage = () => {

    let params = useParams()

    const [announcement, setAnnouncement] = useState(null)

    useEffect(async() => {
        if (params.announcementId) {
            const results = await store.dispatch(loadAnnouncement({announcementId: params.announcementId})).unwrap()
            let newAnnouncement = Object.assign({}, results.data.announcement)
            newAnnouncement.send_at = insightUtils.parseDateTime(newAnnouncement.send_at)
            setAnnouncement(newAnnouncement)
        }
    }, [])


    return (
        <>
            <div className="section">
            {announcement && <>
                <img className="section-img" src="/images/photo-residents.jpg" />
                <h2>{announcement.subject}</h2>
                <p dangerouslySetInnerHTML={{__html: announcement.body}}></p>

                <AnnouncementAttachmentsView announcement={announcement} attachmentsBatchNumber={1} preventDelete={true} preventUpload={true} />

            </>}
            </div>
        </>
    )
}

export default AnnouncementShowPage;

