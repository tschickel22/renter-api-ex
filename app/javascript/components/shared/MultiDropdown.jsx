import React, { useEffect, useState } from 'react';
import {useFormikContext} from "formik";
import {Autocomplete, TextField} from "@mui/material";

const AutocompleteMultiDropdown = ({name, label, blankText, options, handleChange, groupBy}) => {
    const [defaultValues, setDefaultValues] = useState([])
    const [opts, setOpts] = useState(options??[])
    const formikProps = useFormikContext()

    useEffect(() => {
      const selectedRecipientIds = formikProps.values[name].map((recipient) => recipient.id)
      const selectedValues = opts.filter((option) => selectedRecipientIds.includes(option.id))
      setDefaultValues(selectedValues)

    }, [formikProps.values[name], opts]);

    useEffect(() => {
      setOpts(options)
    }, [options])

    return (
        <Autocomplete
            autoHighlight={false}
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
            value={defaultValues}
            options={opts}
            getOptionLabel={(option) => (option.name)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            {...(groupBy ? { groupBy: (option) => option[groupBy] } : {})}
        />
    )}

export default AutocompleteMultiDropdown;

