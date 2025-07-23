import React, {useEffect, useRef, useState} from 'react';
import {DateRangePicker, defaultStaticRanges} from "react-date-range"
import moment from 'moment'

import insightUtils from "../../../app/insightUtils";
import {useSearchParams} from "react-router-dom";

const CriteriaDatePicker = ({report, handleRerunReport}) => {
    const closeable = useRef()
    const [searchParams] = useSearchParams()

    const [endDate, setEndDate] = useState(searchParams.get("end_date") ? insightUtils.parseDate(searchParams.get("end_date")) : insightUtils.parseDate(report.params.end_date))

    const [selectionEndDate, setSelectionEndDate] = useState(searchParams.get("end_date") ? insightUtils.parseDate(searchParams.get("end_date")) : insightUtils.parseDate(report.params.end_date))

    const [criteriaOpen, setCriteriaOpen] = useState(false)

    useEffect(() => {
        if (criteriaOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setCriteriaOpen(false))
        }
    }, [criteriaOpen])

    const selectionRange = {
        startDate: selectionEndDate,
        endDate: selectionEndDate,
        key: 'selection',
        color: '#C44C3D'
    }

    function handleDatePickerSelection(ranges){
        console.log(ranges)
        setSelectionEndDate(ranges.selection.endDate)

        handleDateRangeChange(ranges.selection.endDate, ranges.selection.endDate)
    }

    async function handleDateRangeChange(startDate, endDate) {
        setCriteriaOpen(false)

        setEndDate(endDate)

        handleRerunReport({end_date: insightUtils.formatDate(endDate)})

    }

    return (
        <>
            {endDate &&
            <>
                <div className="criteria-wrapper">
                    <a className="current-value" onClick={() => setCriteriaOpen(true)}>
                        <>{insightUtils.formatDate(endDate)}</>
                    </a>

                    {criteriaOpen && <div className="criteria-pop-up" ref={closeable}>
                        <DateRangePicker
                            ranges={[selectionRange]}
                            staticRanges={[
                                ...defaultStaticRanges,
                                {
                                    label: "Last Year",
                                    range: () => ({startDate: moment().startOf('year').add(-1,'days').toDate(), endDate: moment().startOf('year').add(-1,'days').toDate()}),
                                    isSelected(range) {
                                        const definedRange = this.range();
                                        return (
                                            insightUtils.isSameDay(range.startDate, definedRange.startDate) &&
                                            insightUtils.isSameDay(range.endDate, definedRange.endDate)
                                        );
                                    }
                                }
                            ]}
                            inputRanges={[]}
                            months={1}
                            direction="horizontal"
                            onChange={handleDatePickerSelection} />
                    </div>}
                </div>
            </>
            }

        </>

    )}

export default CriteriaDatePicker;

