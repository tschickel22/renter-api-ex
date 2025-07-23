import React, {useState, useEffect} from 'react';
import {activatePropertyForScreening, loadProperties, searchForProperties} from "../../../slices/propertySlice";

import {Link, useNavigate} from "react-router-dom";
import PropertyListRow from "./PropertyListRow";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import ListPage from "../../shared/ListPage";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import CompanyNav from "./CompanyNav";
import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";


const PropertyListPage = ({}) => {

    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const [searchByStatus, setSearchByStatus] = useState("active")

    async function runSearch(text, _page) {
        const results = await store.dispatch(searchForProperties({searchText: text, status: searchByStatus})).unwrap()
        return {total: results.data.total, objects: results.data.properties}
    }

    function generateTableRow(property, key) {
        return (<PropertyListRow key={key} property={property} handleScreeningActivation={handleScreeningActivation} />)
    }

    async function handleScreeningActivation(property) {
        navigate(insightRoutes.propertyScreeningAttestation(property.id))
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
    }

    return (
        <>
            {currentUser.properties_view && <ListPage
                title="Properties"
                runSearch={runSearch}
                nav={<CompanyNav />}
                titleImage={<img className="section-img" src="/images/photo-properties.jpg" />}
                addButton={currentUser.properties_edit ? <Link to={insightRoutes.propertyChooseAddMethod()} className="btn btn-red"><span>Add Property <i className="fas fa-plus"></i></span></Link> : null}
                moveSecondaryNavAsNeeded={true}
                secondaryNav={
                    <Formik initialValues={{status: searchByStatus}}>
                        {({  }) => (
                            <Form>
                                <div className="st-nav">
                                    <div className="form-item">
                                        <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "active", name: "Active"}, {id: "inactive", name: "Inactive"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide" />
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                }
                reloadWhenChanges={searchByStatus}
                columns={[
                        {label: "Property", class: "st-col-30", sort_by: "name"},
                        {label: "Occupancy", class: "st-col-15", sort_by: "units_occupied"},
                        {label: "Rent", class: "st-col-10", sort_by: "rent_total"},
                        {label: "Leases<br>Expiring<br>in 60 Days", class: "st-col-10 hidden-md", sort_by: "lease_expirations"},
                        {label: "Active Listings", class: "st-col-10 hidden-lg", sort_by: "active_listings"},
                        {label: "Electronic Payments", class: "st-col-15 hidden-xl", sort_by: "units_electronic_payments"},
                        {label: "Renters Insurance", class: "st-col-10 hidden-xl", sort_by: "units_renters_insurance"},
                ]}
                generateTableRow={generateTableRow}
                noDataMessage={<div style={{padding: "50px 0", textAlign: "center"}}>{searchByStatus == "inactive" ? "No properties found" : <>To continue setting up your account, <Link to={insightRoutes.propertyNew()}>add a property</Link>.</>}</div>}
            />}
        </>
    )}

export default PropertyListPage;

