import React, {useState, useEffect, useRef} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import {closeMaintenanceRequest} from "../../../slices/maintenanceRequestSlice";


const MaintenanceRequestListRow = ({maintenanceRequest, setTriggerRefresh}) => {
    let navigate = useNavigate();

    const { currentUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)
    const [confirmingClosure, setConfirmingClosure] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    function handleConfirmClose() {
        setRowMenuOpen(false)

        setConfirmingClosure(true)
    }

    async function handleCloseTicket() {
        setConfirmingClosure(false)

        const results = await store.dispatch(closeMaintenanceRequest({maintenanceRequest: maintenanceRequest})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Ticket closed"}))
            setTriggerRefresh(true)
        }
        else {
            store.dispatch(displayAlertMessage({message: "Could not close ticket: " + results.data.errors}))
        }
    }

    return (
        <div className="st-row-wrap">
            <div className="st-row st-row-5-col-table">
                <div className="st-col-1 st-first-col">
                    {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                    <span>
				        <Link to={insightRoutes.maintenanceRequestEdit(maintenanceRequest.hash_id)}><strong>#{maintenanceRequest.id}</strong></Link>

                        {maintenanceRequest.assigned_to && <>
                        <br/>
                            {maintenanceRequest.assigned_to_type == "User" && <em>Assigned to {maintenanceRequest.assigned_to.first_name} {maintenanceRequest.assigned_to.last_name}</em>}
                            {maintenanceRequest.assigned_to_type == "Vendor" && <em>Assigned to {maintenanceRequest.assigned_to.name}</em>}
                        </>}
			        </span>
                </div>
                <span className="st-col-2">
                    {maintenanceRequest.resident && <>
                        <span className="rowname">Tenant:</span>
                        {maintenanceRequest.resident.first_name} {maintenanceRequest.resident.last_name}
                    </>}
                    {maintenanceRequest.property && <>
                        <br/>
                        {maintenanceRequest.property.name}
                        </>
                    }
                    {maintenanceRequest.unit && <>
                        <br/>
                        {maintenanceRequest.unit.street}<br/>
                        {maintenanceRequest.unit.city}, {maintenanceRequest.unit.state} {maintenanceRequest.unit.zip}
                    </>}
                </span>
                <span className="st-col-3 st-maint-descr">
                    <Link to={insightRoutes.maintenanceRequestEdit(maintenanceRequest.hash_id)}><strong>{maintenanceRequest.title}</strong></Link><br/>
                    {maintenanceRequest.maintenance_request_category && <>
                        <strong>Category:</strong> {maintenanceRequest.maintenance_request_category.name}
                    </>}
                    <div className="smallspacer"></div>
                    <span className="rowname">Description:</span>
                    <span>{maintenanceRequest.description}</span>
                </span>
                <span className="st-col-4 st-maint-status">
                    <span className="rowname">Status:</span>
                    {maintenanceRequest.status == constants.maintenance_request_statuses.closed.key ?
                        <>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}{maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? " - " + maintenanceRequest.urgency.toUpperCase() : ""}</>
                        :
			            <strong className={maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? "negative" : ""}>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}{maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? " - " + maintenanceRequest.urgency.toUpperCase() : ""}</strong>
                    }
                    {(maintenanceRequest.unread_comments || 0) > 0 &&
                        <>
                            <br/>
                            <Link to={insightRoutes.maintenanceRequestEdit(maintenanceRequest.hash_id)} className="negative"><strong>{maintenanceRequest.unread_comments} New {maintenanceRequest.unread_comments == 1 ? "Message" : "Messages"}</strong></Link>
                        </>
                    }
			        <br/>
                    {maintenanceRequest.submitted_on && <em>Submitted {insightUtils.formatDate(maintenanceRequest.submitted_on)}</em>}
                    {maintenanceRequest.closed_on && <><br/><em>Closed {insightUtils.formatDate(maintenanceRequest.closed_on)}</em></>}
		        </span>

                <span className="st-col-5 st-maint-messages">
			        {false && <span>
				        <a className="btn-maint-comments">1 New Message</a>
			        </span>}
		        </span>

                <span className="st-col-6 st-nav-col">
                    <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                        <li onClick={() => navigateAndClose(insightRoutes.maintenanceRequestEdit(maintenanceRequest.hash_id))} className="btn-maint-comments"><i className="fal fa-edit"></i>View Request</li>
                        {false && <li className="btn-maint-comments"><i className="fal fa-comment-lines"></i>View/Add Comments</li>}
                        {false && <li className="btn-maint-assign-ticket"><i className="fal fa-comment-lines"></i>Assign Request</li>}
                        {false && <li className="btn-maint-print-ticket"><i className="fal fa-print"></i>Print Request with QR Code</li>}
                        {false && <li className="btn-maint-email-request"><i className="fal fa-envelope"></i>Email</li>}
                        {currentUser.maintenance_requests_edit && maintenanceRequest.status == constants.maintenance_request_statuses.open.key && <li onClick={() => handleConfirmClose()}><i className="fal fa-ban"></i>Close Ticket</li>}
                    </RowMenu>

                    {confirmingClosure && <div className="alert-box alert-box-in-row">
                        Are you sure you want to close this ticket?
                        <div className="btn-block"><div onClick={() => handleCloseTicket()}  className="btn btn-clear">Yes</div> <div onClick={() => setConfirmingClosure(false)} className="btn btn-clear">No</div></div>
                    </div>}
                </span>

            </div>
        </div>

    )}

export default MaintenanceRequestListRow;

