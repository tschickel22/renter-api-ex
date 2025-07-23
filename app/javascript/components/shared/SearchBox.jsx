import React from 'react';
import store from "../../app/store";
import {searchForLeases} from "../../slices/leaseSlice";

const SearchBox = ({searchText, setSearchText, searchedText, setSearchedText, handleSearch, handleClear, hideIcon}) => {

    function handleSearchKeyDown(e) {
        if (e.keyCode == 13) {
            e.preventDefault()
            internalHandleSearch(e)
        }
    }

    async function internalHandleSearch(e) {
        e.stopPropagation()
        setSearchedText(searchText)
        handleSearch()
    }

    function internalHandleClear(e) {
        e.stopPropagation()
        setSearchText("")
        setSearchedText("")
        handleClear()
    }

    return (
        <>
            <div className="input"><input onChange={(e) =>setSearchText(e.target.value)} onKeyDown={(e) => handleSearchKeyDown(e)} className="form-input" type="text" value={searchText} /></div>
            <div onClick={(e) => internalHandleSearch(e)} className="btn btn-red"><span>Search {!hideIcon && <i className="fas fa-search"></i>}</span></div>
            {searchedText && <div onClick={(e) => internalHandleClear(e)} className="btn"><span>Clear {!hideIcon && <i className="fas fa-times"></i>}</span></div>}
        </>
    )}

export default SearchBox;

