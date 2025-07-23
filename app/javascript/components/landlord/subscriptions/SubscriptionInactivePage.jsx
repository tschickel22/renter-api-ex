import React from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";

const SubscriptionInactivePage = ({}) => {
    const { constants } = useSelector((state) => state.company)

    return (
        <div className="section">
            <h1>Your Renter Insight Subscription is Inactive</h1>
            <p className="text-center">Please use the button below to access Billing & Subscriptions in order to bring your account back into good standing:</p>
            <a href={constants.env.zoho_sso_url} target="_blank" className="btn btn-red">Access Billing & Subscriptions</a>
        </div>
    )}

export default SubscriptionInactivePage;