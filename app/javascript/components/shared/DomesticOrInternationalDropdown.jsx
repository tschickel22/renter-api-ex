import React from 'react';
import {Field} from "formik";

const DomesticOrInternationalDropdown = ({name}) => {

    return (
        <Field as="select" name={name} className="form-select">
            <option></option>
            <option value="usa">United States of America</option>
            <option value="international">International</option>
        </Field>
    )}

export default DomesticOrInternationalDropdown;

