import React, {useEffect, useState} from 'react';

import FinancialNav from "./FinancialNav";
import AmountBilledBlock from "./blocks/AmountBilledBlock";
import AmountReceivedBlock from "./blocks/AmountReceivedBlock";
import AmountDueBlock from "./blocks/AmountDueBlock";
import RecentActivityBlock from "./blocks/RecentActivityBlock";
import {getFinancialSummary} from "../../../slices/financialSlice";
import store from "../../../app/store";
import insightUtils from "../../../app/insightUtils";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import('react-date-range/dist/styles.css'); // main css file
import('react-date-range/dist/theme/default.css'); // theme css file
import { DateRangePicker } from 'react-date-range';

const FinancialSummaryPage = ({}) => {


    const [startDate, setStartDate] = useState(new Date())
    const [endDate, setEndDate] = useState(new Date())

    const [selectionStartDate, setSelectionStartDate] = useState(new Date())
    const [selectionEndDate, setSelectionEndDate] = useState(new Date())

    const [leaseSummaries, setLeaseSummaries] = useState([])
    const [recentTransactions, setRecentTransactions] = useState([])
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    const selectionRange = {
        startDate: selectionStartDate,
        endDate: selectionEndDate,
        key: 'selection',
        color: '#C44C3D'
    }

    useEffect(async()=> {
        try {
            const results = await store.dispatch(getFinancialSummary({})).unwrap()

            console.log(results)

            setLeaseSummaries(results.data.summaries)
            setRecentTransactions(results.data.transactions)
            setStartDate(insightUtils.parseDate(results.data.start_date))
            setEndDate(insightUtils.parseDate(results.data.end_date))
        }
        catch(err) {
            store.dispatch(displayAlertMessage({message: "Unable to load summary. Reload page to try again."}))
        }

    }, [])

    function handleDatePickerSelection(ranges){
        setSelectionStartDate(ranges.selection.startDate)
        setSelectionEndDate(ranges.selection.endDate)

        if (ranges.selection.startDate != ranges.selection.endDate) handleDateRangeChange(ranges.selection.startDate, ranges.selection.endDate)
    }

    async function handleDateRangeChange(startDate, endDate) {
        setDatePickerOpen(false)

        const results = await store.dispatch(getFinancialSummary({startDate: insightUtils.formatDate(startDate), endDate: insightUtils.formatDate(endDate)})).unwrap()

        console.log(results)

        setLeaseSummaries(results.data.summaries)
        setRecentTransactions(results.data.transactions)
        setStartDate(insightUtils.parseDate(results.data.start_date))
        setEndDate(insightUtils.parseDate(results.data.end_date))

    }

    return (
        <>

            <div className="section">

                <img className="section-img" src="/images/photo-accounting.jpg" />

                <div className="title-block">
                    <h1>Financial Summary</h1>
                </div>

                <FinancialNav />

                {startDate && endDate &&
                    <div className="text-right">
                        <div className="criteria-wrapper">
                            {datePickerOpen && <div className="criteria-pop-up">
                                <DateRangePicker ranges={[selectionRange]} inputRanges={[]} onChange={handleDatePickerSelection} />
                                <br/>
                                <a onClick={() => setDatePickerOpen(false)} className="date-picker-close">Close</a>
                            </div>}
                        </div>
                        <a onClick={() => setDatePickerOpen(true)}>{insightUtils.formatDate(startDate)} - {insightUtils.formatDate(endDate)}</a>
                    </div>
                }

                <div className="flex-grid flex-grid-gray flex-grid-three-col">
                    <AmountBilledBlock leaseSummaries={leaseSummaries} startDate={startDate} endDate={endDate} />
                    <AmountReceivedBlock leaseSummaries={leaseSummaries} startDate={startDate} endDate={endDate} />
                    <AmountDueBlock leaseSummaries={leaseSummaries} startDate={startDate} endDate={endDate} />
                </div>

                <div className="flex-grid flex-grid-gray">
                    <RecentActivityBlock recentTransactions={recentTransactions} />
                </div>

            </div>

        </>

    )}

export default FinancialSummaryPage;

