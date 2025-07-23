import React from 'react';
import {ErrorMessage, Field, FieldArray} from "formik";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";

const ResidentVehiclesForm = ({leaseResident}) => {

    function addNewResidentVehicle(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyResidentVehicle())
    }

    function cancelNewResidentVehicle(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <h3>Vehicles</h3>

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_vehicles"
                    render={arrayHelpers => (
                        <>
                            {leaseResident.resident.resident_vehicles && leaseResident.resident.resident_vehicles.map((vehicle, index) => (
                                <div key={index} className="form-row">
                                    <FormItem label="Make" name={`lease_resident.resident.resident_vehicles.${index}.make`} />
                                    <FormItem label="Model" name={`lease_resident.resident.resident_vehicles.${index}.model`} />
                                    <FormItem label="Year" name={`lease_resident.resident.resident_vehicles.${index}.year`} optional={true} />
                                    <FormItem label="Color" name={`lease_resident.resident.resident_vehicles.${index}.color`} optional={true} />
                                    <FormItem label="License Plate" name={`lease_resident.resident.resident_vehicles.${index}.plate_number`} optional={true} />

                                    <div className="form-item">
                                        <label>&nbsp;</label>
                                        <a onClick={() => cancelNewResidentVehicle(arrayHelpers, index)}>Remove</a>
                                    </div>

                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewResidentVehicle(arrayHelpers)}>Add Vehicle</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentVehiclesForm;

