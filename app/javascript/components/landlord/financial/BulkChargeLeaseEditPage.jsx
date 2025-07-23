import React, {useEffect, useState} from 'react';

import {useLocation, useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import {loadBulkCharge, saveBulkChargeLeases} from "../../../slices/chargeSlice";
import {searchForLeases} from "../../../slices/leaseSlice";
import BulkChargeLeaseListRow from "./BulkChargeLeaseListRow";
import ListPage from "../../shared/ListPage";
import Modal from "../../shared/Modal";

const BulkChargeLeaseEditPage = ({}) => {
    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { properties } = useSelector((state) => state.company)

    const [bulkCharge, setBulkCharge] = useState(null)
    const [isSending, setIsSending] = useState(false)

    const [leaseResidents, setLeaseResidents] = useState([])
    const [selectedLeaseResidents, setSelectedLeaseResidents] = useState([])
    const [allLeaseResidentsSelected, setAllLeaseResidentsSelected] = useState(false)
    const [reloadResidentList, setReloadResidentList] = useState(false)

    const [selectingSpecificLeases, setSelectingSpecificLeases] = useState(false)
    const [leasesAddedInModal, setLeasesAddedInModal] = useState(0)


    const [bulkChargeLeases, setBulkChargeLeases] = useState([])
    const [initialBulkChargeLeases, setInitialBulkChargeLeases] = useState({})

    const [selectedLeases, setSelectedLeases] = useState([])
    const [allLeasesSelected, setAllLeasesSelected] = useState(false)
    const [reloadBulkChargeLeaseList, setReloadBulkChargeLeaseList] = useState(true)

    const [propertyId, setPropertyId] = useState(null)
    const [searchByStatus, setSearchByStatus] = useState("current")

    const [daysFrom, setDaysFrom] = useState(null)
    const [daysTo, setDaysTo] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        const results = await store.dispatch(loadBulkCharge({bulkChargeId: params.bulkChargeId})).unwrap()

        let newInitialBulkChargeLeases = {}

        results.data.bulk_charge.bulk_charge_leases.forEach((bulkChargeLease) => {
            newInitialBulkChargeLeases["s" + bulkChargeLease.id] = {
                amount: bulkChargeLease.amount,
                description: bulkChargeLease.description
            }
        })

        setInitialBulkChargeLeases(newInitialBulkChargeLeases)
        setBulkChargeLeases(results.data.bulk_charge.bulk_charge_leases)
        setBulkCharge(results.data.bulk_charge)

    }, [])

    useEffect(() => {
        setReloadResidentList(true)
    }, [propertyId, searchByStatus, daysFrom, daysTo])

    // Is everyone selected? If so, switch the select all checkbox
    useEffect(() => {
        if (selectedLeaseResidents && leaseResidents) {
            let allSelected = leaseResidents.length > 0

            leaseResidents.forEach((lr) => { allSelected = allSelected && (selectedLeaseResidents.indexOf(lr.hash_id) >= 0)})

            setAllLeaseResidentsSelected(allSelected)
        }
    }, [selectedLeaseResidents, leaseResidents])

    useEffect(() => {
        if (selectedLeases && bulkChargeLeases) {
            let allSelected = bulkChargeLeases.length > 0

            bulkChargeLeases.forEach((bcl) => { allSelected = allSelected && (selectedLeases.indexOf(bcl.selection_id || bcl.id) >= 0)})

            setAllLeasesSelected(allSelected)
        }
    }, [selectedLeases, bulkChargeLeases])

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
            }
        )

        setLeaseResidents(newLeaseResidents)
        setReloadResidentList(false)
        return {total: newLeaseResidents.length, objects: newLeaseResidents}
    }

    function inRecipientList(leaseResident) {
        let inList = false
        if (bulkChargeLeases && bulkChargeLeases.length > 0) {
            inList = !!bulkChargeLeases.find((ar) => { if (ar.recipient_id == leaseResident.id) return true})
        }

        return inList
    }

    function generateResidentTableRow(leaseResident, key) {
        return (<BulkChargeLeaseListRow key={key} leaseResident={leaseResident} bulkCharge={bulkCharge} bulkChargeLease={{recipient_id: leaseResident.resident_id}} selected={selectedLeaseResidents} setSelected={setSelectedLeaseResidents} />)
    }

    async function runRecipientSearch(text, page) {
        setReloadBulkChargeLeaseList(false)
        return {total: bulkChargeLeases.length, objects: bulkChargeLeases}
    }

    function generateBulkChargeLeaseTableRow(bulkChargeLease, key) {
        return (<BulkChargeLeaseListRow key={key} bulkCharge={bulkCharge} bulkChargeLease={bulkChargeLease} selected={selectedLeases} setSelected={setSelectedLeases} />)
    }

    function handleSelectAllLeases(e) {
        if (allLeasesSelected) {
            setSelectedLeases([])
        }
        else {
            let newSelectedLeases = [...selectedLeases]
            bulkChargeLeases.forEach((bcl) => { if (newSelectedLeases.indexOf(bcl.selection_id || bcl.id) < 0) newSelectedLeases.push(bcl.selection_id || bcl.id)})
            setSelectedLeases(newSelectedLeases)
        }
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
    }

    async function handleAddBulkChargeLeases(setFieldValue) {
        let newLeases = [...bulkChargeLeases]

        // Call for the leases that match the criteria
        const searchResults = await runResidentSearch()

        if (searchResults.objects.length > 0) {
            searchResults.objects.forEach((lr) => {
                newLeases.push({
                    selection_id: "LeaseResident:" + lr.hash_id,
                    recipient_id: lr.id,
                    property_id: lr.lease?.property_id,
                    lease_id: lr.lease_id,
                    lease: lr.lease,
                    resident: lr.resident,
                    lease_resident: lr,
                    property_name: lr.lease?.property_name,
                    unit_number_or_street: lr.lease?.unit_number_or_street
                })

                setFieldValue("bulk_charge_leases.sLeaseResident:" + lr.hash_id + ".amount", bulkCharge.amount)
                setFieldValue("bulk_charge_leases.sLeaseResident:" + lr.hash_id + ".description", bulkCharge.description)
            })
        }
        else {
            alert('No leases match your criteria')
        }

        setBulkChargeLeases(newLeases)
        setReloadBulkChargeLeaseList(true)
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

    function handleAddSelectedLeases(setFieldValue) {
        let newLeases = [... bulkChargeLeases]
        let newLeasesAddedInModal = 0
        leaseResidents.forEach((lr) => {
            if (selectedLeaseResidents.indexOf(lr.hash_id) >= 0 && newLeases.indexOf(lr) < 0) {
                newLeasesAddedInModal++
                newLeases.push({
                    selection_id: "LeaseResident:"+lr.hash_id,
                    recipient_id: lr.id,
                    property_id: lr.lease?.property_id,
                    lease_id: lr.lease_id,
                    lease: lr.lease,
                    resident: lr.resident,
                    lease_resident: lr,
                    property_name: lr.lease?.property_name,
                    unit_number_or_street: lr.lease?.unit_number_or_street
                })

                setFieldValue("bulk_charge_leases.sLeaseResident:"+lr.hash_id+".amount", bulkCharge.amount)
                setFieldValue("bulk_charge_leases.sLeaseResident:"+lr.hash_id+".description", bulkCharge.description)

            }
        })
        setLeasesAddedInModal(newLeasesAddedInModal + leasesAddedInModal)
        setBulkChargeLeases(newLeases)
        setReloadResidentList(true)
        setReloadBulkChargeLeaseList(true)
        setSelectedLeaseResidents([])
        insightUtils.scrollTo('recipient_list')

    }

    function handleRemoveSelectedLeases() {
        let newLeases = bulkChargeLeases.filter((bcl) => {return selectedLeases.indexOf(bcl.id || bcl.selection_id) < 0})
        
        setBulkChargeLeases(newLeases)
        setSelectedLeases([])
        setReloadResidentList(true)
        setReloadBulkChargeLeaseList(true)
    }

    async function handlePostBulkCharges(values, setErrors) {
        if (!isSending) {
            setIsSending(true)

            try {
                const bulkChargeLeasesToSave = bulkChargeLeases.map((bulkChargeLease) =>
                    {
                       const matchingValue = values.bulk_charge_leases["s" + (bulkChargeLease.id || bulkChargeLease.selection_id)];

                       return ({
                            id: bulkChargeLease.id,
                            selection_id: bulkChargeLease.selection_id,
                            property_id: bulkChargeLease.property_id,
                            lease_id: bulkChargeLease.lease_id,
                            amount: matchingValue?.amount,
                            description: matchingValue?.description
                        })
                    }
                )

                const results = await store.dispatch(saveBulkChargeLeases({bulkChargeId: bulkCharge.hash_id, bulkChargeLeases: bulkChargeLeasesToSave})).unwrap()
                console.log(results)

                if (results.data.success) {
                    navigate(insightRoutes.bulkChargeList())
                }
                else {
                    if (results.data.errors.base) {
                        setBaseErrorMessage(results.data.errors.base)
                    }
                    else {
                        let newErrors = {}

                        // Need to turn errors back into hash form
                        if (results.data.errors.bulk_charge_leases) {
                            Object.keys(results.data.errors.bulk_charge_leases).forEach((index) => {
                                const bulkChargeLeaseErrors = results.data.errors.bulk_charge_leases[index]
                                if (Object.values(bulkChargeLeaseErrors).length > 0) {
                                    newErrors['s' + (bulkChargeLeasesToSave[index].id || bulkChargeLeasesToSave[index].selection_id)] = bulkChargeLeaseErrors
                                }
                            })

                            setErrors({bulk_charge_leases: newErrors})
                        }

                        setBaseErrorMessage("Could not save bulk charges")
                    }

                    setIsSending(false)
                }
            }
            catch (e) {
                console.log(e)
                setBaseErrorMessage("Could not save bulk charges")
                setIsSending(false)
            }
        }
    }

    function closeView(newAnnouncementId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a bulkCharge, send it back to the calling form
            if (newAnnouncementId && location.state.field_to_update) newValues[location.state.field_to_update] = newAnnouncementId

            navigate(location.state.return_url, {state: {values: newValues}})
        }
        else {
            navigate(insightRoutes.bulkChargeList())
        }
    }

    return (
        <>
            <div className="section">
                {bulkCharge && properties && <>
                    <img className="section-img" src="/images/photo-accounting.jpg"/>
                    <h2>Select Leases</h2>
                    <h3>{bulkCharge.description}</h3>

                    <p>Use this form to select the leases for this bulk charge.</p>

                    <Formik initialValues={{propertyId: "", status: searchByStatus, days_from: daysFrom, days_to: daysTo, bulk_charge_leases: initialBulkChargeLeases}}>
                        {({values, setErrors, setFieldValue}) => (
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

                                        <div className="form-item form-item-33">
                                            <div>
                                                <a onClick={() => handleAddBulkChargeLeases(setFieldValue)} className="btn btn-red">Add All</a>
                                                {" "}
                                                <a onClick={() => setSelectingSpecificLeases(true)} className="btn btn-gray">Select Specific Leases</a>
                                            </div>

                                        </div>

                                    </div>
                                </div>

                                <div className="recipient_list"></div>
                                {bulkChargeLeases && bulkChargeLeases.length > 0 && <>
                                    <hr/>
                                    <h3>Selected Leases</h3>
                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                    <ListPage
                                        titleImage={<React.Fragment/>}
                                        runSearch={runRecipientSearch}
                                        moveSecondaryNavAsNeeded={true}
                                        hideSearch={true}
                                        paramPrefix="announcement_recipients_"
                                        addButton={<>
                                            {selectedLeases.length > 0 &&
                                                <button className="btn btn-red" onClick={() => handleRemoveSelectedLeases()}>
                                                    <span>Remove Leases</span>
                                                </button>
                                            }
                                        </>}
                                        noDataMessage="No Leases Added"
                                        numberPerPage={10}
                                        columns={[
                                            {label: "Name", class: "st-col-15", sort_by: "resident.last_name", selectAll: handleSelectAllLeases},
                                            {label: "Property", class: "st-col-25", sort_by: "property_name"},
                                            {label: "Unit", class: "st-col-10", sort_by: "unit_number_or_street", data_type: "integer_or_string"}
                                        ].concat(bulkCharge.same_for_all ? [] :
                                            [
                                                {label: "Amount", class: "st-col-25", sort_by: "amount", data_type: "float"},
                                                {label: "Description", class: "st-col-25", sort_by: "description"}
                                            ] )}
                                        allSelected={allLeasesSelected}
                                        defaultSortBy="resident.last_name"
                                        defaultSortDir="asc"
                                        generateTableRow={generateBulkChargeLeaseTableRow}
                                        reloadWhenChanges={reloadBulkChargeLeaseList}
                                    />
                                </>}

                                <div className="add-property-wrap">
                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray">
                                            <span>Cancel</span>
                                        </a>
                                        <a onClick={() => navigate(insightRoutes.bulkChargeEdit(bulkCharge.hash_id))} className="btn btn-gray">
                                            <span>Edit Bulk Charge</span>
                                        </a>
                                        {bulkChargeLeases && bulkChargeLeases.length > 0 &&
                                            <a onClick={() => handlePostBulkCharges(values, setErrors)} className="btn btn-red">
                                                <span>{isSending ? "Saving..." : "Save Lease Selections"}</span>
                                            </a>
                                        }
                                    </div>
                                </div>

                                {selectingSpecificLeases && <Modal closeModal={() => {setSelectingSpecificLeases(false); setLeasesAddedInModal(0) }}>
                                    <br/>

                                    <ListPage
                                        titleImage={<React.Fragment/>}
                                        secondaryNav={<><div className="flex flex-row">
                                            <button className={selectedLeaseResidents.length == 0 ? "btn btn-gray-light" : "btn btn-red"} onClick={() => handleAddSelectedLeases(setFieldValue)} disabled={selectedLeaseResidents.length == 0}>
                                                <span>Add {selectedLeaseResidents.length == 1 ? "Lease" : "Leases"}</span>
                                            </button>
                                            &nbsp;
                                            {leasesAddedInModal > 0 &&
                                                <button className="btn btn-gray" onClick={() => {
                                                    setSelectingSpecificLeases(false);
                                                    setLeasesAddedInModal(0)
                                                }}>
                                                    <span>Done</span>
                                                </button>
                                            }
                                            </div>
                                            {leasesAddedInModal > 0 && <div style={{paddingTop: "4px"}}>{leasesAddedInModal} {leasesAddedInModal == 1 ? "Lease" : "Leases"} Added</div>}
                                        </>}
                                        runSearch={runResidentSearch}
                                        moveSecondaryNavAsNeeded={true}
                                        noDataMessage="No leases match your criteria"
                                        numberPerPage={10}
                                        columns={[
                                            {label: "Name", class: "st-col-15", sort_by: "resident.last_name", selectAll: handleSelectAllResidents},
                                            {label: "Property", class: "st-col-25", sort_by: "lease.property_name"},
                                            {label: "Unit", class: "st-col-10", sort_by: "lease.unit_number_or_street", data_type: "integer_or_string"}
                                        ]}
                                        allSelected={allLeaseResidentsSelected}
                                        defaultSortBy="resident.last_name"
                                        defaultSortDir="asc"
                                        generateTableRow={generateResidentTableRow}
                                        reloadWhenChanges={reloadResidentList}
                                    />

                                    <div className="add-property-wrap">
                                        <div className="form-nav">
                                            {selectedLeaseResidents.length > 0 &&
                                                <button className="btn btn-red" onClick={() => handleAddSelectedLeases(setFieldValue)}>
                                                    <span>Add Leases</span>
                                                </button>
                                            }
                                            <button className="btn btn-gray" onClick={() => {setSelectingSpecificLeases(false); setLeasesAddedInModal(0) }}>
                                                <span>Done</span>
                                            </button>
                                        </div>
                                    </div>

                                </Modal>}
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>


        </>
    )
}


export default BulkChargeLeaseEditPage;

