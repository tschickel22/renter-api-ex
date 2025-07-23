import React from 'react';
import {ErrorMessage, Field, FieldArray} from "formik";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";

const ResidentPetsForm = ({valuesLeaseResident}) => {

    const { constants } = useSelector((state) => state.company)

    function addNewResidentPet(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyResidentPet())
    }

    function cancelNewResidentPet(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <h3>Pets</h3>

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_pets"
                    render={arrayHelpers => (
                        <>
                            {valuesLeaseResident.resident.resident_pets && valuesLeaseResident.resident.resident_pets.map((pet, index) => (
                                <div key={index} className="form-row">
                                    <FormItem label="Pet type" name={`lease_resident.resident.resident_pets.${index}.pet_type`}>
                                        <BasicDropdown name={`lease_resident.resident.resident_pets.${index}.pet_type`} options={constants.pet_types} />
                                    </FormItem>
                                    <FormItem label="Name" name={`lease_resident.resident.resident_pets.${index}.name`} />
                                    <FormItem label="Breed" optional={true} name={`lease_resident.resident.resident_pets.${index}.breed`} />
                                    <FormItem label="Weight" optional={true} name={`lease_resident.resident.resident_pets.${index}.weight`} />
                                    <FormItem label="Color" optional={true} name={`lease_resident.resident.resident_pets.${index}.color`} />

                                    <div className="form-item">
                                        <label>&nbsp;</label>
                                        <a onClick={() => cancelNewResidentPet(arrayHelpers, index)}>Remove</a>
                                    </div>

                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewResidentPet(arrayHelpers)}>Add Pet</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentPetsForm;

