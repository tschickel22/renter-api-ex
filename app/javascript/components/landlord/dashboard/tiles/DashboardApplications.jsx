import React, {useState} from 'react';

import DashboardListTile from "../DashboardListTile";
import store from "../../../../app/store";

import insightRoutes from "../../../../app/insightRoutes";
import insightUtils from "../../../../app/insightUtils";
import {searchForLeases} from "../../../../slices/leaseSlice";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";

const DashboardApplications = ({}) => {

    const { constants } = useSelector((state) => state.company)
    const [mode, setMode] = useState("applicants")

    async function runSearch(text) {
        const results = await store.dispatch(searchForLeases({mode: mode, searchText: text, status: mode == "leads" ? "new" : "all"})).unwrap()

        let leasesToDisplay = results.data.leases.sort((a, b) => {
            let valA = (a.primary_resident && a.primary_resident.updated_at) || a.updated_at
            let valB = (b.primary_resident && b.primary_resident.updated_at) || b.updated_at

            return (valA > valB ? -1 : 1)
        })

        return {total: results.data.total, objects: leasesToDisplay}
    }

    function generateTableRow(lease, key) {
        return (
            <div className="st-row-wrap" key={key}>
                <div className="st-row">
                    <div className="st-col-33 st-long-text">
                        <Link to={insightRoutes.leaseShow(lease.hash_id)}>
                            {lease.primary_resident && lease.primary_resident.resident.name}
                        </Link>
                    </div>
                    <div className="st-col-33 st-long-text">
                        {insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}
                    </div>
                    <div className="st-col-33 text-right">
                        {insightUtils.formatDate(lease.primary_resident && lease.primary_resident.updated_at)}
                    </div>
                </div>
            </div>)
    }
    return (
        <>
            <DashboardListTile
                icon={<i className="fal fa-pencil"/>}
                title={<>Applications<span className="hidden-lg">/Leads</span></>}
                nav={<div className="flex-row" style={{gap: 0}}>
                    <div className={"st-col-50 " + (mode == "applicants" ? "text-blue" : "text-gray")} onClick={() => setMode("applicants")} style={{cursor: "pointer"}}>Applicants</div>
                    <div className={"st-col-50 " + (mode == "leads" ? "text-blue" : "text-gray")} onClick={() => setMode("leads")} style={{cursor: "pointer"}}>Leads</div>
                </div>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                reloadWhenChanges={mode}
                columns={[
                    {label: "Name", class: "st-col-33"},
                    {label: "Status", class: "st-col-33"},
                    {label: "Last Activity", class: "st-col-33 text-right"},
                ]}
                viewAllPath={mode == "leads" ? insightRoutes.leadList() : insightRoutes.applicationList()}
            />
        </>

    )}

export default DashboardApplications;

