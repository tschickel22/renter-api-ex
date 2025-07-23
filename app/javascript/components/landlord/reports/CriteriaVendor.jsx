import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";
import store from "../../../app/store";
import {searchForVendors} from "../../../slices/vendorSlice";

const CriteriaVendor = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)
    const [label, setLabel] = useState("No Vendor Selected")
    const [vendor, setVendor] = useState(null)
    const [vendors, setVendors] = useState(null)

    async function handleVendorIdChange(newVendorId) {
        setCriteriaOpen(false)
        handleRerunReport({vendor_id: newVendorId})
        setVendor(vendors.find((v) => v.id == parseInt(newVendorId)))
    }

    useEffect(async() => {
        const results = await store.dispatch(searchForVendors({})).unwrap()

        setVendors(results.data.vendors)
        setVendor(results.data.vendors.find((v) => v.id == parseInt(searchParams.get('vendor_id'))))

    }, [])

    useEffect(async() => {
        if (vendors) {
            setVendor(vendors.find((v) => v.id == parseInt(searchParams.get('vendor_id'))))
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
            if (!searchParams.get('vendor_id') || parseInt(searchParams.get('vendor_id')) == -1) {
                newLabel = "All Vendors"
            }
            else if (vendor) {
                newLabel = vendor.name
            }
            else {
                newLabel = "No Vendor Selected"
            }
        }

        setLabel(newLabel)

    }, [searchParams, vendor])

    return (
        <>
            {vendors && <div className="criteria-wrapper">
                <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                    {label}
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select your vendor</strong>
                    <br/>
                    <a onClick={() => handleVendorIdChange(-1)} className="criteria-option">All Vendors</a>
                    {vendors.map((vendor, i) => (
                        <React.Fragment key={i}>
                            <a onClick={() => handleVendorIdChange(vendor.id)} className="criteria-option">{vendor.name}</a>
                        </React.Fragment>
                    ))}
                </div>}
            </div>}
        </>

    )}

export default CriteriaVendor;

