import React from 'react';
import {useFormikContext} from "formik";
import {Autocomplete, TextField} from "@mui/material";

const AutocompleteMultiDropdown = ({name, label, blankText, options, handleChange, groupBy}) => {

    const formikProps = useFormikContext()

    console.log("formikProps.values[name]", options, name, formikProps.values[name]);
    return (
        <Autocomplete
            autoHighlight={true}
            multiple
            onChange={(event, value) => {
                formikProps.setFieldValue(name, value)
                if (handleChange) handleChange(value)
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    onChange={handleChange}
                    margin="normal"
                    label={label}
                    fullWidth
                    value={formikProps.values[name]}
                />
            )}
            defaultValue={
              options.find((option) => option.id == formikProps.values[name])
            }
            options={blankText ? [{id: "", name: blankText}].concat(options) : options}
            getOptionLabel={(option) => (option.name)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            {...(groupBy ? { groupBy: (option) => option[groupBy] } : {})}
        />
    )}

export default AutocompleteMultiDropdown;

