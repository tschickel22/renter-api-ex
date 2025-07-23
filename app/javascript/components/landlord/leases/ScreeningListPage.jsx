import React from 'react';

import {useSelector} from "react-redux";
import store from "../../../app/store";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";
import ScreeningListRow from "./ScreeningListRow";
import ListPage from "../../shared/ListPage";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import ScreeningNav from "../companies/ScreeningNav";


const ScreeningListPage = ({}) => {

    const { currentCompany } = useSelector((state) => state.company)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForLeaseResidents({mode: "screenings", searchText: text})).unwrap()
        console.log(results.data)
        return {total: results.data.total, objects: results.data.lease_residents}
    }

    function generateTableRow(lease_resident, key) {
        if (lease_resident.resident) {
            return (<ScreeningListRow key={key} lease_resident={lease_resident} />)
        }
        else {
            return null
        }
    }

    return (
        <>
            {currentCompany &&
            <ListPage
                title="Resident Screening"
                titleImage={<img className="section-img" src="/images/photo-resident-screening.jpg" />}
                nav={<ScreeningNav />}
                addButton={currentCompany.external_screening_id && <Link to={insightRoutes.screeningNew()} state={{from: "screenings"}} className="btn btn-red"><span>Request New Screening <i className="fas fa-plus"></i></span></Link>}
                runSearch={runSearch}
                columns={[
                    {label: "Applicant", class: "st-col-30 st-col-md-50", sort_by: "resident.last_name"},
                    {label: "Future Address", class: "st-col-20 hidden-md", sort_by: "lease.property_name"},
                    {label: "Last<br/>Updated", class: "st-col-20 st-col-md-50", sort_by: "updated_at"},
                    {label: "Status", class: "st-col-15 hidden-md", sort_by: "external_screening_status"},
                    {label: "Report Type", class: "st-col-15 hidden-md", sort_by: "screening_package.name"}
                ]}
                generateTableRow={generateTableRow}
            />}
        </>

    )}

export default ScreeningListPage;

