import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";

import {generateBarCode, loadInvoice} from "../../../slices/invoiceSlice";
import store from "../../../app/store";
import {loadLease} from "../../../slices/leaseSlice";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const InvoiceShowPage = ({}) => {
    let params = useParams();

    const { constants } = useSelector((state) => state.company)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [cashPaymentMethod, setCashPaymentMethod] = useState(null)
    const [recurringPaymentMethod, setRecurringPaymentMethod] = useState(null)
    const [cashPaymentBarCodeData, setCashPaymentBarCodeData] = useState(null)

    const [invoice, setInvoice] = useState(null)

    async function loadData() {
        /*
           Load Lease
         */
        const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

        if (results.data.success) {
            const newLease = results.data.lease
            setLease(newLease)

            const invoiceResults = await store.dispatch(loadInvoice({invoiceId: params.invoiceId})).unwrap()

            setLeaseResident(invoiceResults.data.lease_resident)
            setCashPaymentMethod(invoiceResults.data.cash_payment_method)
            setRecurringPaymentMethod(invoiceResults.data.recurring_payment_method)

            if (invoiceResults.data.cash_payment_method) {
                const barCodeResults = await store.dispatch(generateBarCode({leaseResidentId: invoiceResults.data.lease_resident.hash_id})).unwrap()

                setCashPaymentBarCodeData(barCodeResults.data.base64_barcode)
            }

            setInvoice(invoiceResults.data.invoice)
        }
        else {
            setBaseErrors("Unable to load lease.")
        }
    }

    useEffect(() => {
        loadData()
    }, []);


    return (
        <div className="invoice-page">
            {invoice && <>
                <div className="invoice-header">
                    <span className="invoice-company-name">{invoice.invoice_name}</span>
                    <h1 className="invoice-title">Invoice</h1>
                    <div className="invoice-address">{invoice.invoice_street}<br/>{invoice.invoice_city}, {invoice.invoice_state} {invoice.invoice_zip}</div>

                </div>

                <div className="invoice-resident-block">
                    <div className="invoice-resident">
                        <strong>{leaseResident.resident.name}</strong><br/>
                        {lease.unit.street_and_unit}<br/>
                        {lease.unit.city}, {lease.unit.state} {lease.unit.zip}
                    </div>
                    <div className="invoice-autopay">
                        <table>
                            <tbody>
                            <tr>
                                <td>Invoice Date</td>
                                <td className="text-right">{insightUtils.formatDate(invoice.invoice_on)}</td>
                            </tr>
                            <tr>
                                <td>Lease ID</td>
                                <td className="text-right">{invoice.lease_hash_id}</td>
                            </tr>
                            </tbody>
                        </table>
                        {leaseResident.recurring_payment_frequency && leaseResident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key ?
                            <>
                                <strong>*Autopay - ON</strong><br/>
                                {recurringPaymentMethod.name}<br/>
                                Autopay will be processed on:<br/>
                                {insightUtils.formatDate(leaseResident.recurring_payment_next_payment_on || invoice.invoice_on)}
                            </>
                            :
                            <>
                                <strong>*Autopay - OFF</strong><br/>
                            </>
                        }
                    </div>
                </div>

                <table className="invoice-table">
                    <thead>
                    <tr>
                        <th>DATE</th>
                        <th>DESCRIPTION</th>
                        <th>CHARGE</th>
                        <th>PAYMENT</th>
                        <th>AMOUNT</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{insightUtils.formatDate(invoice.created_at)}</td>
                        <td>Balance Forward</td>
                        <td className="text-right">{invoice.initial_balance >= 0 && insightUtils.numberToCurrency(invoice.initial_balance, 2)}</td>
                        <td className="text-right">{invoice.initial_balance < 0 && insightUtils.numberToCurrency(invoice.initial_balance, 2)}</td>
                        <td className="text-right">{insightUtils.numberToCurrency(invoice.initial_balance, 2)}</td>
                    </tr>
                    {invoice.items.map((item, i) => {
                       return (
                           item.amount != 0 ?
                               <tr key={i}>
                                   <td>{insightUtils.formatDate(item.transaction_at)}</td>
                                   <td>{item.description}</td>
                                   <td className="text-right">{item.amount > 0 && insightUtils.numberToCurrency(item.amount, 2)}</td>
                                   <td className="text-right">{item.amount < 0 && insightUtils.numberToCurrency(item.amount, 2)}</td>
                                   <td className="text-right">{insightUtils.numberToCurrency(item.balance, 2)}</td>
                               </tr>
                               :
                               <></>
                       )
                    })}
                    </tbody>
                </table>

                <div className="invoice-gray-box">BALANCE {insightUtils.numberToCurrency(invoice.amount, 2)}</div>

                {leaseResident.recurring_payment_frequency && leaseResident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key ?
                    <></>
                    :
                    <>
                        <div className="invoice-section">
                            View & Pay Online: <a href="https://www.renterinsight.com">www.renterinsight.com</a><br/>
                            For Cash Pay, bring remittance slip to CheckFreePay Location<br/>
                            Locations: <a href="https://www.checkfreepay.com">www.checkfreepay.com</a>
                        </div>

                        {cashPaymentMethod &&
                            <div className="invoice-cash-pay">
                                <strong>CASH PAY</strong><br/><br/>
                                <div><strong>Agent Instructions:</strong> Use PayLease Community Payment Account
                                </div>

                                <div className="invoice-cash-pay-details">
                                    <div className="st-col-50 st-col-md-100">
                                        {cashPaymentBarCodeData &&
                                            <div className="invoice-bar-code-box"><img src={`data:image/png;base64,${cashPaymentBarCodeData}`} /></div>
                                        }
                                    </div>

                                    <div className="st-col-50 st-col-md-100">
                                        <div className="invoice-box">
                                            <div className="label">ACCOUNT #</div>
                                            <div>{cashPaymentMethod.external_id}</div>
                                        </div>
                                        <div className="invoice-box">
                                            <div className="label">RESIDENT NAME</div>
                                            <div>{leaseResident.resident.name}</div>
                                        </div>
                                        <div className="invoice-box">
                                            <div className="label">DUE DATE</div>
                                            <div>{insightUtils.formatDate(invoice.invoice_on)}</div>
                                        </div>
                                        <div className="invoice-box">
                                            <div className="label">BALANCE DUE</div>
                                            <div><strong>{insightUtils.numberToCurrency(invoice.amount, 2)}</strong></div>
                                        </div>
                                        <p>CashPay Convenience Fee $4</p>
                                    </div>
                                </div>
                            </div>
                        }
                    </>
                }
                <div className="st-col-100">
                    <a className="btn btn-small btn-red hidden-print" style={{margin: "0 auto", display: "block", width: "90px"}} onClick={() => window.print()}>&nbsp;Print <i className="fa fa-print"></i></a>
                </div>
            </>
            }
        </div>
    )
}

export default InvoiceShowPage;

