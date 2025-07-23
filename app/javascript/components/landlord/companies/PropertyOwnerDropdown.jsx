import React, {useEffect} from 'react';
import {Field, useFormikContext} from "formik";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const PropertyOwnerDropdown = ({name, propertyOwners}) => {

    let navigate = useNavigate()
    const formikProps = useFormikContext()

    function handleAddPropertyOwner(e) {
        if (e.target.value == "-99") {
            navigate(insightRoutes.propertyOwnerNew(), {state: {return_url: location.pathname, field_to_update: name, values: formikProps.values}})
        }
        else {
            formikProps.handleChange(e)
        }
    }

    return (
        <Field as="select" name={name} className="form-select" onChange={(e) => handleAddPropertyOwner(e)}>
                <option></option>
                <option value={-99}>Add New Owner...</option>
                {propertyOwners && <>
                        {propertyOwners.map((propertyOwner, i) => {
                                return (<option key={i} value={propertyOwner.id}>{propertyOwner.name}</option>)
                        })}
                </>}

        </Field>
    )}

export default PropertyOwnerDropdown;

