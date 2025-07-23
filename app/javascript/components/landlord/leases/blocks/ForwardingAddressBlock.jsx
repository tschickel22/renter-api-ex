import React from 'react';
import ForwardingAddressBlockItem from "./ForwardingAddressBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";

const ForwardingAddressBlock = ({lease}) => {
    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>Forwarding Addresses</h3>
            <div className="flex-line-blockwrap">

                <ForwardingAddressBlockItem lease={lease} leaseResident={lease.primary_resident} />

                {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                    <h3>{insightUtils.getLabel("LeaseResidentSecondary", constants.lease_resident_types)}</h3>
                    {lease.secondary_residents.map((secondaryResident, i) => (
                        <ForwardingAddressBlockItem key={i} lease={lease} leaseResident={secondaryResident} />
                    ))}
                </>}
            </div>

        </div>
    )}

export default ForwardingAddressBlock;
