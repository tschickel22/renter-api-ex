import React from 'react';
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {Link} from "react-router-dom";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";

const AccountReconciliationItemListRow = ({accountReconciliation, itemsMode, accountEntry, updateClearedBalance}) => {

    const {constants} = useSelector((state) => state.company)
    const showRow = itemsMode == "all" || (itemsMode == "credits" && accountEntry.amount < 0) || itemsMode == "debits" && accountEntry.amount > 0

    function buildMemo() {
        return (accountEntry.transaction_type == "Expense" ?
            <Link to={insightRoutes.expenseEdit(accountEntry.related_object_hash_id)} state={{return_url: insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id)}}>{accountEntry.description}</Link>
            :
            <>
                {accountEntry.transaction_type == "Journal Entry" ?
                    <Link to={insightRoutes.journalEntryEdit(accountEntry.related_object_hash_id)} state={{return_url: insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id)}}>{accountEntry.description}</Link>
                    :
                    <>{accountEntry.description}</>
                }
            </>)
    }


    return (
        <>
            {showRow &&
                <div className="st-row-wrap">
                    <div className="st-row">
                        <div className="st-col-15 st-col-md-75 flex-column">
                            <div className="visible-md">
                                {accountEntry.transaction_type}<br/>
                                {buildMemo()}
                            </div>
                            {insightUtils.formatDate(accountEntry.entry_on)}
                        </div>
                        <div className="st-col-15 hidden-md">
                            {accountEntry.property_name}
                        </div>
                        <div className="st-col-15 hidden-md">
                            {accountEntry.transaction_type}
                        </div>
                        <div className="st-col-30 st-col-lg-20 hidden-md">
                            {buildMemo()}
                        </div>
                        <div className="st-col-15 st-col-md-20 text-right visible-md">
                            {insightUtils.numberToCurrency(accountEntry.amount * -1, 2)}
                        </div>
                        <div className="st-col-15 st-col-md-25 text-right hidden-md">
                            {accountEntry.amount > 0 ? insightUtils.numberToCurrency(accountEntry.amount, 2) : ""}
                        </div>
                        <div className="st-col-15 st-col-md-25 text-right hidden-md">
                            {accountEntry.amount < 0 ? insightUtils.numberToCurrency(accountEntry.amount * -1, 2) : ""}
                        </div>
                        <span className="st-col-05" onClick={() => updateClearedBalance()}>
                            {accountReconciliation.status == constants.account_reconciliation_status_options.open.key && <FormItem avoidCheckBoxLabelAutoClick={true} name="account_entry_object_ids" radioValue={accountEntry.related_object_type_and_id} type="checkbox" formItemClass="form-checkbox-standalone" optional={true}/>}
                        </span>
                    </div>
                </div>
            }

        </>

    )}

export default AccountReconciliationItemListRow;

