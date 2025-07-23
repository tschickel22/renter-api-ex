import React from 'react';
import {Field} from "formik";
import {useSelector} from "react-redux";

const PropertyOwnerPercentageDropdown = ({name, value}) => {

    return (
        <Field as="select" name={name} value={value} className="form-select">
            <option></option>
            <option value={"25.0"}>25%</option>
            <option value={"50.0"}>50%</option>
            <option value={"75.0"}>75%</option>
            <option value={"100.0"}>100%</option>
            <option value={-99}>Other</option>
        </Field>
    )}

export default PropertyOwnerPercentageDropdown;

