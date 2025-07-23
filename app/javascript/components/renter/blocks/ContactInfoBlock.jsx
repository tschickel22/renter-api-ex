import React from 'react';
import ContactInfoBlockItem from "./ContactInfoBlockItem";
import insightRoutes from "../../../app/insightRoutes";
import {Link} from "react-router-dom";
import {useSelector} from "react-redux";

const ContactInfoBlock = ({lease, leaseResidents}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>Resident Info</h3>
            <div className="flex-line-blockwrap">

                {(leaseResidents || []).map((leaseResident, i) => (
                    <ContactInfoBlockItem key={i} leaseResident={leaseResident} />
                ))}
            </div>

            <div className="spacer"></div>
            {(!lease || lease.status != constants.lease_statuses.former.key) && leaseResidents && <Link to={insightRoutes.renterProfileEdit()} className="btn btn-bottom btn-red"><span>Update Contact Info</span></Link>}
        </div>
    )}

export default ContactInfoBlock;

