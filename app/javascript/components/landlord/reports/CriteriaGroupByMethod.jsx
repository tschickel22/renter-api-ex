import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";

const CriteriaGroupByMethod = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)

    async function handleGroupByMethodChange(newGroupByMethod) {
        setCriteriaOpen(false)
        handleRerunReport({group_by_method: newGroupByMethod})
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
                    Group By:
                    {(!searchParams.get('group_by_method') || searchParams.get('group_by_method') == "property") ?
                        <>&nbsp;Property</>
                        :
                        <>&nbsp;Month</>
                    }
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select&nbsp;your&nbsp;grouping&nbsp;method</strong>
                    <br/>
                    <a onClick={() => handleGroupByMethodChange("property")} className="criteria-option">Property</a>
                    <a onClick={() => handleGroupByMethodChange("month")} className="criteria-option">Month</a>
                </div>}
            </div>
        </>

    )}

export default CriteriaGroupByMethod;

