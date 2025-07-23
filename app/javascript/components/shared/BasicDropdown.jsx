import React from 'react';
import {Field, useFormikContext} from "formik";
import insightUtils from "../../app/insightUtils";

const BasicDropdown = ({name, extraClass, blankText, options, onChange, optionLabelName}) => {

    // Were constants passed or do we already have a nice {key => value} mapping?
    const newOptions = insightUtils.toOptions(options, optionLabelName)
    const formikProps = useFormikContext()

    return (
        <Field as="select" name={name} className={"form-select form-select-white " + (extraClass || "")} onChange={(e) => {
            formikProps.handleChange(e);
            if (onChange) onChange(e)
        }}>
            {!(blankText === false) &&
                <option value="">{blankText || ""}</option>
            }
            {
                Array.isArray(newOptions) ?
                    newOptions.map((opts, index) => (
                        <option key={index} value={opts[0]}>{opts[1]}</option>
                    ))
                :
                    Object.keys(newOptions).map((value, index) => (
                        <option key={index} value={value}>{newOptions[value]}</option>
                    ))
            }
        </Field>
    )}

export default BasicDropdown;

