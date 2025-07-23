import React from 'react';
import {Outlet} from "react-router-dom";
import {ErrorMessage, Field} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import MaskedInput from "react-text-mask";
import insightUtils from "../../../app/insightUtils";

const ResidentCompactFormRow = ({residentType, resident, index, arrayHelpers, residentLabel}) => {

    function cancelNewResident(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <>
            <div className="form-row">
                <FormItem label={(residentLabel ? residentLabel : "Applicant") + " First Name"} name={residentType + ".resident.first_name"} />
                <FormItem label={(residentLabel ? residentLabel : "Applicant") + " Last Name"} name={residentType + ".resident.last_name"} />
                <FormItem label={(residentLabel ? residentLabel : "Applicant") + " Email"} name={residentType + ".resident.email"} type="email" />
                <FormItem label={(residentLabel ? residentLabel : "Applicant") + " Phone"} name={residentType + ".resident.phone_number"} type="phone_number" optional={true} mask={insightUtils.phoneNumberMask()} />

                {residentType != "primary_resident" && resident && !resident.id &&
                    <div className="form-item">
                        <label>&nbsp;</label>
                        <a onClick={() => cancelNewResident(arrayHelpers, index)}>Remove</a>
                    </div>
                }
            </div>
        </>

    )}

export default ResidentCompactFormRow;

