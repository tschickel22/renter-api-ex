import React from 'react';
import {searchForPropertyOwners} from "../../../slices/propertySlice";
import store from "../../../app/store";

import {Link, useParams} from "react-router-dom";
import PropertyOwnerListRow from "./PropertyOwnerListRow";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import PropertyNav from "./PropertyNav";
import CompanyNav from "./CompanyNav";
import insightUtils from "../../../app/insightUtils";

const PropertyOwnerListPage = ({}) => {

    let params = useParams();
    const { currentUser } = useSelector((state) => state.user)
    const { properties, constants } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForPropertyOwners({searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.property_owners}
    }

    function generateTableRow(propertyOwner, key) {
        return (<PropertyOwnerListRow key={key} propertyOwner={propertyOwner} />)
    }

    return (
        <>
            {currentUser.property_owners_view && <ListPage
                title="Property Owners"
                nav={property ? <PropertyNav property={property} /> : <CompanyNav /> }
                runSearch={runSearch}
                addButton={currentUser.property_owners_edit ? <Link to={insightRoutes.propertyOwnerNew()} className="btn btn-red"><span>Add Property Owner <i className="fas fa-plus"></i></span></Link> : null}
                columns={[
                    {label: "Property Owner", class: "st-col-25", sort_by: "name"},
                    {label: "Email", class: "st-col-20", sort_by: "email"},
                    {label: "Phone", class: "st-col-15", sort_by: "phone_number"},
                    {label: "Address", class: "st-col-25", sort_by: "street"},
                    {label: "# Properties", class: "st-col-15", sort_by: "property_count"},
                ]}
                generateTableRow={generateTableRow}
            />}
        </>

    )}

export default PropertyOwnerListPage;

