import React from 'react';
import {Field, useFormikContext} from "formik";
import insightUtils from "../../app/insightUtils";

const RadioButtonGroup = ({name, options, optionLabelName, handleOptionChange, direction, extraClassName, disabled}) => {
    const formikProps = useFormikContext()
    const newOptions = insightUtils.toOptions(options, optionLabelName)
    const flexClass = direction == "row" ? "flex-row" : (direction == "row-centered" ? "flex-row flex-center" : "flex-column")

    function selectOption(newValue) {
        if (!disabled) {
            formikProps.setFieldValue(name, newValue)

            if (handleOptionChange) handleOptionChange(newValue)
        }
    }

    return (
        <div className={extraClassName || flexClass}>
            {
                Array.isArray(newOptions) ?
                    newOptions.map((opts, index) => (
                        <Field
                            key={index}
                            name={name}
                            value={opts[0]}
                            type="radio"
                            disabled={disabled}
                        >
                            {({ }) => (
                                <div onClick={() => selectOption(opts[0])} className={"input-radio " + (insightUtils.getValue(formikProps.values, name) == opts[0] ? "active" : "")}><i className={`${disabled && 'input-radio-btn-disabled'} ` + (insightUtils.getValue(formikProps.values, name) == opts[0] ? "fa-circle input-radio-btn fas" : "fal fa-circle input-radio-btn")}></i><label>{opts[1]}</label>&nbsp;&nbsp;&nbsp;</div>
                            )}
                        </Field>
                    ))
                    :
                    Object.keys(newOptions).map((value, index) => (
                        <Field
                            key={index}
                            name={name}
                            value={value}
                            type="radio"
                            disabled={disabled}
                        >
                            {({ }) => (
                                <div onClick={() => selectOption(value)} className={"input-radio " + (insightUtils.getValue(formikProps.values, name) == value ? "active" : "")}><i className={`${disabled && 'input-radio-btn-disabled'} ` + (insightUtils.getValue(formikProps.values, name) == value ? "fa-circle input-radio-btn fas" : "fal fa-circle input-radio-btn")}></i><label>{newOptions[value]}</label>&nbsp;&nbsp;&nbsp;</div>
                            )}
                        </Field>
                    ))
            }
        </div>
    )}

export default RadioButtonGroup;

