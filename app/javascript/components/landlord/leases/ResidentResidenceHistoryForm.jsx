import React, {useEffect, useState} from 'react';

import {ErrorMessage, Field, FieldArray, useFormikContext} from "formik";
import StateDropdown from "../../shared/StateDropdown";
import BasicDropdown from "../../shared/BasicDropdown";
import DomesticOrInternationalDropdown from "../../shared/DomesticOrInternationalDropdown";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";



const ResidentResidenceHistoryForm = ({property, leaseResident, optional}) => {
    const formikProps = useFormikContext()
    const { currentCompany, constants, settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [monthsRequired, setMonthsRequired] = useState(null)

    useEffect(async () => {
        if (settings && property) {
            const newCurrentSettings = insightUtils.getSettings(settings, property.id)
            setCurrentSettings(newCurrentSettings)

            if (newCurrentSettings.resident_histories_minimum > 0) {
                setMonthsRequired(newCurrentSettings.resident_histories_minimum)
            }
            else {
                setMonthsRequired(24)
            }
        }
    }, [settings, property])

    function addNewResidenceHistory(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyResidenceHistory())
    }

    function cancelNewResidenceHistory(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <h3>Resident History</h3>

            {currentSettings && currentSettings.application_include_resident_histories == "required" &&
                <p>Please provide at least {insightUtils.getLabel(monthsRequired, constants.times_at_company).toLowerCase()} of residency.</p>
            }

            <div>
                {<FieldArray
                    name="lease_resident.resident.resident_residence_histories"
                    render={arrayHelpers => (
                        <>
                            {leaseResident.resident.resident_residence_histories && leaseResident.resident.resident_residence_histories.map((resident_residence_history, index) => (
                                <div key={index}>

                                    <ErrorMessage className="text-error text-left" style={{marginBottom: "20px"}} name={`lease_resident.resident.resident_residence_histories.${index}.id`} component="div"/>

                                    <div className="form-row">
                                        {!currentCompany.external_screening_id &&
                                            <FormItem label="Country" name={`lease_resident.resident.resident_residence_histories.${index}.country`} optional={optional}>
                                                <DomesticOrInternationalDropdown name={`lease_resident.resident.resident_residence_histories.${index}.country`} />
                                            </FormItem>
                                        }
                                        <FormItem label="Time at Address" name={`lease_resident.resident.resident_residence_histories.${index}.months_at_address`} optional={optional}>
                                            <BasicDropdown name={`lease_resident.resident.resident_residence_histories.${index}.months_at_address`} options={constants.times_at_address} />
                                        </FormItem>
                                        <FormItem label="Type" name={`lease_resident.resident.resident_residence_histories.${index}.residence_type`} optional={optional}>
                                            <BasicDropdown name={`lease_resident.resident.resident_residence_histories.${index}.residence_type`} options={constants.residence_types} />
                                        </FormItem>

                                        <div className="form-item">
                                            <label>&nbsp;</label>
                                            {index > 0 &&<a onClick={() => cancelNewResidenceHistory(arrayHelpers, index)}>Remove</a>}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Address" name={`lease_resident.resident.resident_residence_histories.${index}.street`} optional={optional} />
                                        <FormItem label="City" name={`lease_resident.resident.resident_residence_histories.${index}.city`} optional={optional} />
                                        {resident_residence_history.country != 'international' &&
                                        <FormItem label="State" name={`lease_resident.resident.resident_residence_histories.${index}.state`} optional={optional}>
                                            <StateDropdown name={`lease_resident.resident.resident_residence_histories.${index}.state`}/>
                                        </FormItem>
                                        }
                                        {resident_residence_history.country == 'international' && <FormItem label="Region" name={`lease_resident.resident.resident_residence_histories.${index}.state`} optional={optional} />}
                                        <FormItem label={resident_residence_history.country != 'international' ? 'Zip' : 'Postal Code'} mask={resident_residence_history.country != 'international' ? insightUtils.zipMask() : null} formItemClass="form-item-50" name={`lease_resident.resident.resident_residence_histories.${index}.zip`} optional={optional} />
                                    </div>

                                    {formikProps.values.lease_resident.resident.resident_residence_histories[index].residence_type == 'rent' &&
                                        <div className="form-row">
                                            <FormItem label="Landlord Name" name={`lease_resident.resident.resident_residence_histories.${index}.landlord_name`} optional={optional} />
                                            <FormItem label="Landlord Phone" name={`lease_resident.resident.resident_residence_histories.${index}.landlord_phone`} optional={optional} mask={insightUtils.phoneNumberMask()} />
                                            <FormItem label="Landlord Email" name={`lease_resident.resident.resident_residence_histories.${index}.landlord_email`} optional={true} />
                                            <FormItem label="Monthly Rent" name={`lease_resident.resident.resident_residence_histories.${index}.monthly_rent`} optional={optional} mask={insightUtils.currencyMask(false)} />
                                        </div>
                                    }
                                </div>
                            ))}

                            <div className="form-row">
                                <div className="form-item">
                                    <a onClick={() => addNewResidenceHistory(arrayHelpers)}>Add Residence</a>
                                </div>
                            </div>
                        </>
                    )}
                />}
            </div>
        </>

    )}

export default ResidentResidenceHistoryForm;

