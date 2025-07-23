import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";
import store from "../../../app/store";
import {searchForPropertyOwners} from "../../../slices/propertySlice";


const CriteriaPropertyOwner = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)
    const [label, setLabel] = useState("No PropertyOwner Selected")
    const [propertyOwner, setPropertyOwner] = useState(null)
    const [propertyOwners, setPropertyOwners] = useState(null)

    async function handlePropertyOwnerIdChange(newPropertyOwnerId) {
        setCriteriaOpen(false)
        handleRerunReport({property_owner_id: newPropertyOwnerId})
        setPropertyOwner(propertyOwners.find((v) => v.id == parseInt(newPropertyOwnerId)))
    }

    useEffect(async() => {
        const results = await store.dispatch(searchForPropertyOwners({})).unwrap()

        setPropertyOwners(results.data.property_owners)
        setPropertyOwner(results.data.property_owners.find((v) => v.id == parseInt(searchParams.get('property_owner_id'))))

    }, [])

    useEffect(async() => {
        if (propertyOwners) {
            setPropertyOwner(propertyOwners.find((v) => v.id == parseInt(searchParams.get('property_owner_id'))))
        }

    }, [searchParams])

    useEffect(() => {
        if (criteriaOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setCriteriaOpen(false))
        }
    }, [criteriaOpen])

    useEffect(() => {
        let newLabel = "None"
        
        if (searchParams) {
            if (!searchParams.get('property_owner_id') || parseInt(searchParams.get('property_owner_id')) == -1) {
                newLabel = "All Owners"
            }
            else if (propertyOwner) {
                newLabel = propertyOwner.name
            }
            else {
                newLabel = "No Owner Selected"
            }
        }

        setLabel(newLabel)

    }, [searchParams, propertyOwner])

    return (
        <>
            {propertyOwners && <div className="criteria-wrapper">
                <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                    {label}
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select an owner</strong>
                    <br/>
                    <a onClick={() => handlePropertyOwnerIdChange(-1)} className="criteria-option">All Owners</a>
                    {propertyOwners.map((propertyOwner, i) => (
                        <React.Fragment key={i}>
                            <a onClick={() => handlePropertyOwnerIdChange(propertyOwner.id)} className="criteria-option">{propertyOwner.name}</a>
                        </React.Fragment>
                    ))}
                </div>}
            </div>}
        </>

    )}

export default CriteriaPropertyOwner;

