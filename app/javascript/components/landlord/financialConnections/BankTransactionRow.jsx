import React, {useEffect, useState} from "react";
import insightUtils from "../../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import ToolTip from "../../shared/ToolTip";

const BankTransactionRow = ({bankTransaction, bankAccount, setReviewingTransaction, selected, setSelected}) => {
    const navigate = useNavigate()
    const { constants } = useSelector((state) => state.company)

    function navigateToViewRelatedObject(bankTransaction) {

        if (bankTransaction.related_object_type == "Expense") {
            if (bankTransaction.related_object_hash_id) {
                navigate(insightRoutes.expenseEdit(bankTransaction.related_object_hash_id), {state: {return_url: location.pathname}})
            }
            else {
                let newValues = {description: bankTransaction.description, amount: bankTransaction.amount, paid_on: bankTransaction.transacted_at, payment_account_id: bankAccount.account_id, bank_transaction_id: bankTransaction.id, vendor_id: bankTransaction.related_object_vendor_id }
                newValues.amount = Math.abs(newValues.amount)

                if (bankTransaction.related_object_account_splits) newValues.expense_account_splits = bankTransaction.related_object_account_splits

                navigate(insightRoutes.expenseNew(), {state: {return_url: location.pathname, values: newValues, from_bank_transaction_id: bankTransaction.id}})
            }

        }
        else if (bankTransaction.related_object_type == "JournalEntry") {
            navigate(insightRoutes.journalEntryEdit(bankTransaction.related_object_hash_id), {state: {return_url: location.pathname}})
        }
    }

    function toggleSelection(id) {
        let newSelected = [...selected]

        if (newSelected.includes(id)) {
            newSelected.splice( newSelected.indexOf(id), 1 )
        }
        else {
            newSelected.push(id)
        }

        setSelected(newSelected)
    }

    function getDescription(bankTransaction) {
        return (<>
            {bankTransaction.status == constants.bank_transaction_status_options.categorized.key ?
                <>
                    {bankTransaction.related_object_description}
                    {bankTransaction.description != bankTransaction.related_object_description &&
                        <ToolTip icon={<i className="far fa-exclamation-circle"></i>} explanation={`Description from bank: ${bankTransaction.description}`} />
                    }
                </>
                :
                <>
                    {bankTransaction.description}
                </>
            }
        </>)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-15 st-first-col">
                        {setSelected &&
                            <i className={"fa-square btn-checkbox " + (selected.includes(bankTransaction.id) ? "fas active" : "fal")} onClick={() => toggleSelection(bankTransaction.id)}></i>
                        }
                        <div className="flex flex-column">
                            {bankTransaction.status == constants.bank_transaction_status_options.categorized.key ?
                                <div>
                                    {insightUtils.formatDate(bankTransaction.related_object_date)}
                                    {insightUtils.formatDate(bankTransaction.transacted_at) != insightUtils.formatDate(bankTransaction.related_object_date) &&
                                        <ToolTip icon={<i className="far fa-exclamation-circle"></i>} explanation={`Date from bank: ${insightUtils.formatDate(bankTransaction.transacted_at)}`} />
                                    }
                                </div>
                                :
                                <>
                                    {insightUtils.formatDate(bankTransaction.transacted_at)}
                                </>
                            }

                            <div className="visible-md">
                                {getDescription(bankTransaction)}
                                <div className="text-muted text-small">{bankTransaction.company_or_property_name}</div>
                                {[constants.bank_transaction_status_options.new.key, constants.bank_transaction_status_options.categorized.key].includes(bankTransaction.status) &&
                                    <div>
                                        Assigned to: {bankTransaction.related_object_assignment}
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                    <div className="st-col-15 hidden-md">
                        {bankTransaction.company_or_property_name}
                    </div>
                    <div className="st-col-15 hidden-md">
                        {getDescription(bankTransaction)}
                    </div>

                    {[constants.bank_transaction_status_options.new.key, constants.bank_transaction_status_options.categorized.key].includes(bankTransaction.status) &&
                        <div className="st-col-15 hidden-md">
                            {bankTransaction.related_object_assignment}
                        </div>
                    }

                    {bankTransaction.status == constants.bank_transaction_status_options.excluded.key && <></>}

                    <div className="st-col-15 text-right">
                        {bankTransaction.status == constants.bank_transaction_status_options.categorized.key ?
                            <>
                                {bankTransaction.amount != bankTransaction.related_object_amount ?
                                    <><ToolTip icon={<i className="far fa-exclamation-circle"></i>} explanation={`Amount from bank: ${insightUtils.numberToCurrency(bankTransaction.amount, 2)}`} /> {insightUtils.numberToCurrency(bankTransaction.related_object_amount, 2)}</>
                                    :
                                    <>{insightUtils.numberToCurrency(bankTransaction.related_object_amount, 2)}</>
                                }
                            </>
                            :
                            <>
                                {insightUtils.numberToCurrency(bankTransaction.amount, 2)}
                            </>
                        }
                    </div>
                    <div className="st-col-15 text-center">
                        {bankTransaction.status == constants.bank_transaction_status_options.categorized.key ?
                            <>
                                {["Expense", "JournalEntry"].includes(bankTransaction.related_object_type) && <a className="btn btn-red" onClick={() => navigateToViewRelatedObject(bankTransaction)}>View</a>}
                                &nbsp;
                                <a className="btn btn-gray" onClick={() => setReviewingTransaction(bankTransaction)}>Undo</a>
                            </>
                            :
                            <>
                            {bankTransaction.status == constants.bank_transaction_status_options.excluded.key ?
                                    <a className="btn btn-red" onClick={() => setReviewingTransaction(bankTransaction)}>Undo</a>
                                    :
                                <>
                                    <a className="btn btn-red" onClick={() => setReviewingTransaction(bankTransaction)}>Review</a>
                                    &nbsp;
                                    {["Expense", "JournalEntry"].includes(bankTransaction.related_object_type) && <a onClick={() => navigateToViewRelatedObject(bankTransaction)} style={{marginRight: "-12px"}}><i className="fa fa-bolt-lightning"/></a>}
                                </>
                                }
                            </>
                        }
                    </div>
                </div>
            </div>
        </>

    )
}

export default BankTransactionRow;

