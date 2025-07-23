import React, {useEffect, useState} from 'react';
import store from "../../../app/store";

import {Link} from "react-router-dom";
import MaintenanceRequestListRow from "./MaintenanceRequestListRow";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {searchForMaintenanceRequests} from "../../../slices/maintenanceRequestSlice";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import ToggleSwitch from "../../shared/ToggleSwitch";
import {useSelector} from "react-redux";

const MaintenanceRequestListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    const [maintenanceRequestCount, setMaintenanceRequestCount] = useState(null)
    const [triggerRefresh, setTriggerRefresh] = useState(false)
    const [searchByStatus, setSearchByStatus] = useState("open")
    const [excludeRecurring, setExcludeRecurring] = useState(false)

    async function runSearch(text) {
        const results = await store.dispatch(searchForMaintenanceRequests({searchText: text, excludeRecurring: excludeRecurring, status: searchByStatus})).unwrap()
        setMaintenanceRequestCount(results.data.total)
        setTriggerRefresh(false)
        return {total: results.data.total, objects: results.data.maintenance_requests}
    }

    function generateTableRow(maintenanceRequest, key) {
        return (<MaintenanceRequestListRow key={key} maintenanceRequest={maintenanceRequest} setTriggerRefresh={setTriggerRefresh} />)
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
        setTriggerRefresh(true)
    }

    function handleRecurringChange(newValue) {
        setExcludeRecurring(newValue)
        setTriggerRefresh(true)
    }

    return (
        <>
            {currentUser.maintenance_requests_view && <ListPage
                title="Maintenance Requests"
                subTitle={maintenanceRequestCount ? (maintenanceRequestCount == 1 ? maintenanceRequestCount + " Request" : maintenanceRequestCount + " Requests") : ""}
                titleImage={<img className="section-img" src="/images/photo-maintenance.jpg" />}
                runSearch={runSearch}
                addButton={currentUser.maintenance_requests_edit ? <Link to={insightRoutes.maintenanceRequestNew()} className="btn btn-red"><span>Add Ticket <i className="fas fa-plus"></i></span></Link> : null}
                secondaryNav={<>
                    <div className="smallspacer"></div>

                    <Formik initialValues={{status: searchByStatus, recurring: excludeRecurring}}>
                        {({  }) => (
                            <Form>
                                <div className="st-nav">
                                    <div className="form-item">
                                        <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "open_urgent", name: "Urgent Open Requests"}, {id: "open", name: "Open Requests"}, {id: "vendor_complete", name: "Vendor-Complete Requests"}, {id: "closed", name: "Closed Requests"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide" />
                                    </div>

                                    <ToggleSwitch label="Exclude Recurring?" name="recurring" onChange={(e) => handleRecurringChange(e)} />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}
                tableHeaderClass="st-row st-header st-row-5-col-table"
                columns={[
                    {label: "Ticket Info", class: "st-col-1", sort_by: "title"},
                    {label: "Tenant", class: "st-col-2 st-title", sort_by: "resident.last_name"},
                    {label: "Description", class: "st-col-3 st-maint-descr st-title", sort_by: "title"},
                    {label: "Status", class: "st-col-4 st-maint-status st-title", sort_by: "status"},
                    {label: "", class: "st-col-5 st-maint-messages st-title"},
                    {sort_by: "urgent_and_updated_at", hidden: true}
                ]}
                generateTableRow={generateTableRow}
                defaultSortBy={"urgent_and_updated_at"}
                defaultSortDir={"desc"}
                reloadWhenChanges={triggerRefresh}
            />}
        </>

    )}

export default MaintenanceRequestListPage;

