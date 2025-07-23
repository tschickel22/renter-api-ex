import React from 'react';
import store from "../../../app/store";

import {Link} from "react-router-dom";
import {searchForAccounts} from "../../../slices/accountSlice";
import ListPage from "../../shared/ListPage";
import AccountListRow from "./AccountListRow";
import insightRoutes from "../../../app/insightRoutes";
import FinancialNav from "./FinancialNav";
import {useSelector} from "react-redux";

const AccountListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForAccounts({searchText: text, includeBalances: true})).unwrap()
        return {total: results.data.total, objects: results.data.accounts}
    }

    function generateTableRow(account, key) {
        return (<AccountListRow key={key} account={account} />)
    }

    return (
        <>
        {currentUser.accounting_view &&
            <ListPage
                nav={<FinancialNav />}
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                title="Accounts"
                runSearch={runSearch}
                defaultSortBy="code"
                defaultSortDir="desc"
                addButton={currentUser.accounting_edit ? <Link to={insightRoutes.accountNew()} state={{from: 'accounts'}} className="btn btn-red"><span>Add Account <i className="fas fa-plus"></i></span></Link> : null}
                columns={[
                    {label: "Name", class: "st-col-30", sort_by: "name"},
                    {label: "Category", class: "st-col-15", sort_by: "category_name"},
                    {label: "Detail Type", class: "st-col-15", sort_by: "sub_category_name"},
                    {label: "Balance", class: "st-col-15 text-right", sort_by: "balance"}
                ]}
                generateTableRow={generateTableRow}
            />}
        </>
    )}

export default AccountListPage;
