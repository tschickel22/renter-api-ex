import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {loadAnnouncement, loadAnnouncementRecipientLeaseResidents, saveAnnouncementRecipients, sendAnnouncement} from "../../../slices/announcementSlice";
import ListPage from "../../shared/ListPage";
import {useSelector} from "react-redux";
import AnnouncementRecipientListRow from "./AnnouncementRecipientListRow";

const AnnouncementConfirmationPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { properties } = useSelector((state) => state.company)

    const [announcement, setAnnouncement] = useState(null)
    const [isSending, setIsSending] = useState(false)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        const results = await store.dispatch(loadAnnouncement({announcementId: params.announcementId})).unwrap()
        setAnnouncement(results.data.announcement)
    }, [])

    async function runResidentSearch(searchText, page) {
        const results = await store.dispatch(loadAnnouncementRecipientLeaseResidents({announcementId: params.announcementId, searchText: searchText})).unwrap()

        return {total: results.data.lease_residents.length, objects: results.data.lease_residents}
    }


    function generateResidentTableRow(leaseResident, key) {
        return (<AnnouncementRecipientListRow key={key} leaseResident={leaseResident} announcementRecipient={{recipient_id: leaseResident.resident_id, recipient_type: "LeaseResident"}} />)
    }

    async function handleSendAnnouncement() {
        if (!isSending) {
            setIsSending(true)

            try {

                const results = await store.dispatch(sendAnnouncement({announcementId: announcement.hash_id})).unwrap()
                console.log(results)

                if (results.data.success) {
                    closeView(announcement.hash_id)
                }
                else {
                    if (results.data.errors.base) {
                        setBaseErrorMessage(results.data.errors.base)
                    }
                    else {
                        setBaseErrorMessage("Could not send announcement")
                    }

                    setIsSending(false)
                }
            }
            catch (e) {
                setBaseErrorMessage("Could not send announcement")
                setIsSending(false)
            }
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
            {announcement && properties && <>
                <img className="section-img" src="/images/photo-communications.jpg"/>
                <h2>Confirmation</h2>
                <h3>{announcement.subject}</h3>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                {announcement.sent_at ?
                    <p>This announcement has already been sent. You can see the recipients below.</p>
                    :
                    <p>Use this form to select the recipients for this announcement.</p>
                }


                <hr/>

                <ListPage
                    titleImage={<React.Fragment/>}
                    runSearch={runResidentSearch}
                    moveSecondaryNavAsNeeded={true}
                    noDataMessage="No Residents Found"
                    numberPerPage={10}
                    columns={[
                        {label: "Name", class: "st-col-25 st-col-md-75", sort_by: "resident.last_name"},
                        {label: "Property", class: "st-col-30 hidden-md", sort_by: "property_name"},
                        {label: "Email", class: "st-col-25 hidden-md", sort_by: "email"},
                        {label: "Phone", class: "st-col-25 hidden-md", sort_by: "phone"},
                    ]}
                    defaultSortBy="resident.last_name"
                    defaultSortDir="asc"
                    generateTableRow={generateResidentTableRow}
                />

                <div className="add-property-wrap">
                    <div className="form-nav">
                        <a onClick={() => closeView()} className="btn btn-gray">
                            <span>Return to List</span>
                        </a>
                        <a onClick={() => navigate(insightRoutes.announcementEdit(announcement.hash_id))} className="btn btn-gray hidden-md">
                            <span>Edit Content</span>
                        </a>
                        <a onClick={() => navigate(insightRoutes.announcementEditRecipients(announcement.hash_id))} className="btn btn-gray">
                            <span>Edit Recipients</span>
                        </a>
                        {!announcement.sent_at &&
                            <a onClick={() => handleSendAnnouncement()} className="btn btn-red">
                                <span>{isSending ? "Queueing..." : "Queue to Send"}</span>
                            </a>
                        }
                    </div>
                </div>
            </>}
            </div>
        </>
    )
}

export default AnnouncementConfirmationPage;

