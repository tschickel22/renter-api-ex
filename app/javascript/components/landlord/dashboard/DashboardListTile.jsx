import React, {useEffect, useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import {Link, useNavigate} from "react-router-dom";

const DashboardListTile = ({icon, title, totalOverride, columns, nav, runSearch, generateTableRow, reloadWhenChanges, viewAllPath, noDataMessage, numberPerPage}) => {
    let query = insightUtils.useQuery()
    let navigate = useNavigate()

    const objectsPerPage = numberPerPage || 4
    const [page, setPage] = useState(null)
    const [total, setTotal] = useState(0)
    const [objects, setObjects] = useState(null)

    useEffect( () => {
        const newPage = parseInt(query.get('page'))
        if (query.get('page')) setPage(newPage)
        else setPage(1)

    }, [reloadWhenChanges])

    useEffect(() => {
        if (page) handleRunSearch("", page)
    }, [reloadWhenChanges, page])

    async function handleRunSearch(text) {
        const {objects, total} = await runSearch(text, page)

        setObjects(objects || [])
        setTotal(total || 0)
    }

    function sortableColumnHeader(column, key) {
        return (<span key={key} className={"st-title " + (key > 0 ? column.class : '')} dangerouslySetInnerHTML={{__html:column.label}} />)
    }

    return (
        <>
            <div className="tile tile-list">
                {total === undefined ?
                    <div className="tile-title-bar">
                        <div className="tile-icon">{icon}</div>
                        <div className="tile-title cursor-pointer" onClick={() => navigate(viewAllPath)}>{title}</div>
                    </div>
                    :
                    <div className="tile-title-bar with-total">
                        <div className="tile-icon">{icon}</div>
                        <div className="tile-title">{title}</div>
                        <div className="tile-total cursor-pointer" onClick={() => navigate(viewAllPath)}>{!(totalOverride === undefined) ? totalOverride : total}</div>
                    </div>
                }
                {nav}
                <div className="section-table-wrap">
                    <div className="section-table" style={nav ? {marginTop: "5px"} : {}}>
                        {columns && <>
                            <div className="st-row st-header">
                                {columns.filter((column) => !column.hidden).map((column, i) => {
                                    if (i == 0) {
                                        return (<div key={i} className={"st-first-col " + column.class}>
                                            {sortableColumnHeader(column, i)}
                                        </div>)
                                    }
                                    else {
                                        return sortableColumnHeader(column, i)
                                    }
                                })
                                }
                            </div>
                        </>}

                        <div className="st-table-scroll">
                            {objects && <>
                                {objects.slice((page - 1) * (objectsPerPage || insightUtils.objectsPerPage()), page * (objectsPerPage || insightUtils.objectsPerPage())).map((object, i) => {
                                    return generateTableRow(object, i + (page - 1) * (objectsPerPage || insightUtils.objectsPerPage()))
                                })}
                            </>}

                            {(!objects || objects.length == 0) &&
                            <>
                                {(noDataMessage && objects && objects.length == 0) && <div style={{padding: "50px 0", textAlign: "center"}}>{noDataMessage || "No records found."}</div>}
                                {!objects && <div className="loading">Loading...</div>}
                            </>
                            }
                        </div>
                    </div>
                </div>
                <div className="tile-spacer" />
                <Link to={viewAllPath} className="tile-pagination">Showing {total < objectsPerPage ? total : objectsPerPage}/{total} | View All</Link>

            </div>
        </>

    )}

export default DashboardListTile;

