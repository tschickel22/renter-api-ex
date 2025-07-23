import React, {useEffect, useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import {Link, useSearchParams} from "react-router-dom";
import ReportDataTableRow from "./ReportDataTableRow";
import ReportDataTableGroupedSectionSubGroupRows from "./ReportDataTableGroupedSectionSubGroupRows";


const ReportDataTableGroupedSectionView = ({section}) => {
    const [searchParams, setSearchParams] = useSearchParams()

    const [groupedData, setGroupedData] = useState([])
    const [sortBy, setSortBy] = useState(null)
    const [sortAsc, setSortAsc] = useState(true)

    useEffect(()=> {
        const newSortBy = searchParams.get(section.id + '_sort_by')
        const newSortAsc = searchParams.get(section.id + '_sort_dir') == 'asc'
        const column = section.columns.find((c) => c.id == newSortBy)

        if (column) {
            setSortBy(column)
            setSortAsc(newSortAsc)

            handleSortData(column, newSortAsc)
        }
        else {
            setGroupedData(section.data)
        }

    }, [section && section.data])

    function updateSort(column) {
        let newSortAsc = true

        if (sortBy == column) {
            newSortAsc = !sortAsc
        }
        else {
            setSortBy(column)
            newSortAsc = true
        }

        setSortAsc(newSortAsc)

        handleSortData(column, newSortAsc)
    }

    function updateURL(newSortBy, newSortAsc) {
        searchParams.set(section.id + '_sort_by', newSortBy.id)
        searchParams.set(section.id + '_sort_dir', (newSortAsc ? 'asc' : 'desc'))
        setSearchParams(searchParams)
    }

    function handleSortData(newSortBy, newSortAsc) {
        let newGroupedData = sortGroupedData(section.data, newSortBy, newSortAsc)

        updateURL(newSortBy, newSortAsc)
        setGroupedData(newGroupedData)
    }

    function sortGroupedData(oldGroupedData, newSortBy, newSortAsc) {
        let newGroupedData = {}

        // data -> Group Key -> summary_data / raw_data
        // data -> Group Key -> summary_data / subgroups -> Group Key -> summary_data / raw_data
        Object.keys(oldGroupedData).forEach((groupKey) => {
            if (oldGroupedData[groupKey].raw_data) {
                newGroupedData[groupKey] = sortRawData(oldGroupedData[groupKey], newSortBy, newSortAsc)
            }
            else {
                newGroupedData[groupKey] = {summary_data: oldGroupedData[groupKey].summary_data, subgroups: {}}

                // Are we at the bottom? If not, keep drilling
                const firstKey = Object.keys(oldGroupedData[groupKey].subgroups)[0]

                if (oldGroupedData[groupKey].subgroups[firstKey].raw_data === undefined) {
                    newGroupedData[groupKey].subgroups = sortGroupedData(oldGroupedData[groupKey].subgroups, newSortBy, newSortAsc)
                }
                else {
                    Object.keys(oldGroupedData[groupKey].subgroups).forEach((subgroupKey) => {
                        newGroupedData[groupKey].subgroups[subgroupKey] = sortRawData(oldGroupedData[groupKey].subgroups[subgroupKey], newSortBy, newSortAsc)
                    })
                }
            }
        })

        return newGroupedData
    }

    function sortRawData(group, newSortBy, newSortAsc) {
        let sortedData = {}

        let sortTarget = Array.from(group.raw_data)
        let sortByField = newSortBy.id

        const newSortedData = sortTarget.sort((a, b) =>
            {
                let valA = a[sortByField]
                let valB = b[sortByField]

                if (newSortBy.data_type == "currency") {
                    valA = parseFloat(valA || 0)
                    valB = parseFloat(valB || 0)
                }
                else if (newSortBy.data_type == "integer") {
                    valA = parseInt(valA || 0)
                    valB = parseInt(valB || 0)
                }
                else if (newSortBy.data_type == "integer_or_string") {
                    // For Unit Numbers... so that 10 appears after 9 and not after 1
                    valA = valA.padStart(100, '0')
                    valB = valB.padStart(100, '0')
                }
                else if (newSortBy.data_type == "date") {
                    valA = insightUtils.parseDate(valA)
                    valB = insightUtils.parseDate(valB)
                }
                else if (newSortBy.data_type == "lookup") {
                    valA = newSortBy.replacements[valA] || valA
                    valB = newSortBy.replacements[valB] || valB
                }

                return (valA > valB ? 1 : -1) * (newSortAsc ? 1 : -1)
            }
        )
        sortedData = {"summary_data": group.summary_data}
        sortedData.raw_data = newSortedData

        return sortedData
    }

    return (
        <>
            <h2>{section.heading}</h2>

            <table className="reporting">
                <thead>
                    <tr>
                        {section.columns.filter((column) => (!column.hidden)).map((column) =>
                            {
                                return (
                                    <React.Fragment key={column.id}>
                                        <th className={"data-type-" + column.data_type} onClick={() => updateSort(column)}>
                                            {column.label}
                                            {sortBy == column && sortAsc && <i className="fa fa-caret-up"></i>}
                                            {sortBy == column && !sortAsc && <i className="fa fa-caret-down"></i>}
                                        </th>
                                    </React.Fragment>
                                )
                            }
                        )}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(groupedData).map((groupKey, groupNumber) => {
                        return (
                            <ReportDataTableGroupedSectionSubGroupRows key={groupNumber} section={section} groupKey={groupKey} group={groupedData[groupKey]} level={0} />
                        )
                    })}
                </tbody>
            </table>
        </>

    )}

export default ReportDataTableGroupedSectionView;

