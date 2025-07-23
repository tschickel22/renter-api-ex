import React from 'react';
import insightUtils from "../../../app/insightUtils";
import {Link} from "react-router-dom";

const ReportDataTableRow = ({section, row, className, firstColumnText, isTotal}) => {

    return (
        <tr className={className}>
            {section.columns.filter((column) => (!column.hidden)).map((column, index) =>
                {
                    let value = row[column.id]

                    if (column.data_type == "currency") value = insightUtils.numberToCurrency(value, column.precision || 2)
                    if (column.data_type == "percent") value = insightUtils.numberWithCommas(value, column.precision || 2) + "%"
                    if (column.data_type == "date") value = insightUtils.formatDate(value)
                    if (column.data_type == "lookup") value = column.replacements[value] || value

                    if (isTotal && column.skip_total) value = ""

                    return (
                        <React.Fragment key={column.id}>
                            <td className={"data-type-" + column.data_type + " " + (column.data_cell_class ? row[column.data_cell_class] : "")}>
                                {column.drill_down && row[column.drill_down] ?
                                    <Link to={row[column.drill_down]} state={{return_url: location.pathname + (window.location.search || '')}}>{value}</Link>
                                    :
                                    <>{value}</>
                                }
                                {index == 0 && firstColumnText}
                            </td>
                        </React.Fragment>
                    )
                }
            )}
        </tr>

    )}

export default ReportDataTableRow;

