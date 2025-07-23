import React, {useState, useEffect} from 'react';

import {useLocation, useNavigate, useParams} from "react-router-dom";
import SearchBox from "./SearchBox";
import PaginationControls from "./PaginationControls";
import insightUtils from "../../app/insightUtils";


const ListPage = ({nav, secondaryNav, addButton, title, subTitle, titleImage, runSearch, hideSearch, initialSearchText, generateTableRow, tableHeaderClass, columns, noDataMessage, reloadWhenChanges, footerRow, disableSort, defaultSortBy, defaultSortDir, hideNavCol, numberPerPage, allSelected, moveSecondaryNavAsNeeded, paramPrefix, afterTableContent, hideImage=false}) => {

    let navigate = useNavigate()
    const location = useLocation()
    let query = insightUtils.useQuery()

    const [page, setPage] = useState(null)
    const [total, setTotal] = useState(0)
    const [sortByColumn, setSortByColumn] = useState("")
    const [sortDir, setSortDir] = useState("")
    const [searchText, setSearchText] = useState(initialSearchText || "")
    const [searchedText, setSearchedText] = useState(initialSearchText || "")
    const [objects, setObjects] = useState(null)
    const [sortedObjects, setSortedObjects] = useState(null)

    useEffect( () => {
        // If Page hasn't been set yet, read it off of the URL
        if (!page) {
            const newPage = parseInt(query.get((paramPrefix || '') + 'page'))
            if (query.get((paramPrefix || '') + 'page')) setPage(newPage)
            else setPage(1)
        }
        else if (page == 1) {
            handleRunSearch(searchText, page)
        }
        else {
            setPage(1)
        }

        // If there's an updated_at column, we should sort by that
        if (!defaultSortBy && columns && columns.find((column) => column.sort_by == "updated_at")) {
            defaultSortBy = "updated_at"

            if (!defaultSortDir) defaultSortDir = "desc"
        }

        if (query.get((paramPrefix || '') + 'sort_by')) {
            const newSortByColumn = columns.find((column) => column.sort_by == query.get('sort_by'))
            setSortByColumn(newSortByColumn)
        }
        else if (defaultSortBy) {
            const newSortByColumn = columns.find((column) => column.sort_by == defaultSortBy)
            setSortByColumn(newSortByColumn)
        }

        if (query.get((paramPrefix || '') +'sort_dir')) setSortDir(query.get((paramPrefix || '') +'sort_dir'))
        else if (defaultSortDir) setSortDir(defaultSortDir)

    }, [reloadWhenChanges])

    useEffect(() => {
        if (page) {
            handleRunSearch(searchText, page)
        }
    }, [page])

    useEffect( () => {
        if (objects) {
            let sortTarget = Array.from(objects)

            if (sortByColumn && sortByColumn.sort_by) {
                const newSortedObjects = sortTarget.sort((a, b) =>
                    {
                        let valA = insightUtils.resolvePath(a, sortByColumn.sort_by)
                        let valB = insightUtils.resolvePath(b, sortByColumn.sort_by)

                        if (sortByColumn.data_type == "integer") {
                            valA = parseInt(valA || "0")
                            valB = parseInt(valB || "0")
                        }
                        else if (sortByColumn.data_type == "integer_or_string") {
                            // For Unit Numbers... so that 10 appears after 9 and not after 1
                            valA = valA.padStart(100, '0')
                            valB = valB.padStart(100, '0')
                        }
                        else if (sortByColumn.data_type == "float") {
                            valA = parseFloat(valA || "0")
                            valB = parseFloat(valB || "0")
                        }
                        else if (sortByColumn.data_type == "function") {
                            valA = sortByColumn.sort_by_function(a)
                            valB = sortByColumn.sort_by_function(b)
                        }
                        else {
                            valA = (valA || "").toString().toLowerCase()
                            valB = (valB || "").toString().toLowerCase()
                        }

                        return (valA > valB ? 1 : -1) * (sortDir == "asc" ? 1 : -1)
                    }
                );

                setSortedObjects(newSortedObjects)
            }
            else {
                setSortedObjects(objects)
            }

        }
    }, [sortByColumn, sortDir, objects])

    async function handleSearch() {
        setPage(1)
        await handleRunSearch(searchText, page)
    }
    async function handleClear() {
        setPage(1)
        await handleRunSearch("", page)
    }
    async function handleRunSearch(text) {
        const {objects, total} = await runSearch(text, page)

        setObjects(objects || [])
        setTotal(total || 0)
    }

    function updateURL(newPage, newSort, newSortDir) {
        navigate(location.pathname + '?'+ (paramPrefix || '') +'page='+newPage+"&"+ (paramPrefix || '') +"sort_by="+newSort+"&"+ (paramPrefix || '') +"sort_dir="+newSortDir, {state: location.state})
    }

    function handleSetPage(newPage) {
        updateURL(newPage, sortByColumn ? sortByColumn.sort_by : "", sortDir)
        setPage(newPage)
    }

    function updateSort(newSortByColumn) {
        if (!newSortByColumn.sort_by) return

        let newSortDir = sortDir
        let newPage = page
        if (sortByColumn && newSortByColumn.sort_by == sortByColumn.sort_by) {
            newSortDir = sortDir == "asc" ? "desc" : "asc"
            setSortDir(newSortDir)
        }
        else {
            setSortByColumn(newSortByColumn)
            newSortDir = "asc"
            setSortDir(newSortDir)
            newPage = 1
            setPage(1)
        }

        updateURL(newPage, newSortByColumn.sort_by, newSortDir)
    }

    function sortableColumnHeader(column, key) {
        return (<span onClick={() => {!disableSort && updateSort(column)}} key={key} className={"st-title st-sortable " + (key > 0 ? column.class : '')} dangerouslySetInnerHTML={{__html:column.label + (sortByColumn && column.sort_by && sortByColumn.sort_by == column.sort_by ? (sortDir == "asc" ? ' <i class="fa fa-caret-up" />' : ' <i class="fa fa-caret-down" />') : '')}} />)
    }

    function unsortableColumnHeader(column, key) {
        return (<span key={key} className={"st-title " + (key > 0 ? column.class : '')} >{column.label}</span>)
    }

    return (
        <>
            <div className="section">

                {hideImage ? null : (titleImage || <img className="section-img" src="/images/photo-properties.jpg" />)}

                {(title || subTitle) && <div className="title-block">
                    <h1>{title}</h1>
                    {subTitle && <div className="subtitle">{subTitle}</div>}
                </div>}

                <div className="section-table-wrap">
                    {nav}

                    {(addButton || !hideSearch) && <div className="st-nav">
                        {addButton ? addButton : (moveSecondaryNavAsNeeded ? secondaryNav : null)}
                        <div></div>
                        <div className="st-search hidden-print">
                            {!hideSearch && <SearchBox searchText={searchText} setSearchText={setSearchText} searchedText={searchedText} setSearchedText={setSearchedText} handleSearch={handleSearch} handleClear={handleClear} />}
                        </div>
                    </div>}

                    {(addButton || !moveSecondaryNavAsNeeded) && secondaryNav}

                    <div className={"section-table" + (!title && !nav && !secondaryNav ? " section-table-no-title" : "")}>
                        {columns && <>
                            <div className={tableHeaderClass || (nav ? "st-row st-header st-header-secondary" : "st-row st-header")}>
                                {columns.filter((column) => !column.hidden).map((column, i) => {
                                        if (i == 0) {
                                            return (<div key={i} className={"st-first-col " + column.class}>
                                                {column.selectAll &&
                                                    <i className={"fa-square btn-checkbox " + (allSelected ? "fas active": "fal")} onClick={column.selectAll}></i>
                                                }
                                                {sortableColumnHeader(column, i)}
                                            </div>)
                                        }
                                        else if(column.hideSort) {
                                            return unsortableColumnHeader(column, i)
                                        }
                                        else {
                                            return sortableColumnHeader(column, i)
                                        }
                                    })
                                }
                                {!hideNavCol && <span className="st-nav-col"></span>}
                            </div>
                        </>}

                        <div className="st-table-scroll">
                            {sortedObjects && <>
                                {sortedObjects.slice((page - 1) * (numberPerPage || insightUtils.numberPerPage()), page * (numberPerPage || insightUtils.numberPerPage())).map((object, i) => {
                                    return generateTableRow(object, i + (page - 1) * (numberPerPage || insightUtils.numberPerPage()))
                                })}
                            </>}
                            {footerRow}
                            {(!sortedObjects || sortedObjects.length == 0) &&
                                <>
                                    {(searchedText || (noDataMessage && sortedObjects && sortedObjects.length == 0)) && <div style={{padding: "50px 0", textAlign: "center"}}>{noDataMessage || "No records found."}</div>}
                                    {!sortedObjects && <div className="loading">Loading...</div>}
                                </>
                            }
                        </div>

                        <PaginationControls page={page} setPage={handleSetPage} total={total} numberPerPage={numberPerPage || insightUtils.numberPerPage()} />

                    </div>

                </div>

                {afterTableContent}
            </div>
        </>

    )}

export default ListPage;

