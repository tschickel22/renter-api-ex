import React from 'react';
import {searchForJournalEntries} from "../../../slices/journalEntrySlice";
import store from "../../../app/store";

import {Link} from "react-router-dom";
import JournalEntryListRow from "./JournalEntryListRow";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import FinancialNav from "../financial/FinancialNav";
import {useSelector} from "react-redux";

const JournalEntryListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForJournalEntries({searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.journal_entries}
    }

    function generateTableRow(journalEntry, key) {
        return (<JournalEntryListRow key={key} journalEntry={journalEntry} />)
    }

    return (
        <>
            {currentUser.accounting_view && <ListPage
                title="Journal Entries"
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                nav={<FinancialNav />}
                runSearch={runSearch}
                addButton={currentUser.accounting_edit ? <Link to={insightRoutes.journalEntryNew()} className="btn btn-red"><span>Add Journal Entry <i className="fas fa-plus"></i></span></Link> : null}
                columns={[
                    {label: "Property", class: "st-col-15 st-col-md-25", sort_by: "property_name"},
                    {label: "Memo", class: "st-col-15 st-col-md-25", sort_by: "memo"},
                    {label: "Accounts", class: "st-col-15 hidden-md", sort_by: "account_name"},
                    {label: "Amount", class: "st-col-15 st-col-md-25", sort_by: "amount", data_type: "float"},
                    {label: "Date", class: "st-col-10 st-col-md-25", sort_by: "entry_on"}
                ]}
                defaultSortBy="entry_on"
                defaultSortDir="desc"
                noDataMessage="No journal entries have been entered"
                generateTableRow={generateTableRow}
            />}
        </>

    )}

export default JournalEntryListPage;

