import React, {useEffect} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {useSelector} from "react-redux";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const FinancialConnectionBasePage = ({}) => {
    const navigate = useNavigate()

    const { constants, currentCompany } = useSelector((state) => state.company)
    const stripePromise = loadStripe(constants.env.stripe_public_key)

    useEffect(() => {
        if (currentCompany && currentCompany.financial_connections_onboard_status != constants.financial_connections_onboarding_statuses.completed.key) {
            navigate(insightRoutes.onboardingFinancialConnections())
        }
    }, [currentCompany])

    return (
        <>
            <Elements stripe={stripePromise} options={{}}>
                <Outlet />
            </Elements>
        </>

    )}


export default FinancialConnectionBasePage;

