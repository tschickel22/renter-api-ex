import React from 'react';
import LeadBlockItem from "./LeadBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";

const LeadBlock = ({lease}) => {
    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>Leads</h3>
            <div className="flex-line-blockwrap">

                <LeadBlockItem leaseResident={lease.primary_resident}/>

                {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentSecondary", constants.lease_resident_types)}</h3>
                    {lease.secondary_residents.map((secondaryResident, i) => (
                        <LeadBlockItem key={i} leaseResident={secondaryResident}/>
                    ))}
                </>}

                {lease.guarantors && lease.guarantors.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentGuarantor", constants.lease_resident_types)}</h3>
                    {lease.guarantors.map((guarantor, i) => (
                        <LeadBlockItem key={i} leaseResident={guarantor}/>
                    ))}
                </>}
            </div>

            <div className="spacer"></div>
        </div>
    )}

export default LeadBlock;

