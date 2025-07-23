import React, {useEffect, useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import {Link, useSearchParams} from "react-router-dom";
import ReportDataTableRow from "./ReportDataTableRow";


const ReportDataTableGroupedSectionSubGroupRows = ({section, groupKey, group, level}) => {
    return (
        <>
            {!section.hide_group_header && groupKey && groupKey.length > 0 &&
            <tr className={section.group_css_classes && section.group_css_classes[groupKey] ? section.group_css_classes[groupKey] : "header-report-level-" + level}>
                <td colSpan={section.columns.filter((column) => (!column.hidden)).length}>{groupKey}</td>
            </tr>
            }

            {group.subgroups ?
                Object.keys(group.subgroups).map((subGroupKey, subGroupNumber) => {
                        return (
                            <ReportDataTableGroupedSectionSubGroupRows key={subGroupNumber} section={section} groupKey={subGroupKey} group={group.subgroups[subGroupKey]} level={level + 1} />
                        )
                    }
                )
                :
                group.raw_data.map((row, rowNumber) =>
                    (<ReportDataTableRow key={rowNumber} section={section} row={row} />)
                )
            }
            <ReportDataTableRow section={section} row={group.summary_data} className={section.group_css_classes && section.group_css_classes[groupKey] ? section.group_css_classes[groupKey] : "footer-report-level-" + level} firstColumnText={"Total " + groupKey} isTotal={true} />
        </>

    )}

export default ReportDataTableGroupedSectionSubGroupRows;

