import React, {useEffect, useState} from 'react';
import {Outlet} from "react-router-dom";
import {ErrorMessage, Field, FieldArray} from "formik";
import ResidentFormRow from "./ResidentFormRow";
import StateDropdown from "../../shared/StateDropdown";
import BasicDropdown from "../../shared/BasicDropdown";
import DomesticOrInternationalDropdown from "../../shared/DomesticOrInternationalDropdown";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const ResidentEmploymentHistoryForm = ({property, leaseResident, emptyEmploymentHistory, optional}) => {

    const { constants, settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [monthsRequired, setMonthsRequired] = useState(null)

    useEffect(async () => {
        if (settings && property) {
            const newCurrentSettings = insightUtils.getSettings(settings, property.id)
            setCurrentSettings(newCurrentSettings)

            if (newCurrentSettings.employment_histories_minimum > 0) {
                setMonthsRequired(newCurrentSettings.employment_histories_minimum)
            }
            else {
                setMonthsRequired(24)
            }
        }
    }, [settings, property])

    function addNewEmploymentHistory(arrayHelpers) {
        arrayHelpers.push(emptyEmploymentHistory())
    }

    function cancelNewEmploymentHistory(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }
    return (
        <>
            <h3>Employment History</h3>

            {currentSettings && currentSettings.application_include_employment_histories == "required" &&
                <p>Please provide at least {insightUtils.getLabel(monthsRequired, constants.times_at_company).toLowerCase()} of employment history.</p>
            }

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_employment_histories"
                    render={arrayHelpers => (
                        <>
                            {leaseResident.resident.resident_employment_histories && leaseResident.resident.resident_employment_histories.map((resident_employment_history, index) => (
                                <div key={index}>

                                    <ErrorMessage className="text-error text-left" style={{marginBottom: "20px"}} name={`lease_resident.resident.resident_employment_histories.${index}.id`} component="div"/>

                                    <div className="form-row">
                                        <FormItem label="Employment Status" name={`lease_resident.resident.resident_employment_histories.${index}.employment_status`} optional={optional}>
                                            <BasicDropdown name={`lease_resident.resident.resident_employment_histories.${index}.employment_status`} options={constants.employment_statuses} />
                                        </FormItem>

                                        <FormItem label="Company Name" name={`lease_resident.resident.resident_employment_histories.${index}.company_name`} optional={optional}/>

                                        <FormItem label="Time at Company" formItemClass="form-item-50" name={`lease_resident.resident.resident_employment_histories.${index}.months_at_company`} optional={optional}>
                                            <BasicDropdown name={`lease_resident.resident.resident_employment_histories.${index}.months_at_company`} options={constants.times_at_company} />
                                        </FormItem>

                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Contact Name" name={`lease_resident.resident.resident_employment_histories.${index}.contact_name`} optional={optional} />
                                        <FormItem label="Contact Phone" name={`lease_resident.resident.resident_employment_histories.${index}.contact_phone`} mask={insightUtils.phoneNumberMask()} optional={optional} />

                                        <div className="form-item">
                                            <label>&nbsp;</label>
                                            {index > 0 && <a onClick={() => cancelNewEmploymentHistory(arrayHelpers, index)}>Remove</a>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewEmploymentHistory(arrayHelpers)}>Add Employment</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentEmploymentHistoryForm;

