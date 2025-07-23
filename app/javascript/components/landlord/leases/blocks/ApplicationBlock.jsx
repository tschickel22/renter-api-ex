import React, {useEffect, useState} from 'react';
import ApplicationBlockItem from "./ApplicationBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";

import ApplicationActionButton from "./ApplicationActionButton";

const ApplicationBlock = ({lease, setLease}) => {

    const { constants } = useSelector((state) => state.company)

    const [submittedApplicationCount, setSubmittedApplicationCount] = useState(0)

    useEffect(() => {

        let count = [constants.lease_resident_steps.submitted.key, constants.lease_resident_steps.screening_complete.key].includes(lease.primary_resident.current_step) ? 1 : 0

        lease.secondary_residents.forEach((lr) => {
            if ([constants.lease_resident_steps.submitted.key, constants.lease_resident_steps.screening_complete.key].includes(lr.current_step)) count = count + 1
        })

        lease.guarantors.forEach((lr) => {
            if ([constants.lease_resident_steps.submitted.key, constants.lease_resident_steps.screening_complete.key].includes(lr.current_step)) count = count + 1
        })

        setSubmittedApplicationCount(count)
    }, [lease])

    return (
        <>
            <div className="flex-grid-item">
                <h3>Applications</h3>
                <div className="flex-line-blockwrap">

                    <ApplicationBlockItem leaseResident={lease.primary_resident}/>

                    {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                        <h3>{insightUtils.getLabel("LeaseResidentSecondary", constants.lease_resident_types)}</h3>
                        {lease.secondary_residents.map((secondaryResident, i) => (
                            <ApplicationBlockItem key={i} leaseResident={secondaryResident}/>
                        ))}
                    </>}

                    {lease.guarantors && lease.guarantors.length > 0 && <>
                        <h3>{insightUtils.getLabel("LeaseResidentGuarantor", constants.lease_resident_types)}</h3>
                        {lease.guarantors.map((guarantor, i) => (
                            <ApplicationBlockItem key={i} leaseResident={guarantor}/>
                        ))}
                    </>}
                </div>

                {((lease.application_status == constants.lease_application_statuses.in_progress.key && submittedApplicationCount > 0) || [constants.lease_application_statuses.completed.key, constants.lease_application_statuses.approved.key, constants.lease_application_statuses.declined.key].includes(lease.application_status)) && <>
                    <div className="spacer"></div>

                    <ApplicationActionButton lease={lease} setLease={setLease} incompleteApplication={lease.application_status == constants.lease_application_statuses.in_progress.key}  />
                </>}

                <div className="spacer"></div>
            </div>
        </>
    )}

export default ApplicationBlock;

