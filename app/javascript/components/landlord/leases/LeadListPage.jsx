import React from 'react';
import store from "../../../app/store";

import {Link, useParams} from "react-router-dom";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";
import ListPage from "../../shared/ListPage";
import LeadListRow from "./LeadListRow";
import insightRoutes from "../../../app/insightRoutes";
import ScreeningNav from "../companies/ScreeningNav";
import {useSelector} from "react-redux";


const LeadListPage = ({}) => {

    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForLeaseResidents({propertyId: params.propertyId, mode: "leads", searchText: text})).unwrap()
        return {total: results.data.total, objects: results.data.lease_residents}
    }

    function generateTableRow(leaseResident, key) {
        if (leaseResident.resident) {
            return (<LeadListRow key={key} leaseResident={leaseResident} />)
        }
        else {
            return null
        }
    }

    return (<>
        {currentUser.leasing_view &&
            <ListPage
                title="Leads"
                titleImage={<img className="section-img" src="/images/photo-residents.jpg" />}
                nav={<ScreeningNav />}
                runSearch={runSearch}
                defaultSortBy="updated_at"
                defaultSortDir="desc"
                addButton={currentUser.leasing_edit ? <Link to={insightRoutes.leadNew(params.propertyId)} state={{from: 'leads'}} className="btn btn-red"><span>Add Lead <i className="fas fa-plus"></i></span></Link> : null}
                columns={[
                    {label: "Name", class: "st-col-30", sort_by: "resident.last_name"},
                    {label: "Property", class: "st-col-15", sort_by: "lease.property_name"},
                    {label: "Last<br/>Updated", class: "st-col-15", sort_by: "updated_at"}
                ]}
                generateTableRow={generateTableRow}
            />}
        </>
    )}

export default LeadListPage;
