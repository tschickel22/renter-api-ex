import React from 'react';
import {Field} from "formik";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";

const PropertyTypeDropdown = ({name}) => {

    return (
        <Field as="select" name={name} className="form-select">
            <option></option>
            <option value="condo">{insightUtils.propertyTypePretty("condo")}</option>
            <option value="house">{insightUtils.propertyTypePretty("house")}</option>
            <option value="apartment">{insightUtils.propertyTypePretty("apartment")}</option>
            <option value="duplex">{insightUtils.propertyTypePretty("duplex")}</option>
        </Field>
    )}

export default PropertyTypeDropdown;

