import React from 'react';
import ResidentBlockItem from "./ResidentBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const ResidentsBlock = ({lease}) => {
    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>{lease.status == constants.lease_statuses.applicant.key ? "Applicants" : "Residents"}</h3>
            <div className="flex-line-blockwrap">

                <ResidentBlockItem lease={lease} leaseResident={lease.primary_resident} />

                {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentSecondary", constants.lease_resident_types)}</h3>
                    {lease.secondary_residents.map((secondaryResident, i) => (
                        <ResidentBlockItem key={i} lease={lease} leaseResident={secondaryResident} />
                    ))}
                </>}

                {lease.occupants && lease.occupants.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentOccupant", constants.lease_resident_types)}</h3>
                    {lease.occupants.map((occupant, i) => (
                        <ResidentBlockItem key={i} lease={lease} leaseResident={occupant} />
                    ))}
                </>}

                {lease.minors && lease.minors.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentMinor", constants.lease_resident_types)}</h3>
                    {lease.minors.map((minor, i) => (
                        <ResidentBlockItem key={i} lease={lease} leaseResident={minor} />
                    ))}
                </>}

                {lease.guarantors && lease.guarantors.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentGuarantor", constants.lease_resident_types)}</h3>
                    {lease.guarantors.map((guarantor, i) => (
                        <ResidentBlockItem key={i} lease={lease} leaseResident={guarantor} />
                    ))}
                </>}
            </div>

            <div className="spacer"></div>

            {[constants.lease_statuses.lead.key, constants.lease_statuses.applicant.key, constants.lease_statuses.approved.key].indexOf(lease.status) >= 0 &&
                <Link to={insightRoutes.leaseAddResident(lease.hash_id, "LeaseResidentSecondary")} className="btn btn-bottom btn-red">Add Applicant</Link>
            }
        </div>
    )}

export default ResidentsBlock;

