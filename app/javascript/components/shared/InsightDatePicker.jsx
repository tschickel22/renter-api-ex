import React from "react";
import DatePicker from "react-datepicker";

const InsightDatePicker = ({name, selected, onChange}) => {

    const InputWithCalendarIcon = React.forwardRef((props, ref) => {
        return (
            <div className="form-item-date">
                <input onClick={props.onClick} className="form-input form-input-white react-datepicker-ignore-onclickoutside" value={props.value} onChange={props.onChange} type="text" />
                <i className="fal fa-calendar-alt"></i>
            </div>
        );
    });

    return (
        <DatePicker name={name} selected={selected} onChange={onChange} customInput={<InputWithCalendarIcon />} />
    )
}

export default InsightDatePicker;