import React from 'react';
import {ErrorMessage, Field, useFormikContext} from "formik";
import MaskedInput from "react-text-mask";
import insightUtils from "../../app/insightUtils";

const FormItem = ({name, radioValue, label, type, optional, placeholder, children, mask, labelClass, formItemClass, avoidCheckBoxLabelAutoClick, hideError, maxLength, helpText, disabled}) => {

    const formikProps = useFormikContext()

    function toggleCheckbox(value) {
        if (!disabled) {

            // Is this an array?  If it is, we need to update the value accordingly
            if (radioValue && formikProps.values[name] && Array.isArray(formikProps.values[name])) {
                let newArray = Array.from(formikProps.values[name])

                // Does the value exist? Remove it
                if (newArray.indexOf(value) >= 0) {
                    newArray = newArray.filter((v) => v != value)
                }
                else {
                    newArray.push(value)
                }

                formikProps.setFieldValue(name, newArray)
            }
            else {
                formikProps.setFieldValue(name, value)
            }
        }
    }
    return (
        <div className={"form-item " + (formItemClass ? ` ${formItemClass}` : '')}>
            {
                type == "checkbox" &&
                <>
                    <label className={"checkbox-label " + (labelClass ? labelClass : '')} onClick={()=> (!avoidCheckBoxLabelAutoClick && toggleCheckbox(!insightUtils.getValue(formikProps.values, name)))}>
                        <Field
                            type="checkbox"
                            name={name}
                            >{({ field }) => {

                            let isChecked = false;

                            if (radioValue && formikProps.values[name] && Array.isArray(formikProps.values[name])) {
                                isChecked = formikProps.values[name].indexOf(radioValue) >= 0
                            }
                            else {
                                isChecked = field.value
                            }

                            return (
                                <>
                                    {!isChecked && <i onClick={() => toggleCheckbox(radioValue === undefined ? true : radioValue)} className="btn-checkbox fal fa-square"></i>}
                                    {isChecked && <i onClick={() => toggleCheckbox(radioValue === undefined ? false : radioValue)} className={"btn-checkbox fas fa-check-square" + (!disabled ? " active" : "")}></i>}
                                </>
                            );
                        }}
                        </Field>
                        {label && <>&nbsp;&nbsp;</>}
                        {label}
                        {!optional && <span>*</span>}
                    </label>

                    {!hideError && <ErrorMessage className="text-error" name={name} component="div"/>}
                </>
            }
            {
                type == "textarea" &&
                <>
                    {label && <label className={"checkbox-label " + (labelClass ? labelClass : '')}>
                        &nbsp;&nbsp;
                        {label}
                        {!optional && <span>*</span>}
                    </label>}

                    <Field as="textarea"
                           type="textarea"
                           name={name}
                           placeholder={placeholder}
                           className="form-input form-input-white"
                           cols={80}
                           rows={10}
                           disabled={disabled}
                    />

                    {maxLength && <div className="text-left text-muted">{maxLength - (formikProps.values[name] ? formikProps.values[name].length : 0)} Characters Remaining</div>}

                    {!hideError && <ErrorMessage className="text-error" name={name} component="div"/>}
                </>
            }
            {
                type == "radio" &&
                <>
                    <Field
                        name={name}
                        value={radioValue}
                        type="radio"
                        disabled={disabled}
                    >
                        {({ }) => (
                            <div onClick={() => formikProps.setFieldValue(name, radioValue)} className={"input-radio " + (insightUtils.getValue(formikProps.values, name) == radioValue ? "active" : "")}><i className={(insightUtils.getValue(formikProps.values, name) == radioValue ? "fa-circle input-radio-btn fas" : "fal fa-circle input-radio-btn")}></i><label dangerouslySetInnerHTML={{__html: label}} />&nbsp;&nbsp;&nbsp;</div>
                        )}
                    </Field>

                    {!hideError && <ErrorMessage className="text-error" name={name} component="div"/>}
                </>
            }
            {
                type != "checkbox" && type != "textarea" && type != "radio" &&
                <>
                    {label && <label className={(labelClass ? labelClass : '')}>{label}{!optional && <span>*</span>}</label>}
                    {children}
                    {!children && !mask && <>
                        {type == "read-only" ?
                            <div className="text-left">{insightUtils.getValue(formikProps.values, name)}</div>
                            :
                            <Field type={type || "text"} name={name} className="form-input form-input-white" disabled={disabled} placeholder={placeholder || ""}/>
                        }
                    </>}
                    {!children && mask && <MaskedInput
                        mask={mask}
                        name={name}
                        value={insightUtils.getValue(formikProps.values, name)}
                        className="form-input form-input-white"
                        type="text"
                        disabled={disabled}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                    />}
                    {helpText && <div className="text-muted text-left">{helpText}</div>}
                    {!hideError && <ErrorMessage className="text-error text-left" name={name} component="div"/>}
                </>
            }


        </div>
    )}

export default FormItem;

