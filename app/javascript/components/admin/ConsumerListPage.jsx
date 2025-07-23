import React from 'react';
import ListPage from "../shared/ListPage";
import store from "../../app/store";
import {searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import ConsumerListRow from "./ConsumerListRow";
import {useLocation, useNavigate} from "react-router-dom";

const ConsumerListPage = ({}) => {

    const navigate = useNavigate()
    const location = useLocation()

    console.log("STATE", location.state)

    async function runConsumerSearch(text, page) {

        let searchText = text

        if (!text && location?.state?.searchText) {
            searchText = location.state.searchText
        }
        else {
            navigate(".", {state: {searchText: text}})
        }

        if (searchText && searchText.length > 0) {
            const results = await store.dispatch(searchForLeaseResidents({searchText: searchText})).unwrap()
            return {total: results.data.lease_residents.length, objects: results.data.lease_residents}
        }
        else {
            return {total: 0, objects: []}
        }
    }

    function generateConsumerTableRow(leaseResident, key) {
        if (leaseResident.lease) {
            return <ConsumerListRow key={key} lease={leaseResident.lease} leaseResident={leaseResident} />
        }
        else {
            return <div key={key}>Incomplete data</div>
        }
    }

    return (
        <div className="section">
            <ListPage
                title="Applicant and Resident Search"
                runSearch={runConsumerSearch}
                titleImage={<React.Fragment />}
                columns={[
                    {label: "Applicant / Resident", class: "st-col-25", sort_by: "id"}
                ]}
                generateTableRow={generateConsumerTableRow}
                noDataMessage="No applicants or residents found. Search by name or email."
            />
        </div>
    )}

export default ConsumerListPage;

