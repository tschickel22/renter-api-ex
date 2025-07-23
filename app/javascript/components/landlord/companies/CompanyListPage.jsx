import React, {useState} from 'react';
import {activateCompanyForPayments, searchForCompanies} from "../../../slices/companySlice";

import store from "../../../app/store";
import ListPage from "../../shared/ListPage";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import CompanyListRow from "./CompanyListRow";


const CompanyListPage = ({}) => {

    const [companiesActivated, setCompaniesActivated] = useState([])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForCompanies({searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.companies}
    }

    function generateTableRow(company, key) {
        return (<CompanyListRow key={key} company={company} handlePaymentsActivation={handlePaymentsActivation} />)
    }

    async function handlePaymentsActivation(company) {
        let newCompaniesActivated = Array.from(companiesActivated)
        newCompaniesActivated.push(company)
        setCompaniesActivated(newCompaniesActivated)

        store.dispatch(displayAlertMessage({message: company.name + " activated for billing"}))
    }

    return (
        <ListPage
            title="Companies"
            runSearch={runSearch}
            titleImage={<React.Fragment />}
            reloadWhenChanges={companiesActivated}
            columns={[
                    {label: "Company", class: "st-col-30", sort_by: "name"},
                    {label: "Screening Status", class: "st-col-25", sort_by: "external_screening_id"},
                    {label: "Payments Status", class: "st-col-25", sort_by: "payments_onboard_status"},
            ]}
            generateTableRow={generateTableRow}
        />
    )}

export default CompanyListPage;

