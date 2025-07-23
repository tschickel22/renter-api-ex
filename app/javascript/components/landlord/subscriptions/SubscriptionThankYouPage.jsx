import React from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const SubscriptionThankYouPage = ({}) => {
    let navigate = useNavigate()

    return (
        <div className="section">
            <h1>Thank you for signing up</h1>
            <p className="text-center">Use the button below to start using Renter Insight:</p>
            <button onClick={() => navigate(insightRoutes.propertyList())} className="btn btn-red">Start Renter Insight</button>
        </div>
    )
}

export default SubscriptionThankYouPage;