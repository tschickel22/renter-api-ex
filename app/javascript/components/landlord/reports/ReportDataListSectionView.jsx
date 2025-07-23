import React, {useEffect, useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import {Link, useSearchParams} from "react-router-dom";
import ReportDataTableRow from "./ReportDataTableRow";


const ReportDataListSectionView = ({section}) => {
    const [searchParams, setSearchParams] = useSearchParams()

    const [sortedData, setSortedData] = useState([])
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
            setSortedData(section.data)
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
        let sortTarget = Array.from(section.data)
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
        updateURL(newSortBy, newSortAsc)
        setSortedData(newSortedData)
    }

    return (
        <>
            <h2>{section.heading}</h2>

            <table className={"reporting data-list " + section.id}>
                <tbody>
                    {sortedData.map((row, _rowNumber) =>
                        {return section.columns.filter((column) => (!column.hidden)).map((column) =>
                            {
                                let value = row[column.id]
                                let label = String(column.label)

                                if (column.data_type == "currency") value = insightUtils.numberToCurrency(value, column.precision || 2)
                                if (column.data_type == "date") value = insightUtils.formatDate(value)
                                if (column.data_type == "lookup") value = column.replacements[value] || value

                                // Do we have replacements on the label?
                                if (label && label.indexOf('{') >= 0) {

                                    section.columns.forEach((c) => {
                                        let replacement = row[c.id]
                                        if (c.data_type == "date") replacement = insightUtils.formatDate(replacement)
                                        else replacement = replacement || 0

                                        label = label.replace("{" + c.id + "}", replacement)
                                    })
                                }

                                return (

                                        <tr key={column.id}>
                                            <th className={"data-type-" + column.data_type}>
                                                {label}
                                            </th>

                                            <td className={"data-type-" + column.data_type + " " + (column.data_cell_class ? row[column.data_cell_class] : "")}>
                                                {column.drill_down && row[column.drill_down] ?
                                                    <Link to={row[column.drill_down]} state={{return_url: location.pathname + (window.location.search || '')}}>{value}</Link>
                                                    :
                                                    <>{value}</>
                                                }
                                            </td>
                                        </tr>

                                )
                            }
                        )}
                    )}
                </tbody>
            </table>

            {section.footer && <div className="report-footer">{section.footer}</div> }
        </>

    )}

export default ReportDataListSectionView;

