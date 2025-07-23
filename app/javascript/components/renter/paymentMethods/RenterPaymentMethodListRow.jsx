import React, {useState, useEffect, useRef} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";


const RenterPaymentMethodListRow = ({paymentMethod, lease, leaseResident}) => {
    let navigate = useNavigate();

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <div className="st-row-wrap">
            <div className="st-row st-row-5-col-table">
                <div className="st-col-50 st-first-col">
                    <span>
				        <Link to={insightRoutes.renterPaymentMethodEdit(lease.hash_id, paymentMethod.hash_id)}>{paymentMethod.nickname}</Link>
			        </span>
                </div>
                <div className="st-col-25">
                    {paymentMethod.method_pretty}
                </div>
                <div className="st-col-25">
                    {leaseResident && leaseResident.recurring_payment_method_id == paymentMethod.id ? "Yes" : "No"}
                </div>


                <span className="st-col-6 st-nav-col">
                    <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                        <li onClick={() => navigateAndClose(insightRoutes.renterPaymentMethodEdit(lease.hash_id, paymentMethod.hash_id))} className="btn-maint-comments"><i className="fal fa-edit"></i>Edit</li>
                    </RowMenu>


                </span>

            </div>
        </div>

    )}

export default RenterPaymentMethodListRow;

