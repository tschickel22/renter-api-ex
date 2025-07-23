import React, {useState, useEffect, useRef} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";


const RenterMaintenanceRequestListRow = ({maintenanceRequest}) => {
    let navigate = useNavigate();

    const { constants } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <div className="st-row-wrap">
            <div className="st-row st-row-5-col-table">
                <div className="st-col-25 st-first-col">
                    {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                    <span>
				        <Link to={insightRoutes.renterMaintenanceRequestEdit(maintenanceRequest.hash_id)}><strong>#{maintenanceRequest.id}</strong></Link>

                        {maintenanceRequest.assigned_to && <>
                        <br/>
                            {maintenanceRequest.assigned_to_type == "User" && <em>Assigned to {maintenanceRequest.assigned_to.first_name} {maintenanceRequest.assigned_to.last_name}</em>}
                            {maintenanceRequest.assigned_to_type == "Vendor" && <em>Assigned to {maintenanceRequest.assigned_to.name}</em>}
                        </>}
			        </span>
                </div>
                <span className="st-col-35">
                    <strong>{maintenanceRequest.title}</strong><br/>
                    {maintenanceRequest.maintenance_request_category && <>
                        <strong>Category:</strong> {maintenanceRequest.maintenance_request_category.name}
                    </>}
                    <div className="smallspacer"></div>
                    <span className="rowname">Description:</span>
                    <span>{maintenanceRequest.description}</span>
                </span>
                <span className="st-col-25">
                    <span className="rowname">Status:</span>
                    {maintenanceRequest.status == constants.maintenance_request_statuses.closed.key ?
                        <>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}{maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? " - " + maintenanceRequest.urgency.toUpperCase() : ""}</>
                        :
			            <strong className={maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? "negative" : ""}>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}{maintenanceRequest.urgency == constants.maintenance_request_urgencies.urgent.key ? " - " + maintenanceRequest.urgency.toUpperCase() : ""}</strong>
                    }
			        <br/>
                    {maintenanceRequest.submitted_on && <em>Submitted {insightUtils.formatDate(maintenanceRequest.submitted_on)}</em>}
		        </span>

                <span className="st-col-15">
			        {false && <span>
				        <a className="btn-maint-comments">1 New Message</a>
			        </span>}
		        </span>

                <span className="st-col-6 st-nav-col">
                    <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                        <li onClick={() => navigateAndClose(insightRoutes.renterMaintenanceRequestEdit(maintenanceRequest.hash_id))} className="btn-maint-comments"><i className="fal fa-edit"></i>View Request</li>
                        {false && <li className="btn-maint-comments"><i className="fal fa-comment-lines"></i>View/Add Comments</li>}
                        {false && <li className="btn-maint-assign-ticket"><i className="fal fa-comment-lines"></i>Assign Request</li>}
                        {false && <li className="btn-maint-print-ticket"><i className="fal fa-print"></i>Print Request with QR Code</li>}
                        {false && <li className="btn-maint-email-request"><i className="fal fa-envelope"></i>Email</li>}
                    </RowMenu>


                </span>

            </div>
        </div>

    )}

export default RenterMaintenanceRequestListRow;

