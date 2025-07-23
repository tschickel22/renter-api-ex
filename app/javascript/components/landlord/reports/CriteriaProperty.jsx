import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";
import {useSelector} from "react-redux";

const CriteriaProperty = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)
    const [label, setLabel] = useState("No Property Selected")

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, {propertyId: searchParams.get('property_id')})

    async function handlePropertyIdChange(newPropertyId) {
        setCriteriaOpen(false)
        handleRerunReport({property_id: newPropertyId})
    }

    useEffect(() => {
        if (criteriaOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setCriteriaOpen(false))
        }
    }, [criteriaOpen])

    useEffect(() => {
        let newLabel = "None"
        
        if (searchParams) {
            if (!searchParams.get('property_id') || parseInt(searchParams.get('property_id')) == -1) {
                newLabel = "Everything"
            }
            else if (parseInt(searchParams.get('property_id')) == -2) {
                newLabel = "Company-Level Only"
            }
            else if (parseInt(searchParams.get('property_id')) == -3) {
                newLabel = "All Properties"
            }
            else if (property) {
                newLabel = property.name
            }
            else {
                newLabel = "No Property Selected"
            }
        }

        setLabel(newLabel)

    }, [searchParams])

    return (
        <>
            <div className="criteria-wrapper">
                <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                    {label}
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select your property</strong>
                    <br/>
                    <a onClick={() => handlePropertyIdChange(-1)} className="criteria-option">Everything</a>
                    {insightUtils.isCompanyAdminAtLeast(currentUser) && <>
                        <a onClick={() => handlePropertyIdChange(-2)} className="criteria-option">Company-Level Only</a>
                        <a onClick={() => handlePropertyIdChange(-3)} className="criteria-option">All Properties</a>
                    </>}
                    {properties.filter((property) => property.status == "active").map((property, i) => (
                        <React.Fragment key={i}>
                            <a onClick={() => handlePropertyIdChange(property.id)} className="criteria-option">{property.name}</a>
                        </React.Fragment>
                    ))}
                </div>}
            </div>
        </>

    )}

export default CriteriaProperty;

