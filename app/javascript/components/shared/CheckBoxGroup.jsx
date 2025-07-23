import React, {useEffect, useState} from 'react';
import {Field, useFormikContext} from "formik";
import insightUtils from "../../app/insightUtils";

const CheckBoxGroup = ({name, options, optionLabelName, handleOptionChange, direction, disabled, optionClassName}) => {
    const formikProps = useFormikContext()
    const newOptions = insightUtils.toOptions(options, optionLabelName)
    const flexClass = direction == "row" ? "flex-row" : (direction == "row-centered" ? "flex-row flex-center" : "flex-column")

    const [selectedValues, setSelectedValues] = useState([])

    useEffect(() => {
        const val = formikProps.values[name]

        if (val && Array.isArray(val)) {
            setSelectedValues(val)
        }
        else if (val) {
            setSelectedValues(val.split(","))
        }
    },[formikProps.values[name]])

    function toggleOption(newValue) {
        if (!disabled) {
            let newSelectedValues = Array.from(selectedValues)
            if (selectedValues.indexOf(newValue) >= 0) {
                newSelectedValues = newSelectedValues.filter((v) => v != newValue)
            }
            else {
                newSelectedValues.push(newValue)
            }

            formikProps.setFieldValue(name, newSelectedValues.join(","))

            if (handleOptionChange) handleOptionChange(newSelectedValues.join(","))
        }
    }

    return (
        <div className={flexClass} style={{width: "100%"}}>
            {
                Array.isArray(newOptions) ?
                    newOptions.map((opts, index) => (
                        <Field
                            key={index}
                            name={name}
                            value={opts[0]}
                            type="checkbox"
                        >
                            {({ }) => (
                                <div onClick={() => toggleOption(opts[0])} className={`input-radio ${optionClassName || 'st-col-25'} ` + (selectedValues.indexOf(opts[0]) >= 0 ? "active" : "")}><i className={(selectedValues.indexOf(opts[0]) >= 0 ? "fa-square input-radio-btn fas" : "fal fa-square input-radio-btn")}></i><label>{opts[1]}</label>&nbsp;&nbsp;&nbsp;</div>
                            )}
                        </Field>
                    ))
                    :
                    Object.keys(newOptions).map((value, index) => (
                        <Field
                            key={index}
                            name={name}
                            value={value}
                            type="checkbox"
                        >
                            {({ }) => (
                                <div onClick={() => toggleOption(value)} className={`input-radio ${optionClassName || 'st-col-25'} ` + (selectedValues.indexOf(value) >= 0 ? "active" : "")}><i className={(selectedValues.indexOf(value) >= 0 ? "fa-square input-radio-btn fas" : "fal fa-square input-radio-btn")}></i><label>{newOptions[value]}</label>&nbsp;&nbsp;&nbsp;</div>
                            )}
                        </Field>
                    ))
            }
        </div>
    )}

export default CheckBoxGroup;

