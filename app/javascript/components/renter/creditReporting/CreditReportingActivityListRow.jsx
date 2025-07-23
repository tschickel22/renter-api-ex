import React, {useState} from "react";
import store from "../../../app/store";
import RenterMaintenanceRequestListRow from "../maintenanceRequests/RenterMaintenanceRequestListRow";
import ListPage from "../../shared/ListPage";
import {loadCreditReportingActivities} from "../../../slices/residentSlice";
import {Link, useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import RowMenu from "../../shared/RowMenu";

const CreditReportingActivityListRow = ({creditReportingYear}) => {

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-10 st-first-col">
                        {creditReportingYear.year}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.jan && insightUtils.numberToCurrency(creditReportingYear.jan, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.feb && insightUtils.numberToCurrency(creditReportingYear.feb, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.mar && insightUtils.numberToCurrency(creditReportingYear.mar, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.apr && insightUtils.numberToCurrency(creditReportingYear.apr, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.may && insightUtils.numberToCurrency(creditReportingYear.may, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.jun && insightUtils.numberToCurrency(creditReportingYear.jun, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.jul && insightUtils.numberToCurrency(creditReportingYear.jul, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.aug && insightUtils.numberToCurrency(creditReportingYear.aug, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.sep && insightUtils.numberToCurrency(creditReportingYear.sep, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.oct && insightUtils.numberToCurrency(creditReportingYear.oct, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.nov && insightUtils.numberToCurrency(creditReportingYear.nov, 2)}
                    </div>
                    <div className="st-col-10">
                        {creditReportingYear.dec && insightUtils.numberToCurrency(creditReportingYear.dec, 2)}
                    </div>
                    <span className="st-nav-col">

                    </span>
                </div>
            </div>

        </>

    )
}

export default CreditReportingActivityListRow;

