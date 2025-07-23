import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {useFormikContext} from "formik";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {loadAccount} from "../../../slices/accountSlice";

const ExpensePaymentListRow = ({payment, paymentAccounts, printingEnabled}) => {

    const navigate = useNavigate()
    const formikProps = useFormikContext()

    const { constants }= useSelector((state) => state.company)

    const [selectedAccount, setSelectedAccount] = useState(null)
    const [availableExpensePaymentStatuses, setAvailableExpensePaymentStatuses] = useState({})

    useEffect(() => {
        let newSelectedAccount = null;

        if (paymentAccounts && formikProps.values['payments'] && formikProps.values['payments']['l' + payment.expense_hash_id]['from_account_id']) {
            newSelectedAccount = paymentAccounts.find((pa) => { return pa.id == formikProps.values['payments']['l' + payment.expense_hash_id]['from_account_id']})
            console.log(newSelectedAccount)
        }

        setSelectedAccount(newSelectedAccount)

    }, [paymentAccounts, formikProps.values['payments'], formikProps.values['payments']['l' + payment.expense_hash_id]['from_account_id']])

    useEffect(() => {
        let newAvailableExpensePaymentStatuses = {};

        if (constants.expense_payment_statuses) {
            Object.keys(constants.expense_payment_statuses).forEach((key) => {
                if ((printingEnabled || key != constants.expense_payment_statuses.paper_check_queued.key) && key != constants.expense_payment_statuses.paper_check_printed.key) {
                    newAvailableExpensePaymentStatuses[key] = constants.expense_payment_statuses[key]
                }
            })
        }

        setAvailableExpensePaymentStatuses(newAvailableExpensePaymentStatuses)

    }, [constants, printingEnabled])

    async function handleGoConfigureCheckPrinting() {
        const results = await store.dispatch(loadAccount({accountCode: selectedAccount.code})).unwrap()

        // If this is a bank account, go somewhere else
        if (results.data.account.bank_account_hash_id) {
            navigate(insightRoutes.bankAccountEdit(results.data.account.bank_account_hash_id), {state: {return_url: location.pathname}})
        }
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-col-md-50 st-first-col">
                        <div>
                            <Link to={insightRoutes.expenseEdit(payment.expense_hash_id)} state={{return_url: location.pathname}}>{payment.description}</Link>
                            <br/>
                            <em>{payment.vendor_name}{payment.invoice_number && " (#" + payment.invoice_number + ")"} - Due: {insightUtils.formatDate(payment.due_on)}</em>
                        </div>
                    </div>
                    <div className="st-col-25 st-col-md-50">
                        <div style={{maxWidth: "95%"}}>
                            <FormItem label="" name={"payments.l" + payment.expense_hash_id + ".from_account_id"}>
                                <BasicDropdown name={"payments.l" + payment.expense_hash_id + ".from_account_id"} blankText="-- Select Account --" options={paymentAccounts}/>
                            </FormItem>
                            {formikProps.errors["payments"] && formikProps.errors["payments"]["l" + payment.expense_hash_id ] && formikProps.errors["payments"]["l" + payment.expense_hash_id ]["from_account_id"] && formikProps.errors["payments"]["l" + payment.expense_hash_id ]["from_account_id"].includes("not configured") &&
                                <a onClick={handleGoConfigureCheckPrinting} style={{textDecoration: 'underline'}}>Configure for Check Printing</a>
                            }
                        </div>
                    </div>
                    <div className="st-col-10 hidden-md">
                        {selectedAccount && <div style={{maxWidth: "95%"}}>
                            <FormItem name={"payments.l" + payment.expense_hash_id + ".amount"} label="" optional={true} mask={insightUtils.currencyMask()}/>
                        </div>}
                    </div>

                    <div className="st-col-25 hidden-md">
                        {selectedAccount &&
                            <div style={{maxWidth: "95%"}}>
                                <FormItem label="" name={"payments.l" + payment.expense_hash_id + ".expense_payment_status"}>
                                    <BasicDropdown name={"payments.l" + payment.expense_hash_id + ".expense_payment_status"} options={availableExpensePaymentStatuses} />
                                </FormItem>
                            </div>
                        }
                    </div>

                    <div className="st-col-15 hidden-md">
                        {selectedAccount && formikProps.values['payments'] && formikProps.values['payments']['l' + payment.expense_hash_id]['expense_payment_status'] == constants.expense_payment_statuses.paper_check_manual.key &&
                            <FormItem label="" name={"payments.l" + payment.expense_hash_id + ".extra_info"} placeholder={"Enter number"} optional={true}/>
                        }
                    </div>
                    <span className="st-nav-col">

                    </span>
                </div>
            </div>
            {selectedAccount &&
                <div className="st-row-wrap hidden visible-md">
                    <div className="st-row">
                        <span className="st-title st-col-33">Amount</span>
                        <span className="st-title st-col-33">Payment Method</span>
                        <span className="st-title st-col-33">Handwritten Check #</span>
                        <span className="st-nav-col"></span>
                    </div>
                    <div className="st-row">
                        <div className="st-col-33">
                            {selectedAccount && <>
                                <FormItem name={"payments.l" + payment.expense_hash_id + ".amount"} label="" optional={true} mask={insightUtils.currencyMask()}/>
                            </>}
                        </div>

                        <div className="st-col-33">
                            {selectedAccount &&
                                <FormItem label="" name={"payments.l" + payment.expense_hash_id + ".expense_payment_status"}>
                                    <BasicDropdown name={"payments.l" + payment.expense_hash_id + ".expense_payment_status"} options={constants.expense_payment_statuses} />
                                </FormItem>
                            }
                        </div>

                        <div className="st-col-33">
                            {selectedAccount && formikProps.values['payments'] && !formikProps.values['payments']['l' + payment.expense_hash_id]['expense_payment_status'] &&
                                <FormItem label="" name={"payments.l" + payment.expense_hash_id + ".extra_info"} placeholder={"Enter number"} optional={true}/>
                            }
                        </div>
                        <span className="st-nav-col">

                        </span>
                    </div>
                </div>
            }
        </>

    )
}

export default ExpensePaymentListRow;

