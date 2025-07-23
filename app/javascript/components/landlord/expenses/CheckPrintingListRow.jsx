import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {useFormikContext} from "formik";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {loadLeaseForLedgerItem} from "../../../slices/chargeSlice";
import {loadExpensePayment} from "../../../slices/paymentSlice";

const CheckPrintingListRow = ({printedCheck, paymentAccounts, mode}) => {
    let navigate = useNavigate()
    const formikProps = useFormikContext()

    const { constants }= useSelector((state) => state.company)

    const [selectedAccount, setSelectedAccount] = useState(null)

    useEffect(() => {
        let newSelectedAccount = null;

        if (paymentAccounts && formikProps.values['printed_checks'] && formikProps.values['printed_checks']['l' + printedCheck.hash_id] && formikProps.values['printed_checks']['l' + printedCheck.hash_id]['from_account_id']) {
            newSelectedAccount = paymentAccounts.find((pa) => { return pa.id == formikProps.values['printed_checks']['l' + printedCheck.hash_id]['from_account_id']})
            console.log(newSelectedAccount)
        }

        setSelectedAccount(newSelectedAccount)

    }, [paymentAccounts, formikProps.values['printed_checks'] && formikProps.values['printed_checks']['l' + printedCheck.hash_id] && formikProps.values['printed_checks']['l' + printedCheck.hash_id]['from_account_id']])

    async function redirectToRelatedObject() {

        if (printedCheck.related_object_type == "LedgerItem") {
            const results = await store.dispatch(loadLeaseForLedgerItem({ledgerItemId: printedCheck.related_object_hash_id})).unwrap()
            navigate(insightRoutes.residentLedger(results.data.lease.hash_id))
        }
        else if (printedCheck.related_object_type == "Payment") {
            const results = await store.dispatch(loadExpensePayment({paymentHashId: printedCheck.related_object_hash_id})).unwrap()
            navigate(insightRoutes.billEdit(results.data.expense_payment.expense.hash_id))
        }
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-10 st-first-col">
                        <FormItem label="" name={"printed_checks.l" + printedCheck.hash_id + ".status"} radioValue={mode == "print" ? constants.expense_payment_statuses.paper_check_queued.key : constants.expense_payment_statuses.paper_check_printed.key} type="checkbox" optional={true} formItemClass="form-item-center" />
                    </div>
                    <div className="st-col-25">
                        <div>
                            <a onClick={() => redirectToRelatedObject()}>{printedCheck.description}</a>
                            <br/>
                            <em>{printedCheck.paid_to} {printedCheck.memo}</em>
                            <span className="visible-md"><br/>{insightUtils.numberToCurrency(printedCheck.amount, 2)}</span>
                        </div>
                    </div>
                    <div className="st-col-15 hidden-md">
                        {insightUtils.numberToCurrency(printedCheck.amount, 2)}
                    </div>
                    <div className="st-col-25">
                        {selectedAccount && selectedAccount.name}
                    </div>
                    <div className="st-col-10 st-col-md-20">
                        {mode == "print" && formikProps.values['printed_checks'] && formikProps.values['printed_checks']['l' + printedCheck.hash_id] &&
                            <FormItem label="" name={"printed_checks.l" + printedCheck.hash_id + ".check_number"} placeholder={"Enter number"} optional={true} />
                        }
                        {mode == "reprint" && formikProps.values['printed_checks'] && formikProps.values['printed_checks']['l' + printedCheck.hash_id] && formikProps.values['printed_checks']['l' + printedCheck.hash_id]['check_number'] &&
                            <>{formikProps.values['printed_checks']['l' + printedCheck.hash_id]['check_number']}</>
                        }
                    </div>
                    <div className="st-col-15 hidden-md text-right">
                        {mode == "print" ?
                            <>{selectedAccount && insightUtils.numberToCurrency(selectedAccount.balance, 2)}</>
                            :
                            <>{insightUtils.formatDate(formikProps.values['printed_checks']['l' + printedCheck.hash_id]['printed_on'])}</>
                        }
                    </div>
                    <span className="st-nav-col">
                    </span>
                </div>
            </div>

        </>

    )}

export default CheckPrintingListRow;

