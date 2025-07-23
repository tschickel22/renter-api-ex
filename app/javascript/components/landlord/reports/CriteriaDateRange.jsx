import React, {useEffect, useRef, useState} from 'react';
import {DateRangePicker, defaultStaticRanges} from "react-date-range"

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";

const CriteriaDateRange = ({report, handleRerunReport, labelPrefix}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [startDate, setStartDate] = useState(searchParams.get("start_date") ? insightUtils.parseDate(searchParams.get("start_date")) : insightUtils.parseDate(report.params.start_date))
    const [endDate, setEndDate] = useState(searchParams.get("end_date") ? insightUtils.parseDate(searchParams.get("end_date")) : insightUtils.parseDate(report.params.end_date))

    const [selectionStartDate, setSelectionStartDate] = useState(searchParams.get("start_date") ? insightUtils.parseDate(searchParams.get("start_date")) : insightUtils.parseDate(report.params.start_date))
    const [selectionEndDate, setSelectionEndDate] = useState(searchParams.get("end_date") ? insightUtils.parseDate(searchParams.get("end_date")) : insightUtils.parseDate(report.params.end_date))

    const [criteriaOpen, setCriteriaOpen] = useState(false)

    useEffect(() => {
        if (criteriaOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setCriteriaOpen(false))
        }
    }, [criteriaOpen])


    const staticRanges = [
        ...defaultStaticRanges,
        {
            label: "Last 30 Days",
            range: () => (insightUtils.last30DaysRange),
            isSelected(range) {
                const definedRange = this.range();
                return (
                    insightUtils.isSameDay(range.startDate, definedRange.startDate) &&
                    insightUtils.isSameDay(range.endDate, definedRange.endDate)
                );
            }
        },
        {
            label: "Last Year",
            range: () => (insightUtils.lastYearDateRange),
            isSelected(range) {
                const definedRange = this.range();
                return (
                    insightUtils.isSameDay(range.startDate, definedRange.startDate) &&
                    insightUtils.isSameDay(range.endDate, definedRange.endDate)
                );
            }
        },
        {
            label: "Year-to-Date",
            range: () => (insightUtils.yearToDateRange),
            isSelected(range) {
                const definedRange = this.range();
                return (
                    insightUtils.isSameDay(range.startDate, definedRange.startDate) &&
                    insightUtils.isSameDay(range.endDate, definedRange.endDate)
                );
            }
        },
        {
            label: "All-time",
            range: () => (insightUtils.allTimeRange),
            isSelected(range) {
                const definedRange = this.range();
                return (
                    insightUtils.isSameDay(range.startDate, definedRange.startDate) &&
                    insightUtils.isSameDay(range.endDate, definedRange.endDate)
                );
            }
        }
    ]

    const selectionRange = {
        startDate: selectionStartDate,
        endDate: selectionEndDate,
        key: 'selection',
        color: '#C44C3D'
    }

    function handleDatePickerSelection(ranges){
        setSelectionStartDate(ranges.selection.startDate)
        setSelectionEndDate(ranges.selection.endDate)

        if (ranges.selection.startDate != ranges.selection.endDate) handleDateRangeChange(ranges.selection.startDate, ranges.selection.endDate)
    }

    async function handleDateRangeChange(startDate, endDate) {
        setCriteriaOpen(false)

        setStartDate(startDate)
        setEndDate(endDate)

        handleRerunReport({start_date: insightUtils.formatDate(startDate), end_date: insightUtils.formatDate(endDate)})

    }

    function formatDateRange(ranges, startDate, endDate) {
        let selectedRangeLabel = null
        ranges.forEach((range) => {
            if (insightUtils.isSameDay(range.range().startDate, startDate) && insightUtils.isSameDay(range.range().endDate, endDate)) {
                selectedRangeLabel = range.label
            }
        })

        if (selectedRangeLabel) {
            return `${labelPrefix || ''}${selectedRangeLabel}`
        }
        else {
            return `${labelPrefix || ''}${insightUtils.formatDate(startDate)} - ${insightUtils.formatDate(endDate)}`;
        }
    }

    return (
        <>
            {startDate && endDate &&
            <>
                <div className="criteria-wrapper criteria-date-range">
                    <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                        {formatDateRange(staticRanges, startDate, endDate)}
                    </a>

                    {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                        <DateRangePicker
                            ranges={[selectionRange]}
                            staticRanges={staticRanges}
                            inputRanges={[]}
                            months={2}
                            direction="horizontal"
                            onChange={handleDatePickerSelection} />
                    </div>}
                </div>
            </>
            }

        </>

    )}

export default CriteriaDateRange;

