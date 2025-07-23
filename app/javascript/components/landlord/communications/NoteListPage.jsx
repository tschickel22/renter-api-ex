import React, {useEffect, useState} from 'react';
import store from "../../../app/store";

import {useNavigate, useParams} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import {deleteCommunication, searchForCommunications} from "../../../slices/communicationSlice";
import NoteListRow from "./NoteListRow";
import {loadLease} from "../../../slices/leaseSlice";
import StatusBlock from "../leases/blocks/StatusBlock";
import LeaseNav from "../leases/LeaseNav";
import {deleteNote} from "../../../slices/announcementSlice";
import Modal from "../../shared/Modal";
import {runReport} from "../../../slices/reportSlice";

const NoteListPage = ({}) => {

    const params = useParams()
    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [searchParams, setSearchParams] = useState(null)
    const [lease, setLease] = useState(null)
    const [deletingNote, setDeletingNote] = useState(null)
    const [reloadTable, setReloadTable] = useState(0)

    useEffect(async() => {
        if (params.leaseId) {
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
            setLease(results.data.lease)
        }
    }, []);

    async function runSearch(text, page) {
        let newSearchParams = null

        if (params.leaseId) {
            newSearchParams = {
                relatedObjectType: "Lease",
                relatedObjectHashId: params.leaseId
            }
        }
        else if (params.propertyId) {
            newSearchParams = {
                relatedObjectType: "Property",
                relatedObjectHashId: params.propertyId
            }
        }
        else {
            newSearchParams = {
                relatedObjectType: "Company",
                relatedObjectHashId: currentUser.company_id
            }
        }

        newSearchParams.type = "CommunicationNotePrivate"
        newSearchParams.subType = "notes"
        newSearchParams.searchText = text

        setSearchParams(newSearchParams)

        const results = await store.dispatch(searchForCommunications(newSearchParams)).unwrap()

        return {total: results.data.total, objects: results.data.communications}
    }

    async function handleDeleteNote() {
        await store.dispatch(deleteCommunication({communication: deletingNote})).unwrap()

        setDeletingNote(null)
        setReloadTable(reloadTable + 1)
    }


    function generateTableRow(note, key) {
        return (<NoteListRow key={key} note={note} setDeletingNote={setDeletingNote} />)
    }

    function handleNavigateToNewNote() {
        // We want to go to the proper route depending on our current one
        if (params.leaseId) {
            navigate(insightRoutes.noteNewForLease(params.leaseId), {state: {return_url: location.pathname + (window.location.search || '')}})
        }
        else if (params.propertyId) {
            navigate(insightRoutes.noteNewForProperty(params.propertyId), {state: {return_url: location.pathname + (window.location.search || '')}})
        }
        else {
            navigate(insightRoutes.noteNew(), {state: {return_url: location.pathname + (window.location.search || '')}})
        }
    }

    async function handleExportToCSV() {

        // Call the server for the CSV
        const results = await store.dispatch(searchForCommunications({...searchParams,format: "csv"})).unwrap()

        // Now, have the browser download the data
        let blob = new Blob([results.data.csv], { "type": "text/csv;charset=utf8;" });
        let filename = "renter-insight-activity.csv";

        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        }
        else {
            const attachmentType = 'csv';
            let uri = 'data:attachment/'+ attachmentType +';charset=utf-8,' + encodeURI(results.data.csv);
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);

            link.setAttribute('visibility', 'hidden');
            link.download = filename

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    }

    return (
        <>
            {currentUser.communications_view && (!params.leaseId || lease) &&
                <div className="section">

                    {lease && <>
                        <StatusBlock lease={lease} title="Activity" />
                        <LeaseNav lease={lease} />
                    </>
                    }

                    <ListPage
                        titleImage={lease ? <></> : <img className="section-img" src="/images/photo-communications.jpg" />}
                        title={lease ? "" : `Activity for ${params.propertyId ? "Property" : "Company"}`}
                        runSearch={runSearch}
                        defaultSortBy="created_at"
                        defaultSortDir="desc"
                        addButton={
                            <div className="hidden-print flex-row flex-center">
                                <>
                                    {currentUser.communications_edit && <><a onClick={() => handleNavigateToNewNote()} className="btn btn-red"><span>Record Activity <i className="fas fa-plus"></i></span></a>&nbsp;</>}
                                </>
                                <a className="btn btn-gray" onClick={() => window.print()}>&nbsp;Print <i className="fa fa-print"></i></a>
                                &nbsp;
                                <a className="btn btn-gray" onClick={() => handleExportToCSV()}>&nbsp;Export <i className="fa fa-file-export"></i></a>
                            </div>
                        }
                        columns={[
                            {label: "Activity", class: "st-col-75", sort_by: "subject"},
                            {label: "Date", class: "st-col-10", sort_by: "created_at"},
                            {label: "User", class: "st-col-15", sort_by: "from.name"},
                        ]}
                        generateTableRow={generateTableRow}
                        reloadWhenChanges={reloadTable}
                        noDataMessage="No activity found"
                    />
                    </div>
            }

            {deletingNote &&
                <Modal closeModal={() => setDeletingNote(null)}>
                    <div className="form-nav">
                        Are you sure you want to delete <strong>{deletingNote.subject}</strong>?<br/><br/>
                        {deletingNote.body}
                    </div>
                    <div className="form-nav">
                        <a onClick={() => (setDeletingNote(null))} className="btn btn-gray"><span>No</span></a>
                        <a onClick={() => (handleDeleteNote())} className="btn btn-red"><span>Yes</span></a>
                    </div>
                </Modal>
            }
        </>
    )}

export default NoteListPage;
