import React, {useEffect, useMemo, useState} from 'react';
import store from "../../../app/store";
import ListPage from "../../shared/ListPage";
import LeaseListRow from "./LeaseListRow";
import {searchForLeases} from "../../../slices/leaseSlice";
import {Link, useLocation, useParams} from "react-router-dom";
import PropertyNav from "../companies/PropertyNav";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import CompanyNav from "../companies/CompanyNav";
import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import ScreeningNav from "../companies/ScreeningNav";


const ResidentListPage = ({}) => {

    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [searchByStatus, setSearchByStatus] = useState(params.status ? params.status : "all")
    const [daysFrom, setDaysFrom] = useState(params.daysFrom ? params.daysFrom : null)
    const [daysTo, setDaysTo] = useState(params.daysTo ? params.daysTo : null)

    const searchValues = useMemo(() => {
        return (searchByStatus || '') + (daysFrom || '') + (daysTo || '')
    }, [searchByStatus, daysFrom, daysTo])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForLeases({propertyId: params.propertyId, mode: "residents", daysFrom: daysFrom, daysTo: daysTo, searchText: text, status: searchByStatus})).unwrap()
        return {total: results.data.total, objects: results.data.leases}
    }

    function generateTableRow(lease, key) {
        if (lease.primary_resident && lease.primary_resident.resident) {
            return (<LeaseListRow key={key} lease={lease} mode="residents" />)
        }
        else {
            return null
        }
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
    }

    return (
        <ListPage
            title={"Residents"}
            runSearch={runSearch}
            titleImage={<img className="section-img" src="/images/photo-residents.jpg" />}
            nav={property ? <PropertyNav property={property} /> : <CompanyNav />}
            addButton={
                currentUser.residents_edit ? <Link to={insightRoutes.residentChooseAddMethod()} state={{from: 'residents'}} className="btn btn-red"><span>Add Existing Resident <i className="fas fa-plus"></i></span></Link>
                    :
                null
            }
            secondaryNav={
                <Formik initialValues={{status: searchByStatus, days_from: daysFrom, days_to: daysTo}}>
                    {({  }) => (
                        <Form>
                            <div className="st-nav">
                                <div className="form-item flex-row flex-nowrap">
                                    <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "current", name: "Current"}, {id: "future", name: "Future"}, {id: "former", name: "Former"}, {id: "expiring", name: "Expiring"}, {id: "move_in", name: "Move-Ins"}, {id: "move_out", name: "Move-Outs"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide" />
                                    {["expiring", "move_in", "move_out"].indexOf(searchByStatus) >= 0 && <>
                                        <div>&nbsp;&nbsp;&nbsp;</div>
                                        <BasicDropdown name="days_from" options={[{id: "0", name: "Today"}, {id: "31", name: "31 Days"}, {id: "61", name: "61 Days"}]} onChange={(e) => setDaysFrom(e.target.value)} />
                                        <div style={{lineHeight: "2rem"}}>&nbsp;&nbsp;to&nbsp;&nbsp;</div>
                                        <BasicDropdown name="days_to" options={[{id: "30", name: "30 Days"}, {id: "60", name: "60 Days"}, {id: "90", name: "90 Days"}]} onChange={(e) => setDaysTo(e.target.value)} />
                                    </>}
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            }
            moveSecondaryNavAsNeeded={true}
            noDataMessage="No Data Found"
            columns={[
                {label: "Name", class: "st-col-30 st-col-md-75", sort_by: "primary_resident.resident.last_name"},
                {label: params.propertyId ? "Unit" : "Property", class: "st-col-15 hidden-md", sort_by: "property_name"},
                {label: "Rent", class: "st-col-10 hidden-md", sort_by: "rent", data_type: "float"},
                {label: "Lease<br/>Starts", class: "st-col-10 hidden-lg", sort_by: "lease_start_on"},
                {label: "Lease<br/>Ends", class: "st-col-10 hidden-lg", sort_by: "lease_end_on"},
                {label: "Resident<br/>Status", class: "st-col-15 hidden-xl", sort_by: "status"}
            ]}
            defaultSortBy="primary_resident.resident.last_name"
            defaultSortDir="asc"
            generateTableRow={generateTableRow}
            reloadWhenChanges={searchValues}
        />
    )}

export default ResidentListPage;

