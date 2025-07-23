import React from 'react';
import {Outlet} from "react-router-dom";
import {ErrorMessage, Field, useFormikContext} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import MaskedInput from "react-text-mask";
import insightUtils from "../../../app/insightUtils";



const ResidentFormRow = ({residentType, resident, index, arrayHelpers}) => {
    const formikProps = useFormikContext()
    const { constants } = useSelector((state) => state.company)

    function removeResident(arrayHelpers, index) {
        if (resident && resident.id) {
            formikProps.setFieldValue(residentType + "._destroy", true)
        }
        else {
            arrayHelpers.remove(index)
        }
    }

    return (
        <>
            {formikProps.values && !insightUtils.getValue(formikProps.values, residentType + "._destroy") && <>
                <div className="form-row">
                    <FormItem label="First Name" name={residentType + ".resident.first_name"} />
                    <FormItem label="Middle Name" name={residentType + ".resident.middle_name"} optional={true} />
                    <FormItem label="Last Name" name={residentType + ".resident.last_name"} />
                    <FormItem label="Suffix" name={residentType + ".resident.suffix"} optional={true}>
                        <BasicDropdown name={residentType + ".resident."} options={constants.suffixes} />
                    </FormItem>

                    {residentType != "lease_resident" && residentType.indexOf('minor') >= 0 &&
                        <div className="form-item">
                            <label>&nbsp;</label>
                            <a onClick={() => removeResident(arrayHelpers, index)}>Remove</a>
                        </div>
                    }
                </div>

                {residentType.indexOf('minor') < 0 &&
                    <div className="form-row">
                        <FormItem label="Email" name={residentType + ".resident.email"} type="email" />
                        <FormItem label="Phone" name={residentType + ".resident.phone_number"} mask={insightUtils.phoneNumberMask()} />

                        {residentType != "lease_resident" &&
                            <div className="form-item">
                                <label>&nbsp;</label>
                                <a onClick={() => removeResident(arrayHelpers, index)}>Remove</a>
                            </div>
                        }
                    </div>
                }
            </>}
        </>

    )}

export default ResidentFormRow;

