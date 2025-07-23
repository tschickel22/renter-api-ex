import React, {useState} from 'react';
import store from "../../../app/store";

import {Link, NavLink, useNavigate} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import AnnouncementListRow from "./AnnouncementListRow";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import {cloneAnnouncement, deleteAnnouncement, saveAnnouncement, searchForAnnouncements} from "../../../slices/announcementSlice";
import Modal from "../../shared/Modal";

const AnnouncementListPage = ({}) => {

    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [cancellingAnnouncement, setCancellingAnnouncement] = useState(null)
    const [deletingAnnouncement, setDeletingAnnouncement] = useState(null)
    const [reloadTable, setReloadTable] = useState(false)

    async function runSearch(text, page) {
        setReloadTable(false)
        const results = await store.dispatch(searchForAnnouncements({searchText: text})).unwrap()
        return {total: results.data.total, objects: results.data.announcements}
    }

    function generateTableRow(announcement, key) {
        return (<AnnouncementListRow key={key} announcement={announcement} setCancellingAnnouncement={setCancellingAnnouncement} cloneAnnouncement={handleCloneAnnouncement} setDeletingAnnouncement={setDeletingAnnouncement} />)
    }

    async function handleCancelDelivery() {
        let updatedAnnouncement = {...cancellingAnnouncement}

        updatedAnnouncement.send_when = 'cancelled'
        updatedAnnouncement.status = 'draft'

        await store.dispatch(saveAnnouncement({announcement: updatedAnnouncement})).unwrap()

        setCancellingAnnouncement(null)
        setReloadTable(true)
    }

    async function handleDeleteAnnouncement() {
        let updatedAnnouncement = {...deletingAnnouncement}

        updatedAnnouncement.send_when = 'cancelled'
        updatedAnnouncement.status = 'draft'

        await store.dispatch(deleteAnnouncement({announcementId: deletingAnnouncement.hash_id})).unwrap()

        setDeletingAnnouncement(null)
        setReloadTable(true)
    }

    async function handleCloneAnnouncement(announcement){
        try {
            const results = await store.dispatch(cloneAnnouncement({announcementId: announcement.hash_id})).unwrap()

            if (results?.data?.announcement) {
                navigate(insightRoutes.announcementEdit(results.data.announcement.hash_id))
                return
            }
        }
        catch (e) {

        }

        alert('Unable to clone announcement')

    }


    return (
        <>
        {currentUser.communications_view &&
            <ListPage
                titleImage={<img className="section-img" src="/images/photo-communications.jpg" />}
                title="Announcements"
                nav={
                    <div className="horiz-nav">
                        <div></div>
                        <ul className="horiz-nav-list">
                            <li className="hn-item"><NavLink to={insightRoutes.communicationCenter(currentUser)} className="hn-item">Communications Center</NavLink></li>
                            <li className="hn-item"><NavLink to={insightRoutes.announcementList()} className="hn-item">Announcements</NavLink></li>
                            <li className="hn-item"><NavLink to={insightRoutes.maintenanceRequestList()} className="hn-item">Maintenance Requests</NavLink></li>
                        </ul>
                        <div></div>
                    </div>
                }
                runSearch={runSearch}
                defaultSortBy="sent_at"
                defaultSortDir="desc"
                addButton={currentUser.communications_edit ? <Link to={insightRoutes.announcementNew()} state={{from: 'announcements'}} className="btn btn-red"><span>New Announcement <i className="fas fa-plus"></i></span></Link> : null}
                columns={[
                    {label: "Title", class: "st-col-25", sort_by: "subject"},
                    {label: "Sent By", class: "st-col-25", sort_by: "sent_by_name"},
                    {label: "Sent To", class: "st-col-25", sort_by: "recipient_summary"},
                    {label: "Resident Portal", class: "st-col-25", sort_by: "display_summary"},
                ]}
                generateTableRow={generateTableRow}
                reloadWhenChanges={reloadTable}
                noDataMessage="No announcements found."
            />
        }
            {cancellingAnnouncement &&
                <Modal closeModal={() => setCancellingAnnouncement(null)}>
                    <div className="form-nav">
                        Are you sure you want to cancel the delivery of this Announcement?
                    </div>
                    <div className="form-nav">
                        <a onClick={() => (setCancellingAnnouncement(null))} className="btn btn-gray"><span>No</span></a>
                        <a onClick={() => (handleCancelDelivery())} className="btn btn-red"><span>Yes</span></a>
                    </div>
                </Modal>
            }

            {deletingAnnouncement &&
                <Modal closeModal={() => setDeletingAnnouncement(null)}>
                    <div className="form-nav">
                        Are you sure you want to delete {deletingAnnouncement.subject}?
                    </div>
                    <div className="form-nav">
                        <a onClick={() => (setDeletingAnnouncement(null))} className="btn btn-gray"><span>No</span></a>
                        <a onClick={() => (handleDeleteAnnouncement())} className="btn btn-red"><span>Yes</span></a>
                    </div>
                </Modal>
            }
        </>
    )}

export default AnnouncementListPage;
