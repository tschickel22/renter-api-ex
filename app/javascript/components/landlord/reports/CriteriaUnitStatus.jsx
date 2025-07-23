import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";

const CriteriaUnitStatus = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)

    async function handleUnitStatusChange(newUnitStatus) {
        setCriteriaOpen(false)
        handleRerunReport({unit_status: newUnitStatus})
    }

    useEffect(() => {
        if (criteriaOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setCriteriaOpen(false))
        }
    }, [criteriaOpen])

    return (
        <>
            <div className="criteria-wrapper">
                <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                    Units:
                    {(!searchParams.get('unit_status') || searchParams.get('unit_status') == "occupied") ?
                        <>&nbsp;Occupied</> :
                        (searchParams.get('unit_status') == "vacant" ?
                            <>&nbsp;Vacant</> :
                            <>&nbsp;All</>)
                    }
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select&nbsp;type&nbsp;of&nbsp;units</strong>
                    <br/>
                    <a onClick={() => handleUnitStatusChange("occupied")} className="criteria-option">Occupied</a>
                    <a onClick={() => handleUnitStatusChange("vacant")} className="criteria-option">Vacant</a>
                    <a onClick={() => handleUnitStatusChange("all")} className="criteria-option">All</a>
                </div>}
            </div>
        </>

    )}

export default CriteriaUnitStatus;

