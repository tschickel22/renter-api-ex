import React, {useState} from 'react';

import DashboardListTile from "../DashboardListTile";
import store from "../../../../app/store";

import insightRoutes from "../../../../app/insightRoutes";
import insightUtils from "../../../../app/insightUtils";
import {searchForLeases} from "../../../../slices/leaseSlice";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";

const DashboardLeases = ({}) => {

    const { constants } = useSelector((state) => state.company)

    const [searchByStatus, setSearchByStatus] = useState("expiring")

    async function runSearch(text) {
        const results = await store.dispatch(searchForLeases({mode: "residents", searchText: text, status: searchByStatus})).unwrap()
        return {total: results.data.total, objects: results.data.leases}
    }

    function generateTableRow(lease, key) {
        return (
            <div className="st-row-wrap" key={key}>
                <div className="st-row">
                    <div className="st-col-33 st-long-text">
                        <Link to={insightRoutes.leaseShow(lease.hash_id)}>
                            {lease.primary_resident.resident.name}
                        </Link>
                    </div>
                    <div className="st-col-33 st-long-text">
                        {insightUtils.getLabel(lease.status, constants.lease_statuses)}
                    </div>
                    <div className="st-col-33 text-right">
                        {searchByStatus == "expiring" && insightUtils.formatDate(lease.lease_end_on)}
                        {searchByStatus == "move_in" && insightUtils.formatDate(lease.move_in_on)}
                        {searchByStatus == "move_out" && insightUtils.formatDate(lease.move_out_on)}
                    </div>
                </div>
            </div>)
    }
    return (
        <>
            <DashboardListTile
                icon={<i className="fal fa-clipboard"/>}
                title="Leases"
                nav={<div className="flex-row" style={{gap: 0}}>
                    <div className={"st-col-33 " + (searchByStatus == "expiring" ? "text-blue" : "text-gray")} onClick={() => setSearchByStatus("expiring")} style={{cursor: "pointer"}}>Expiring</div>
                    <div className={"st-col-33 " + (searchByStatus == "move_in" ? "text-blue" : "text-gray")} onClick={() => setSearchByStatus("move_in")} style={{cursor: "pointer"}}>Move-ins</div>
                    <div className={"st-col-33 " + (searchByStatus == "move_out" ? "text-blue" : "text-gray")} onClick={() => setSearchByStatus("move_out")} style={{cursor: "pointer"}}>Move-outs</div>
                </div>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                reloadWhenChanges={searchByStatus}
                columns={[
                    {label: "Name", class: "st-col-33"},
                    {label: "Status", class: "st-col-33"},
                    {label: searchByStatus == "expiring" ? "Expires" : (searchByStatus == "move_in" ? "Move-in" : "Move-out"), class: "st-col-33 text-right"},
                ]}
                viewAllPath={insightRoutes.residentList(searchByStatus, 0, 30)}
            />
        </>

    )}

export default DashboardLeases;

