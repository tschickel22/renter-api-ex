import React, {useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const VendorListRow = ({vendor}) => {
    let navigate = useNavigate()

    const { constants, items } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-20 st-col-md-50 st-first-col">
                        {currentUser.vendors_edit ?
                            <Link to={insightRoutes.vendorEdit(vendor.id)}>{vendor.name}</Link>
                            :
                            <>{vendor.name}</>
                        }
                    </div>
                    <div className="st-col-10 hidden-md">
                        {insightUtils.getLabel(vendor.status, constants.vendor_statuses)}
                    </div>
                    <div className="st-col-10 st-col-md-50">
                        {insightUtils.getLabel(vendor.vendor_category_id, items.filter((item) => (item.type == 'VendorCategory')))}
                    </div>
                    <div className="st-col-25 hidden-md">
                        {vendor.phone_number}<br/>
                        {vendor.email}
                    </div>
                    <div className="st-col-30 hidden-md">
                        {vendor.street && <> {vendor.street}<br/></>}
                        {vendor.city && <> {vendor.city}, </>}
                        {vendor.state && <> {vendor.state} </>}
                        {vendor.zip}
                    </div>
                    <span className="st-nav-col">
                        {currentUser.vendors_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <li onClick={()=>navigateAndClose(insightRoutes.vendorEdit(vendor.id))}><i className="fal fa-pencil"></i> Edit</li>
                        </RowMenu>}
                    </span>
                </div>
            </div>

        </>

    )}

export default VendorListRow;

