import React, {useEffect, useState} from 'react';
import store from "../../../app/store";

import {Link} from "react-router-dom";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {searchForMaintenanceRequests} from "../../../slices/maintenanceRequestSlice";
import RenterMaintenanceRequestListRow from "./RenterMaintenanceRequestListRow";
import {useSelector} from "react-redux";
import {loadLease} from "../../../slices/leaseSlice";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";

const RenterMaintenanceRequestListPage = ({}) => {

    const { constants } = useSelector((state) => state.company)

    const [maintenanceRequestCount, setMaintenanceRequestCount] = useState(null)
    const [lease, setLease] = useState(null)

    async function runSearch(text) {
        const results = await store.dispatch(searchForMaintenanceRequests({searchText: text})).unwrap()
        setMaintenanceRequestCount(results.data.total)
        return {total: results.data.total, objects: results.data.maintenance_requests}
    }

    function generateTableRow(maintenanceRequest, key) {
        return (<RenterMaintenanceRequestListRow key={key} maintenanceRequest={maintenanceRequest} />)
    }

    useEffect(async() => {

        /*
           Load Lease
         */
        if (!lease) {
            const leaseResidentResults = await store.dispatch(searchForLeaseResidents({})).unwrap()
            setLease(leaseResidentResults.data.lease_residents[0].lease)
        }

    }, []);

    return (
        <>
            <ListPage
                title="Maintenance Requests"
                subTitle={maintenanceRequestCount ? (maintenanceRequestCount == 1 ? maintenanceRequestCount + " Request" : maintenanceRequestCount + " Requests") : ""}
                titleImage={<img className="section-img" src="/images/photo-maintenance.jpg" />}
                runSearch={runSearch}
                addButton={
                    <div>
                        <Link to={insightRoutes.renterPortal()} className="text-gray">&lt; Back</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        {(!lease || lease.status != constants.lease_statuses.former.key) && <Link to={insightRoutes.renterMaintenanceRequestNew()} className="btn btn-red"><span>Add Ticket <i className="fas fa-plus"></i></span></Link>}
                    </div>

                }
                tableHeaderClass="st-row st-header st-row-5-col-table"
                noDataMessage={"You have no Maintenance Requests"}
                columns={[
                    {label: "Ticket Info", class: "st-col-25", sort_by: "title"},
                    {label: "Description", class: "st-col-35", sort_by: "title"},
                    {label: "Status", class: "st-col-25", sort_by: "status"},
                    {label: "", class: "st-col-15"},
                    {sort_by: "updated_at", hidden: true}
                ]}
                generateTableRow={generateTableRow}
            />
        </>

    )}

export default RenterMaintenanceRequestListPage;

