import React, {useState} from 'react';
import {Field, useFormikContext} from "formik";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {updateFloorPlanNames} from "../../../slices/companySlice";

const FloorPlanNameDropdown = ({name}) => {
    const { floorPlanNames } = useSelector((state) => state.company)
    const formikProps = useFormikContext()
    const [addingFloorPlanName, setAddingFloorPlanName] = useState(false)

    function handleFloorPlanChange(e) {
        if (e.target.value == "-99" || e.target.value == "-98") {
            setAddingFloorPlanName(true)
            if (e.target.value == "-99") formikProps.setFieldValue(name, "")
        }
        else {
            formikProps.handleChange(e)

            if (floorPlanNames[e.target.value]) {
                const unitDefaults = floorPlanNames[e.target.value]

                if (unitDefaults.beds) formikProps.setFieldValue(name.replace("floor_plan_name", "beds"), unitDefaults.beds)
                if (unitDefaults.baths) formikProps.setFieldValue(name.replace("floor_plan_name", "baths"), unitDefaults.baths)
                if (unitDefaults.square_feet) formikProps.setFieldValue(name.replace("floor_plan_name", "square_feet"), unitDefaults.square_feet)
            }
        }
    }

    function handleFloorPlanNameBlur(e) {

        if (e.target.value && e.target.value.length > 0) {

            let newFloorPlanNames = Object.assign({}, floorPlanNames)

            if (!newFloorPlanNames[e.target.value]) {
                newFloorPlanNames[e.target.value] = {}
            }

            store.dispatch(updateFloorPlanNames({newFloorPlanNames: newFloorPlanNames}))

            setAddingFloorPlanName(false)
        }
    }

    return (
        <>
            {addingFloorPlanName &&
                <Field type="text" name={name} className="form-input form-input-white" placeholder="Enter floor plan name" onBlur={(e) => handleFloorPlanNameBlur(e)} />
            }
            {!addingFloorPlanName &&
                <Field as="select" name={name} className="form-select" onChange={(e) => handleFloorPlanChange(e)}>
                    <option></option>
                    <option value={-99}>Add Floor Plan...</option>
                    <option value={-98}>Edit Floor Plan Name</option>
                    {floorPlanNames && <>
                        {Object.keys(floorPlanNames).sort().map((floorPlanName, i) => {
                            return (<option key={i} value={floorPlanName}>{floorPlanName}</option>)
                        })}
                    </>}

                </Field>
            }
        </>
    )}

export default FloorPlanNameDropdown;

