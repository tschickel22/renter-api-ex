import React from 'react';
import {useSelector} from "react-redux";

const AnnouncementRecipientListRow = ({leaseResident, announcementRecipient, selected, setSelected}) => {

    const lease = leaseResident?.lease
    const { properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => ((announcementRecipient.recipient_type == "Property" && property.id == announcementRecipient.recipient_id) || (announcementRecipient.recipient_type == "LeaseResident" && property.id == lease?.property_id)))
    const unit = lease ? ((property && property.units) || []).find((unit) => unit.id == lease.unit_id) : null

    function toggleSelection(id) {
        let newSelected = [...selected]

        if (newSelected.indexOf(id) >= 0) {
            newSelected.splice( newSelected.indexOf(id), 1 )
        }
        else {
            newSelected.push(id)
        }

        setSelected(newSelected)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    {leaseResident ?
                        <>
                            <div className="st-col-25 st-first-col">
                                {setSelected &&
                                    <i className={"fa-square btn-checkbox " + (selected.indexOf(leaseResident.hash_id) >= 0 ? "fas active" : "fal")} onClick={() => toggleSelection(leaseResident.hash_id)}></i>
                                }
                                {leaseResident?.resident && <>Resident: {leaseResident.resident.name}</>}
                            </div>
                            <span className="st-col-30 hidden-md">
                                {property && property.name}<br/>
                                {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                            </span>
                            <span className="st-col-25 st-col-md-50">
                                {leaseResident.resident.email}
                                <div className="visible-md">
                                    {leaseResident.resident.phone_number}
                                </div>
                            </span>
                            <span className="st-col-25 hidden-md">
                                {leaseResident.resident.phone_number}
                            </span>
                        </> :
                        <>
                            <div className="st-col-25 st-col-md-50 st-first-col">
                                {setSelected &&
                                    <i className={"fa-square btn-checkbox " + (selected.indexOf(announcementRecipient.id || announcementRecipient.selection_id) >= 0 ? "fas active" : "fal")} onClick={() => toggleSelection(announcementRecipient.id || announcementRecipient.selection_id)}></i>
                                }
                                {announcementRecipient.recipient_type == "Company" && "All Properties"}
                                {announcementRecipient.recipient_type == "Property" && property && <>Property: {property.name}</>}
                                {announcementRecipient.recipient_type == "LeaseResident" && announcementRecipient?.resident && <>Resident: {announcementRecipient.resident.name}</>}
                            </div>
                            <span className="st-col-75 st-col-md-50">
                                {announcementRecipient.recipient_type == "LeaseResident" && property && <>
                                    {property.name}<br/>
                                    {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                                </>}
                                {(announcementRecipient.recipient_type == "Company" || announcementRecipient.recipient_type == "Property") && <>
                                    {announcementRecipient.recipient_conditions_pretty}
                                </>}
                                {announcementRecipient?.resident && <>Email: {announcementRecipient.resident.email}{" "}</>}
                                <div className="visible-md">{" "}</div>
                                {announcementRecipient?.resident && <>Phone: {announcementRecipient.resident.phone_number}</>}
                            </span>
                        </>
                    }
                    <span className="st-nav-col">

                    </span>
                </div>
            </div>

        </>

    )
}

export default AnnouncementRecipientListRow;

