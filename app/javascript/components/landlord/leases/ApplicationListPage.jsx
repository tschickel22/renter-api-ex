import React, {useEffect, useState} from 'react';
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


const ApplicationListPage = ({}) => {

    let params = useParams();
    const {state} = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [searchByStatus, setSearchByStatus] = useState("all")
    const [from, setFrom] = useState("")

    useEffect(() => {
        if (state) {
            setFrom(state.from)
        }
    }, [])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForLeases({propertyId: params.propertyId, mode: "applicants", searchText: text, status: searchByStatus})).unwrap()
        return {total: results.data.total, objects: results.data.leases}
    }

    function generateTableRow(lease, key) {
        if (lease.primary_resident && lease.primary_resident.resident) {
            return (<LeaseListRow key={key} lease={lease} mode={"applicants"} />)
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
            title="Applications"
            runSearch={runSearch}
            titleImage={<img className="section-img" src="/images/photo-applications.jpg" />}
            nav={from && from == "screeningNav" ? <ScreeningNav /> : (property ? <PropertyNav property={property} /> : <CompanyNav />)}
            addButton={
                currentUser.leasing_edit ?
                    <Link to={insightRoutes.screeningNew(property ? property.id : 0)} state={{from: 'applicants'}} className="btn btn-red"><span>Request New Application <i className="fas fa-plus"></i></span></Link>
                    :
                    null
            }
            secondaryNav={
                <Formik initialValues={{status: searchByStatus}}>
                    {({  }) => (
                        <Form>
                            <div className="st-nav">
                                <div className="form-item">
                                    <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "no_decision", name: "No Decision"}, {id: "approved", name: "Approved"}, {id: "declined", name: "Declined"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide" />
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
                {label: "Last<br/>Updated", class: "st-col-20 st-col-md-25", sort_by: "primary_resident.updated_at"},
                {label: "Application<br/>Status", class: "st-col-15 hidden-xl", sort_by: "application_status"}
            ]}
            defaultSortBy="primary_resident.updated_at"
            defaultSortDir="desc"
            generateTableRow={generateTableRow}
            reloadWhenChanges={searchByStatus}
        />
    )}

export default ApplicationListPage;

