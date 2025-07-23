import React, {useEffect, useState} from 'react';
import {useFormikContext} from "formik";

const ToggleSwitch = ({name, label, onChange}) => {

    const formikProps = useFormikContext()

    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        setIsActive(formikProps.values[name])
    }, [])

    function handleToggle() {
        formikProps.setFieldValue(name, !isActive)
        setIsActive(!isActive)
        onChange(!isActive)
    }

    return (
        <div onClick={() => handleToggle()} className={"toggle-item" + (isActive ? " active" : "")}>
            <div className="toggle-item-label">{label}<span></span><i className={(isActive ? "fad fa-toggle-on" : "fad fa-toggle-off")}></i></div>
        </div>
    )}

export default ToggleSwitch;

