import React, {useEffect, useState} from 'react';
import {Link, NavLink, useLocation, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";

const LeaseNav = ({lease}) => {
    const navigate = useNavigate()
    const { state } = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const { settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(async () => {
        if (settings && lease) {
            setCurrentSettings(insightUtils.getSettings(settings, lease.property_id))
        }
    }, [settings, lease])

    function getBackLabel() {
        if (state && state.from) {
            if (state.from == "units") return "Units"
            if (state.from == "applicants") return "Applications"
            if (state.from == "screenings") return "Screenings"
        }

        return "Back"
    }

    return (
        <>
            <div className="horiz-nav">
                {state && state.return_url ? <a onClick={() => navigate(state.return_url)} className="hv-sidebtn hv-sidebtn-left"><i className="fal fa-chevron-left"></i> {getBackLabel()}</a> : <div></div>}

                <ul className="horiz-nav-list">
                    <li className="hn-item"><NavLink to={insightRoutes.leaseShow(lease.hash_id)}> Summary</NavLink></li>
                    <li className="hn-item"><NavLink to={insightRoutes.communicationCenter(currentUser, lease.property_id)}> Communication</NavLink></li>
                    <li className="hn-item"><NavLink to={insightRoutes.maintenanceRequestList()}>Maintenance</NavLink></li>
                    <li className="hn-item"><NavLink to={insightRoutes.residentLedger(lease.hash_id)}>Ledger</NavLink></li>
                    {currentSettings?.enable_invoices && <li className="hn-item"><NavLink to={insightRoutes.residentInvoiceList(lease.hash_id)}>Invoices</NavLink></li>}
                    <li className="hn-item"><NavLink to={insightRoutes.noteListForLease(lease.hash_id)}>Activity</NavLink></li>
                    <li className="hn-item"><NavLink to={insightRoutes.leaseHistory(lease.hash_id)}>History</NavLink></li>
                </ul>

                <div></div>
            </div>
        </>

    )}

export default LeaseNav;


