import React from 'react';
import {FieldArray} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";

import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";



const ResidentContactEmergencyForm = ({leaseResident, emptyContactEmergency}) => {

    const { constants } = useSelector((state) => state.company)

    function addNewContactEmergency(arrayHelpers) {
        arrayHelpers.push(emptyContactEmergency())
    }

    function cancelNewContactEmergency(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <h3>Your Emergency Contacts</h3>
            <p>We recommend providing at least 2 emergency contacts.</p>

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_contact_emergencies"
                    render={arrayHelpers => (
                        <>
                            {leaseResident.resident.resident_contact_emergencies && leaseResident.resident.resident_contact_emergencies.map((resident_residence_history, index) => (
                                <div key={index}>

                                    <div className="form-row">
                                        <FormItem label="First Name" name={`lease_resident.resident.resident_contact_emergencies.${index}.first_name`} />
                                        <FormItem label="Last Name" name={`lease_resident.resident.resident_contact_emergencies.${index}.last_name`} />
                                        <FormItem label="Phone" name={`lease_resident.resident.resident_contact_emergencies.${index}.phone_number`} mask={insightUtils.phoneNumberMask()} />
                                        <FormItem label="Relationship" name={`lease_resident.resident.resident_contact_emergencies.${index}.relationship_type`}>
                                            <BasicDropdown name={`lease_resident.resident.resident_contact_emergencies.${index}.relationship_type`} options={constants.emergency_relationship_types} />
                                        </FormItem>

                                        <div className="form-item">
                                            <label>&nbsp;</label>
                                            <a onClick={() => cancelNewContactEmergency(arrayHelpers, index)}>Remove</a>
                                        </div>
                                    </div>

                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewContactEmergency(arrayHelpers)}>Add Contact</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentContactEmergencyForm;

