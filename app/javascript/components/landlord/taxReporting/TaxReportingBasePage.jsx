import React, {useEffect} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {useSelector} from "react-redux";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const TaxReportingBasePage = ({}) => {
    const navigate = useNavigate()

    const { constants, currentCompany } = useSelector((state) => state.company)

    useEffect(() => {
        if (currentCompany && ![constants.tax_reporting_onboard_statuses.pending.key, constants.tax_reporting_onboard_statuses.completed.key].includes(currentCompany.tax_reporting_onboard_status)) {
            navigate(insightRoutes.onboardingTaxReporting())
        }
    }, [currentCompany])

    return (
        <>
          <Outlet />
        </>

    )}


export default TaxReportingBasePage;

