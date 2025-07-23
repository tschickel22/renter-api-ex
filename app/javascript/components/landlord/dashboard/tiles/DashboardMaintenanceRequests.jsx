import React, {useState} from 'react';

import DashboardListTile from "../DashboardListTile";
import store from "../../../../app/store";
import insightRoutes from "../../../../app/insightRoutes";
import insightUtils from "../../../../app/insightUtils";

import {searchForMaintenanceRequests} from "../../../../slices/maintenanceRequestSlice";
import moment from "moment";
import {Link} from "react-router-dom";

const DashboardMaintenanceRequests = ({}) => {
    const [newRequests, setNewRequests] = useState(null)

    async function runSearch(text) {
        const results = await store.dispatch(searchForMaintenanceRequests({searchText: text, excludeRecurring: true, status: "open"})).unwrap()

        let requestsToDisplay = []
        let newRequestCount = 0

        if(results.data.maintenance_requests) {

            let today = moment()

            results.data.maintenance_requests.forEach((maintenanceRequest) => {
                const updatedAt = moment(maintenanceRequest.updated_at)

                if (today.diff(updatedAt, "days") < 7) {
                    newRequestCount++
                }
            })
        }

        setNewRequests(newRequestCount)

        requestsToDisplay = results.data.maintenance_requests.sort((a, b) => {
            let valA = a.submitted_on
            let valB = b.submitted_on

            return (valA > valB ? -1 : 1)
        })

        return {total: results.data.total, objects: requestsToDisplay}
    }

    function generateTableRow(maintenanceRequest, key) {
        return (
            <div className="st-row-wrap" key={key}>
                <div className="st-row">
                    <div className="st-col-33 st-long-text">
                        <Link to={insightRoutes.maintenanceRequestEdit(maintenanceRequest.hash_id)}>
                            {maintenanceRequest.resident && <>
                                {maintenanceRequest.resident.first_name} {maintenanceRequest.resident.last_name}
                            </>}
                            {!maintenanceRequest.resident && maintenanceRequest.property && <>
                                {maintenanceRequest.property.name}
                            </>
                            }
                            {!maintenanceRequest.resident && maintenanceRequest.unit && <>
                                {maintenanceRequest.unit.street}
                            </>}
                        </Link>
                    </div>
                    <div className="st-col-33 st-long-text">
                        {maintenanceRequest.title}
                    </div>
                    <div className="st-col-33 text-right">
                        {insightUtils.formatDate(maintenanceRequest.submitted_on)}
                    </div>
                </div>
            </div>)
    }
    return (
        <>
            <DashboardListTile
                icon={<i className="fal fa-tools"/>}
                title="Maintenance"
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                totalOverride={newRequests}
                columns={[
                    {label: "Tenant", class: "st-col-33"},
                    {label: "Ticket Info", class: "st-col-33"},
                    {label: "Date", class: "st-col-33 text-right"},
                ]}
                viewAllPath={insightRoutes.maintenanceRequestList()}
            />
        </>

    )}

export default DashboardMaintenanceRequests;

