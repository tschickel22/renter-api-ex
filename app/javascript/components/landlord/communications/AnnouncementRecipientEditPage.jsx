import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import store from "../../../app/store";

import {Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {loadAnnouncement, saveAnnouncementRecipients} from "../../../slices/announcementSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import ListPage from "../../shared/ListPage";
import {searchForLeases} from "../../../slices/leaseSlice";
import {useSelector} from "react-redux";
import AnnouncementRecipientListRow from "./AnnouncementRecipientListRow";

const AnnouncementRecipientEditPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { properties } = useSelector((state) => state.company)

    const [announcement, setAnnouncement] = useState(null)
    const [isSending, setIsSending] = useState(false)

    const [leaseResidents, setLeaseResidents] = useState([])
    const [selectedLeaseResidents, setSelectedLeaseResidents] = useState([])
    const [allLeaseResidentsSelected, setAllLeaseResidentsSelected] = useState(false)
    const [reloadResidentList, setReloadResidentList] = useState(false)

    const [announcementRecipients, setAnnouncementRecipients] = useState([])
    const [selectedRecipients, setSelectedRecipients] = useState([])
    const [allRecipientsSelected, setAllRecipientsSelected] = useState(false)
    const [reloadRecipientList, setReloadRecipientList] = useState(true)

    const [propertyId, setPropertyId] = useState(null)
    const [searchByStatus, setSearchByStatus] = useState("current")
    const [recipientOption, setRecipientOption] = useState("all")

    const [daysFrom, setDaysFrom] = useState(null)
    const [daysTo, setDaysTo] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        const results = await store.dispatch(loadAnnouncement({announcementId: params.announcementId})).unwrap()
        setAnnouncement(results.data.announcement)
        setAnnouncementRecipients(results.data.announcement.announcement_recipients)

    }, [])

    useEffect(() => {
        if (recipientOption == "select") {
            setReloadResidentList(true)
        }
    }, [propertyId, searchByStatus, daysFrom, daysTo, recipientOption])

    // Is everyone selected? If so, switch the select all checkbox
    useEffect(() => {
        if (selectedLeaseResidents && leaseResidents) {
            let allSelected = leaseResidents.length > 0

            leaseResidents.forEach((lr) => { allSelected = allSelected && (selectedLeaseResidents.indexOf(lr.hash_id) >= 0)})

            setAllLeaseResidentsSelected(allSelected)
        }
    }, [selectedLeaseResidents, leaseResidents])

    useEffect(() => {
        if (selectedRecipients && announcementRecipients) {
            let allSelected = announcementRecipients.length > 0

            announcementRecipients.forEach((lr) => { allSelected = allSelected && (selectedRecipients.indexOf(lr.hash_id) >= 0)})

            setAllRecipientsSelected(allSelected)
        }
    }, [selectedRecipients, announcementRecipients])

    function handlePropertySelected(e) {
        setPropertyId(e.target.value)
    }

    async function runResidentSearch(text, page) {
        const results = await store.dispatch(searchForLeases({propertyId: propertyId, mode: "residents", daysFrom: daysFrom, daysTo: daysTo, searchText: text, status: searchByStatus})).unwrap()
        let newLeaseResidents = []

        // Flatten the leases into an array of residents, back-populating the lease object for use by the row element
        results.data.leases.forEach((lease) =>
            {
                if (!inRecipientList(lease.primary_resident)) {
                    newLeaseResidents.push({...lease.primary_resident, lease: lease})
                }

                if (lease.secondary_residents && lease.secondary_residents.length > 0) {
                    lease.secondary_residents.forEach((secondaryResident) => {
                        if (!inRecipientList(secondaryResident)) {
                            newLeaseResidents.push({...secondaryResident, lease: lease})
                        }
                    })
                }
            }
        )

        setLeaseResidents(newLeaseResidents)
        setReloadResidentList(false)
        return {total: newLeaseResidents.length, objects: newLeaseResidents}
    }

    function inRecipientList(leaseResident) {
        let inList = false
        if (announcementRecipients && announcementRecipients.length > 0) {
            inList = !!announcementRecipients.find((ar) => { if (ar.recipient_type == "LeaseResident" && ar.recipient_id == leaseResident.id) return true})
        }

        return inList
    }

    function generateResidentTableRow(leaseResident, key) {
        return (<AnnouncementRecipientListRow key={key} leaseResident={leaseResident} announcementRecipient={{recipient_id: leaseResident.resident_id, recipient_type: "LeaseResident"}} selected={selectedLeaseResidents} setSelected={setSelectedLeaseResidents} />)
    }

    async function runRecipientSearch(text, page) {
        setReloadRecipientList(false)
        return {total: announcementRecipients.length, objects: announcementRecipients}
    }

    function generateRecipientTableRow(announcementRecipient, key) {
        return (<AnnouncementRecipientListRow key={key} announcementRecipient={announcementRecipient} selected={selectedRecipients} setSelected={setSelectedRecipients} />)
    }

    function handleSelectAllRecipients(e) {
        if (allRecipientsSelected) {
            setSelectedRecipients([])
        }
        else {
            let newSelectedRecipients = [...selectedRecipients]
            announcementRecipients.forEach((lr) => { if (newSelectedRecipients.indexOf(lr.hash_id) < 0) newSelectedRecipients.push(lr.hash_id)})
            setSelectedRecipients(newSelectedRecipients)
        }
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
    }

    function handleRecipientOptionChange(e) {
        setRecipientOption(e.target.value)
    }

    function handleAddAnnouncementRecipient() {
        let newRecipients = [...announcementRecipients]

        newRecipients.push({
            selection_id: +new Date(),
            recipient_id: propertyId,
            recipient_type: propertyId > 0 ? "Property" : "Company",
            recipient_conditions: {status: searchByStatus},
            recipient_conditions_pretty: "Resident Status: "+searchByStatus
        })

        setAnnouncementRecipients(newRecipients)
        setReloadRecipientList(true)
    }

    function handleSelectAllResidents(e) {
        if (allLeaseResidentsSelected) {
            setSelectedLeaseResidents([])
        }
        else {
            let newSelectedLeaseResidents = [...selectedLeaseResidents]
            leaseResidents.forEach((lr) => { if (newSelectedLeaseResidents.indexOf(lr.hash_id) < 0) newSelectedLeaseResidents.push(lr.hash_id)})
            setSelectedLeaseResidents(newSelectedLeaseResidents)
        }
    }

    function handleAddSelectedRecipients() {
        let newRecipients = [... announcementRecipients]
        leaseResidents.forEach((lr) => {
            if (selectedLeaseResidents.indexOf(lr.hash_id) >= 0 && newRecipients.indexOf(lr) < 0) {
                newRecipients.push({
                    selection_id: "LeaseResident:"+lr.hash_id,
                    recipient_id: lr.id,
                    recipient_type: "LeaseResident",
                    resident: lr.resident
                })
            }
        })
        setAnnouncementRecipients(newRecipients)
        setReloadResidentList(true)
        setReloadRecipientList(true)
        setSelectedLeaseResidents([])
        insightUtils.scrollTo('recipient_list')

    }

    function handleRemoveSelectedRecipients() {
        let newRecipients = announcementRecipients.filter((ar) => {return selectedRecipients.indexOf(ar.id || ar.selection_id) < 0})
        setAnnouncementRecipients(newRecipients)
        setSelectedRecipients([])
        setReloadResidentList(true)
        setReloadRecipientList(true)
    }

    async function handleSendAnnouncement() {
        if (!isSending) {
            setIsSending(true)

            try {
                const recipientTypesAndIds = announcementRecipients.map((recipient) => ({id: recipient.id, type: recipient.type}))
                const results = await store.dispatch(saveAnnouncementRecipients({announcementId: announcement.hash_id, announcementRecipients: announcementRecipients})).unwrap()
                console.log(results)

                if (results.data.success) {
                    navigate(insightRoutes.announcementConfirmation(announcement.hash_id))
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
                <h2>{announcement.sent_at ? "View Recipients" : "Select Recipients"}</h2>
                <h3>{announcement.subject}</h3>

                {announcement.sent_at ?
                    <p>This announcement has already been sent. You can see the recipients below.</p>
                    :
                    <p>Use this form to select the recipients for this announcement.</p>
                }

                {!announcement.sent_at &&
                    <Formik initialValues={{propertyId: "", status: searchByStatus, days_from: daysFrom, days_to: daysTo, recipient_option: recipientOption}}>
                        {({}) => (
                            <Form>
                                <div className="st-nav">
                                    <div className="form-row">
                                        <FormItem label="Company / Property" name="property_id" formItemClass="form-item-33">
                                            <BasicDropdown name="property_id" blankText="All Properties" options={properties} onChange={(e) => {
                                                handlePropertySelected(e)
                                            }}/>
                                        </FormItem>

                                        <FormItem label="Resident Status" name="status" formItemClass="form-item-33">
                                            <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "current", name: "Current"}, {id: "future", name: "Future"}, {id: "former", name: "Former"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide"/>
                                        </FormItem>


                                        {["expiring", "move_in", "move_out"].indexOf(searchByStatus) >= 0 &&
                                            <FormItem label={<>&nbsp;</>} name="days_from" formItemClass="form-item-33 flex-nowrap" optional={true}>
                                                <div className="flex-row flex-nowrap">
                                                    <BasicDropdown name="days_from" options={[{id: "0", name: "Today"}, {id: "31", name: "31 Days"}, {id: "61", name: "61 Days"}]} onChange={(e) => setDaysFrom(e.target.value)}/>
                                                    <div style={{lineHeight: "2rem"}}>&nbsp;&nbsp;to&nbsp;&nbsp;</div>
                                                    <BasicDropdown name="days_to" options={[{id: "30", name: "30 Days"}, {id: "60", name: "60 Days"}, {id: "90", name: "90 Days"}]} onChange={(e) => setDaysTo(e.target.value)}/>
                                                </div>
                                            </FormItem>
                                        }

                                        <FormItem label="Recipient Option" name="recipient_option" formItemClass="form-item-33">
                                            <BasicDropdown name="recipient_option" options={[{id: "all", name: "All"}, {id: "select", name: "Select Specific Residents"}]} onChange={(e) => handleRecipientOptionChange(e)} extraClass="form-select-wide"/>
                                        </FormItem>

                                        <div className="form-item form-item-33">
                                            <a onClick={() => handleAddAnnouncementRecipient()} className="btn btn-red">Add</a>
                                        </div>

                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                }

                {searchByStatus != "none" && recipientOption == "select" && <>
                    <hr/>

                    <ListPage
                        titleImage={<React.Fragment/>}
                        secondaryNav={<>
                            {selectedLeaseResidents.length > 0 &&
                                <button className="btn btn-red" onClick={() => handleAddSelectedRecipients()}>
                                    <span>Add Recipients</span>
                                </button>
                            }
                        </>}
                        runSearch={runResidentSearch}
                        moveSecondaryNavAsNeeded={true}
                        noDataMessage="No Residents Found"
                        numberPerPage={10}
                        columns={[
                            {label: "Name", class: "st-col-25 st-col-md-75", sort_by: "resident.last_name", selectAll: handleSelectAllResidents},
                            {label: "Property", class: "st-col-30 hidden-md", sort_by: "property_name"},
                            {label: "Email", class: "st-col-25 hidden-md", sort_by: "email"},
                            {label: "Phone", class: "st-col-25 hidden-md", sort_by: "phone"},
                        ]}
                        allSelected={allLeaseResidentsSelected}
                        defaultSortBy="resident.last_name"
                        defaultSortDir="asc"
                        generateTableRow={generateResidentTableRow}
                        reloadWhenChanges={reloadResidentList}
                    />

                    {selectedLeaseResidents.length > 0 &&
                        <div className="add-property-wrap">
                            <div className="form-nav">
                                <button className="btn btn-red" onClick={() => handleAddSelectedRecipients()}>
                                    <span>Add Recipients</span>
                                </button>
                            </div>
                        </div>
                    }
                </>}

                <div className="recipient_list"></div>
                {announcementRecipients && announcementRecipients.length > 0 && <>
                    <hr/>
                    <h3>Selected Recipients</h3>
                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <ListPage
                        titleImage={<React.Fragment/>}
                        runSearch={runRecipientSearch}
                        moveSecondaryNavAsNeeded={true}
                        hideSearch={true}
                        paramPrefix="announcement_recipients_"
                        addButton={<>
                            {selectedRecipients.length > 0 &&
                                <button className="btn btn-red" onClick={() => handleRemoveSelectedRecipients()}>
                                    <span>Remove Recipients</span>
                                </button>
                            }
                        </>}
                        noDataMessage="No Recipients Added"
                        numberPerPage={10}
                        columns={[
                            {label: "Name", class: "st-col-25 st-col-md-50", sort_by: "name", selectAll: handleSelectAllRecipients},
                            {label: "Info", class: "st-col-75 st-col-md-50", sort_by: "dummy"}
                        ]}
                        allSelected={allRecipientsSelected}
                        defaultSortBy="resident.last_name"
                        defaultSortDir="asc"
                        generateTableRow={generateRecipientTableRow}
                        reloadWhenChanges={reloadRecipientList}
                    />
                </>}
                <div className="add-property-wrap">
                    <div className="form-nav">
                        <a onClick={() => closeView()} className="btn btn-gray">
                            <span>{!announcement.sent_at ? "Cancel" : "Return to List"}</span>
                        </a>
                        <a onClick={() => navigate(insightRoutes.announcementEdit(announcement.hash_id))} className="btn btn-gray">
                            <span>Edit Content</span>
                        </a>
                        {!announcement.sent_at && announcementRecipients && announcementRecipients.length > 0 &&
                            <a onClick={() => handleSendAnnouncement()} className="btn btn-red">
                                <span>{isSending ? "Saving..." : "Save Recipients"}</span>
                            </a>
                        }
                    </div>
                </div>
            </>}
            </div>
        </>
    )
}

export default AnnouncementRecipientEditPage;

