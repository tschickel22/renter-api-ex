import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";


const CriteriaAccountingMethod = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [criteriaOpen, setCriteriaOpen] = useState(false)

    async function handleAccountingMethodChange(newAccountingMethod) {
        setCriteriaOpen(false)
        handleRerunReport({accounting_method: newAccountingMethod})
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
                    {(!searchParams.get('accounting_method') || searchParams.get('accounting_method') == "cash") ?
                        <>Cash</>
                        :
                        <>Accrual</>
                    }
                </a>

                {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                    <strong>Select&nbsp;your&nbsp;accounting&nbsp;method</strong>
                    <br/>
                    <a onClick={() => handleAccountingMethodChange("cash")} className="criteria-option">Cash</a>
                    <a onClick={() => handleAccountingMethodChange("accrual")} className="criteria-option">Accrual</a>
                </div>}
            </div>
        </>

    )
}

export default CriteriaAccountingMethod;

