import React, {useEffect, useState} from 'react';
import {useFormikContext} from "formik";
import {Autocomplete, TextField} from "@mui/material";
import insightUtils from "../../app/insightUtils";

const AutocompleteDropdown = ({name, label, blankText, options, handleChange}) => {

    const formikProps = useFormikContext()

    const [dedupedOptions, setDedupedOptions] = useState([])

    useEffect(() => {
        // If an option has a duplicate name, append its ID to be able to identify it
        let newOptions = []

        if (options) {
            options.forEach((option) => {
                const matches = options.filter((o) => o.name == option.name)

                if (matches.length > 1) {
                    let newOption = {...option}
                    newOption.name = `${newOption.name} (${newOption.id})`
                    newOptions.push(newOption)
                }
                else {
                    newOptions.push(option)
                }
            })
        }

        setDedupedOptions(newOptions)
    }, [options])

    return (
        <Autocomplete
            autoHighlight={true}

            onChange={(event, value) => {
                formikProps.setFieldValue(name, value.id)
                if (handleChange) handleChange(value.id)
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    margin="normal"
                    label={label}
                    fullWidth
                />
            )}
            value={dedupedOptions.find((option) => option.id == insightUtils.getValue(formikProps.values, name)) || {id: "", name: blankText}}
            defaultValue={dedupedOptions.find((option) => option.id == insightUtils.getValue(formikProps.values, name)) || {id: "", name: blankText}}
            options={blankText ? [{id: "", name: blankText}].concat(dedupedOptions) : dedupedOptions}
            getOptionLabel={(option) => (option.name)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
        />
    )}

export default AutocompleteDropdown;

