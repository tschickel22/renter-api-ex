import React from 'react';
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const ResidentScreeningInformationForm = ({lease, leaseResident, currentSettings}) => {
    const { currentUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    let truncatedSSN = 'No SSN'
    let truncatedDOB = 'No Date of Birth'

    if (leaseResident && leaseResident.resident) {
        if (leaseResident.resident.tax_id && leaseResident.resident.tax_id.length >= 4) {
            truncatedSSN = "NNN-NN-" + leaseResident.resident.tax_id.slice(-4)
        }
        if (leaseResident.resident.date_of_birth && leaseResident.resident.date_of_birth.length >= 4) {
            truncatedDOB = "MM/DD/" + leaseResident.resident.date_of_birth.slice(-4)
        }
    }

    return (
        <>
            <h3>Identifying Information</h3>
            <p>In order to run our screening process, please provide the following:</p>

            <div>
                <div className="form-row">
                    <div className="form-item form-item-25">
                        {([constants.lease_application_statuses.completed.key, constants.lease_application_statuses.approved.key, constants.lease_application_statuses.declined.key].indexOf(lease.application_status) < 0 || insightUtils.isResident(currentUser))
                            ?
                            <>
                                <FormItem label="Social Security Number or ITIN" name={"lease_resident.resident.tax_id"} optional={!currentSettings.require_ssn} mask={insightUtils.ssnMask()}/>
                                {!currentSettings.require_ssn && <FormItem label="I don't have an SSN or ITIN" name={"lease_resident.resident.no_tax_id"} type="checkbox" optional={true} />}
                            </>
                            :
                            <FormItem label="Social Security Number or ITIN" name={"lease_resident.resident.tax_id"} optional={!currentSettings.require_ssn}>
                                <div className="text-left">{truncatedSSN}</div>
                            </FormItem>
                        }
                    </div>
                    {([constants.lease_application_statuses.completed.key, constants.lease_application_statuses.approved.key, constants.lease_application_statuses.declined.key].indexOf(lease.application_status) < 0 || insightUtils.isResident(currentUser))
                        ?
                            <FormItem label="Date of Birth" formItemClass="form-item-25" name={"lease_resident.resident.date_of_birth"} mask={insightUtils.dateMask()} placeholder="mm/dd/yyyy" />
                        :
                            <FormItem label="Date of Birth" formItemClass="form-item-25" name={"lease_resident.resident.date_of_birth"}>
                                <div className="text-left">{truncatedDOB}</div>
                            </FormItem>
                    }

                </div>
            </div>
        </>

    )}

export default ResidentScreeningInformationForm;

