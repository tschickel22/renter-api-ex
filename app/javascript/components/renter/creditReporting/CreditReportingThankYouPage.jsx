import React from "react";
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const CreditReportingThankYouPage = ({}) => {
    const navigate = useNavigate()

    return (
        <div className="section">
            <h1>You are now active with Renter Insight Credit Builder</h1>
            <p className="text-center">Your on-time payments will be reported to build your credit.</p>
            <button onClick={() => navigate(insightRoutes.renterPortal())} className="btn btn-red">Done</button>
        </div>
    )
}

export default CreditReportingThankYouPage;

