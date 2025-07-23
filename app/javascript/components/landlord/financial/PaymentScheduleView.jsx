import React, {useEffect, useState} from 'react';
import ListPage from "../../shared/ListPage";
import {useSelector} from "react-redux";

import store from "../../../app/store";
import insightUtils from "../../../app/insightUtils";
import {loadPaymentSchedule} from "../../../slices/paymentSlice";

const PaymentScheduleView = ({leaseResident, leaseResidentHashId, numberOfPayments, noDataMessage}) => {

    const { constants } = useSelector((state) => state.company)

    const [reloadSchedule, setReloadSchedule] = useState(false)

    useEffect(() => {
        setReloadSchedule(true)
    }, [leaseResident, leaseResident && leaseResident.recurring_payment_frequency, leaseResident && leaseResident.recurring_payment_day_of_week])

    async function runSearch(_text, _page) {

        let paymentDates=[]

        try {
            const results = await store.dispatch(loadPaymentSchedule({leaseResidentId: leaseResidentHashId, recurringPaymentDayOfWeek: leaseResident.recurring_payment_day_of_week, recurringPaymentFrequency: leaseResident.recurring_payment_frequency})).unwrap()
            console.log(results)
            paymentDates = results.data.payment_dates

            // Are we limiting the number we show?
            if (numberOfPayments) {
                paymentDates = paymentDates.slice(0, numberOfPayments)
            }
        }
        catch(e) {
            console.log('Not good')
            console.log(e)
        }

        setReloadSchedule(false)

        return {total: paymentDates.length, objects: paymentDates}
    }

    function generateTableRow(paymentDate, key) {
        return (<div key={key} className="st-row">
                    <div className="st-col-33">{paymentDate.amount_description}</div>
                    <div className="st-col-33">{paymentDate.day_description}</div>
                    <div className="st-col-33">{insightUtils.formatDate(paymentDate.date) }</div>
                </div>
        )
    }

    return (
        <>
                {leaseResident.recurring_payment_frequency && leaseResident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key &&
                    <ListPage
                        hideSearch={true}
                        titleImage={<></>}
                        runSearch={runSearch}
                        generateTableRow={generateTableRow}
                        reloadWhenChanges={reloadSchedule}
                        noDataMessage={noDataMessage}
                        columns={
                            [
                                {label: "Amount to Pay", class: "st-col-33"},
                                {label: "Day to Pay", class: "st-col-33"},
                                {label: "Scheduled Date", class: "st-col-33"}
                            ]
                        }
                    />
                }
        </>
    )}

export default PaymentScheduleView;

