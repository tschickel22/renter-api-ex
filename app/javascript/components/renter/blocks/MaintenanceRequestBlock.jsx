import React, {useState} from 'react';
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {searchForMaintenanceRequests} from "../../../slices/maintenanceRequestSlice";
import ListPage from "../../shared/ListPage";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const MaintenanceRequestBlock = ({lease}) => {

    const numberToShow = 3
    const { constants } = useSelector((state) => state.company)

    const [maintenanceRequestCount, setMaintenanceRequestCount] = useState(null)
    const [maintenanceRequestsLoaded, setMaintenanceRequestsLoaded] = useState(false)

    async function runSearch(text) {
        const results = await store.dispatch(searchForMaintenanceRequests({searchText: text})).unwrap()
        setMaintenanceRequestCount(results.data.total)
        setMaintenanceRequestsLoaded(true)

        let sortTarget = Array.from(results.data.maintenance_requests)
        const newSortedObjects = sortTarget.sort((a, b) => {
                let valA = insightUtils.resolvePath(a, "updated_at")
                let valB = insightUtils.resolvePath(b, "updated_at")

                return (valA > valB ? 1 : -1) * -1
            }
        )

        // Set total to 0 so that we don't trigger pagination
        return {total: 0, objects: newSortedObjects.slice(0, numberToShow)}
    }

    function generateTableRow(maintenanceRequest, key) {
        return (
            <div key={key} style={{marginBottom: "6px"}}>
                <Link to={insightRoutes.renterMaintenanceRequestEdit(maintenanceRequest.hash_id)} className="text-gray"><strong>{maintenanceRequest.title}</strong><br/><span className="text-light-gray">{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)} {maintenanceRequest.status == constants.maintenance_request_statuses.closed.key ? insightUtils.formatDate(maintenanceRequest.closed_on) : insightUtils.formatDate(maintenanceRequest.submitted_on)}</span></Link><br/>
            </div>
                )
    }

    return (
        <div className="flex-grid-item">
            <h3>Maintenance Requests</h3>
            {!maintenanceRequestsLoaded || maintenanceRequestCount > 0 ?
                <ListPage
                    title=""
                    hideSearch={true}
                    hideNavCol={true}
                    titleImage={<React.Fragment/>}
                    runSearch={runSearch}
                    generateTableRow={generateTableRow}
                />
                :
                <div className="flex-line-blockwrap">
                    <p>You Have No Open Requests, Would You Like To Start One?</p>
                </div>
            }

            <div className="spacer"></div>
            <div>
                {maintenanceRequestCount > numberToShow && <><Link to={insightRoutes.renterMaintenanceRequestList()} className="btn btn-bottom btn-red" style={{display: 'inline-block'}}>See All</Link>&nbsp;</>}
                {lease.status != constants.lease_statuses.former.key && <Link to={insightRoutes.renterMaintenanceRequestNew()} className="btn btn-bottom btn-red" style={{display: 'inline-block'}}>Create Request</Link>}
            </div>
        </div>
    )}

export default MaintenanceRequestBlock;

