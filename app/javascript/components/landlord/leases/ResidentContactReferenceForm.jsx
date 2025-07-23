import React from 'react';
import {Outlet} from "react-router-dom";
import {ErrorMessage, Field, FieldArray} from "formik";
import ResidentFormRow from "./ResidentFormRow";
import StateDropdown from "../../shared/StateDropdown";
import BasicDropdown from "../../shared/BasicDropdown";
import DomesticOrInternationalDropdown from "../../shared/DomesticOrInternationalDropdown";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";



const ResidentContactReferenceForm = ({leaseResident, emptyContactReference}) => {

    const { constants } = useSelector((state) => state.company)

    function addNewContactReference(arrayHelpers) {
        arrayHelpers.push(emptyContactReference())
    }

    function cancelNewContactReference(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <h3>Your References</h3>
            <p>Add at least one personal reference (co-worker, employers, former property owners or managers, etc.).</p>

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_contact_references"
                    render={arrayHelpers => (
                        <>
                            {leaseResident.resident.resident_contact_references && leaseResident.resident.resident_contact_references.map((resident_residence_history, index) => (
                                <div key={index}>

                                    <div className="form-row">
                                        <FormItem label="First Name" name={`lease_resident.resident.resident_contact_references.${index}.first_name`} />
                                        <FormItem label="Last Name" name={`lease_resident.resident.resident_contact_references.${index}.last_name`} />
                                        <FormItem label="Phone" name={`lease_resident.resident.resident_contact_references.${index}.phone_number`} mask={insightUtils.phoneNumberMask()} />
                                        <FormItem label="Relationship" name={`lease_resident.resident.resident_contact_references.${index}.relationship_type`}>
                                            <BasicDropdown name={`lease_resident.resident.resident_contact_references.${index}.relationship_type`} options={constants.reference_relationship_types} />
                                        </FormItem>

                                        <div className="form-item">
                                            <label>&nbsp;</label>
                                            {index > 0 &&
                                                <a onClick={() => cancelNewContactReference(arrayHelpers, index)}>Remove</a>
                                            }
                                        </div>

                                    </div>

                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewContactReference(arrayHelpers)}>Add Reference</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentContactReferenceForm;

