import React from 'react';
import {searchForVendors} from "../../../slices/vendorSlice";
import store from "../../../app/store";

import {Link} from "react-router-dom";
import VendorListRow from "./VendorListRow";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import moment from "moment";

const VendorListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForVendors({searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.vendors}
    }

    function generateTableRow(vendor, key) {
        return (<VendorListRow key={key} vendor={vendor} />)
    }

    return (
        <>
            {currentUser.vendors_view && <ListPage
                title="Vendors"
                titleImage={<img className="section-img" src="/images/photo-maintenance.jpg" />}
                runSearch={runSearch}
                addButton={<div>
                    {currentUser.vendors_edit ? <Link to={insightRoutes.vendorNew()} className="btn btn-red"><span>Add Vendor <i className="fas fa-plus"></i></span></Link> : null}
                    &nbsp;
                    {currentUser.reports_view ? <Link to={insightRoutes.reportRun("vendors")} className="btn btn-red"><span>Export Vendors <i className="fa fa-file-export"></i></span></Link> : null}
                </div>}
                columns={[
                    {label: "Vendor", class: "st-col-20 st-col-md-50", sort_by: "name"},
                    {label: "Status", class: "st-col-10 hidden-md", sort_by: "status"},
                    {label: "Category", class: "st-col-10 st-col-md-50", sort_by: "vendor_category_id"},
                    {label: "Contact Info", class: "st-col-25 hidden-md", sort_by: "phone_number"},
                    {label: "Address", class: "st-col-30 hidden-md", sort_by: "street"}

                ]}
                defaultSortBy="name"
                defaultSortDir="asc"
                generateTableRow={generateTableRow}
            />}
        </>

    )}

export default VendorListPage;

