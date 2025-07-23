import React, {useEffect, useRef, useState} from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {searchForAccountReconciliations} from "../../../slices/accountReconciliationSlice";

const CriteriaAccountReconciliations = ({handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const { currentUser } = useSelector((state) => state.user)

    const [criteriaOpen, setCriteriaOpen] = useState(false)
    const [label, setLabel] = useState("No Account Reconciliations Selected")
    const [accountReconciliations, setAccountReconciliations] = useState(null)
    const [accountReconciliation, setAccountReconciliation] = useState(null)


    async function handleAccountReconciliationChange(newAccountReconciliationId) {
        setCriteriaOpen(false)
        handleRerunReport({account_reconciliation_id: newAccountReconciliationId})
    }

    useEffect(async() => {
        const results = await store.dispatch(searchForAccountReconciliations({})).unwrap()

        setAccountReconciliations(results.data.account_reconciliations)
        setAccountReconciliation(results.data.account_reconciliations.find((ar) => ar.hash_id == searchParams.get('account_reconciliation_id')))

    }, [])

    useEffect(async() => {
        if (accountReconciliations) {
            setAccountReconciliation(accountReconciliations.find((ar) => ar.hash_id == searchParams.get('account_reconciliation_id')))
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
            if (!searchParams.get('account_reconciliation_id') || parseInt(searchParams.get('account_reconciliation_id')) == -1) {
                newLabel = "-- Select Reconciliation --"
            }
            else if (accountReconciliation) {
                newLabel = accountReconciliation.bank_account_name + " - "+ insightUtils.formatDate(accountReconciliation.end_on)
            }
            else {
                newLabel = "No Reconciliation Selected"
            }
        }

        setLabel(newLabel)

    }, [searchParams, accountReconciliation])

    return (
        <>
            {accountReconciliations &&
                <div className="criteria-wrapper">
                    <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                        {label}
                    </a>

                    {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                        <strong>Select your reconciliation</strong>
                        <br/>
                        {accountReconciliations.filter((accountReconciliation) => accountReconciliation.status == "closed").map((accountReconciliation, i) => (
                            <React.Fragment key={i}>
                                <a onClick={() => handleAccountReconciliationChange(accountReconciliation.hash_id)} className="criteria-option">{accountReconciliation.bank_account_name} - {insightUtils.formatDate(accountReconciliation.end_on)}</a>
                            </React.Fragment>
                        ))}
                    </div>}
                </div>
            }
        </>

    )}

export default CriteriaAccountReconciliations;

