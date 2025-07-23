import React, {useEffect, useState} from 'react';
import {Form, Formik} from "formik";
import {DateRangePicker} from "react-date-range";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import {setDates} from "../../../slices/userSlice";
import moment from "moment";
import store from "../../../app/store";


const BankTransactionDateRangeFilter = ({localStartDate, setLocalStartDate, localEndDate, setLocalEndDate, reloadTable, setReloadTable}) => {

    const { startDate, endDate } = useSelector((state) => state.user)

    const [selectionStartDate, setSelectionStartDate] = useState(new Date())
    const [selectionEndDate, setSelectionEndDate] = useState(new Date())
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    const selectionRange = {
        startDate: selectionStartDate,
        endDate: selectionEndDate,
        key: 'selection',
        color: '#C44C3D'
    }

    useEffect(() => {
        if (setLocalStartDate) {
            setSelectionStartDate(moment(localStartDate).toDate())
        }
        else {
            setSelectionStartDate(moment(startDate).toDate())
        }

    }, [startDate, localStartDate])

    useEffect(() => {
        if (setLocalEndDate) {
            setSelectionEndDate(moment(localEndDate).toDate())
        }
        else {
            setSelectionEndDate(moment(endDate).toDate())
        }

    }, [endDate, localEndDate])

    function handleDatePickerSelection(ranges){
        setSelectionStartDate(ranges.selection.startDate)
        setSelectionEndDate(ranges.selection.endDate)

        if (ranges.selection.startDate != ranges.selection.endDate) handleDateRangeChange(ranges.selection.startDate, ranges.selection.endDate)
    }

    async function handleDateRangeChange(startDate, endDate) {
        setReloadTable(reloadTable + 1)
        setDatePickerOpen(false)

        if (setLocalStartDate) {
            setLocalStartDate(moment(startDate).format("YYYY-MM-DD"))
            setLocalEndDate(moment(endDate).format("YYYY-MM-DD"))
        }
        else {
            store.dispatch(setDates({startDate: moment(startDate).format("YYYY-MM-DD"), endDate: moment(endDate).format("YYYY-MM-DD")}))
        }

    }


    return (
        <Formik initialValues={{}}>
            {( ) => (
                <Form>
                    <div className="st-nav">
                        <div className="form-item flex-col flex-nowrap">
                            <label>Date Range</label>
                            <div>
                                <div className="criteria-wrapper">
                                    {datePickerOpen && <div className="criteria-pop-up">
                                        <DateRangePicker ranges={[selectionRange]} inputRanges={[]} onChange={handleDatePickerSelection}/>
                                        <br/>
                                        <a onClick={() => setDatePickerOpen(false)} className="date-picker-close">Close</a>
                                    </div>}
                                </div>
                                <a onClick={() => setDatePickerOpen(true)}>{insightUtils.formatDate(localStartDate || startDate)} - {insightUtils.formatDate(localEndDate || endDate)}</a>
                            </div>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>

    )
}


export default BankTransactionDateRangeFilter;

