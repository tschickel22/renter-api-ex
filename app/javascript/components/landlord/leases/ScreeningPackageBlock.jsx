import React from 'react';

import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const ScreeningPackageBlock = ({screeningPackage, isActive, handlePackageSelection}) => {

    const { currentUser } = useSelector((state) => state.user)

    function internalHandlePackageSelection(selectedScreeningPackage) {
        if (handlePackageSelection) handlePackageSelection(selectedScreeningPackage)
    }

    return (
        <div className={"package package-plus" + (isActive ?  " active" : "")} style={{display: "flex"}} onClick={() => internalHandlePackageSelection( screeningPackage.id)}>
            <div className="package-details">
                <div className="package-icon"></div>
                <div className="package-price">
                    <h3>{screeningPackage.name}</h3>
                    <div className="price">{insightUtils.numberToCurrency(screeningPackage.price, 2)}<span>per screening</span></div>
                </div>

                {!currentUser || insightUtils.isCompanyUserAtLeast(currentUser) &&
                    <ul className="package-benefits">
                        {screeningPackage.has_credit_score && <li><i className="fas fa-check"></i>Credit-Based Resident Score™</li>}
                        {screeningPackage.has_criminal_report && <li><i className="fas fa-check"></i>National Criminal Report<sup>*</sup></li>}
                        {screeningPackage.has_full_credit_report && <li><i className="fas fa-check"></i>Full Credit Report</li>}
                        {screeningPackage.has_eviction_report && <li><i className="fas fa-check"></i>Eviction Report<sup>**</sup></li>}
                        {screeningPackage.has_income_report && <li><i className="fas fa-check"></i>Income Report</li>}
                    </ul>
                }
            </div>

            {handlePackageSelection && <div className="btn btn-gray btn-package"><span></span></div>}
        </div>

    )}

export default ScreeningPackageBlock;

