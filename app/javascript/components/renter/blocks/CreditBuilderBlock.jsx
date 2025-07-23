import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {loadCreditReportingActivities} from "../../../slices/residentSlice";
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const CreditBuilderBlock = ({lease, leaseResident}) => {
    const navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [creditReportingSummary, setCreditReportingSummary] = useState(null)

    const isActive = leaseResident?.resident?.credit_builder_status == constants.credit_builder_status_options.active.key

    useEffect(async() => {
        if (isActive) {
            const results = await store.dispatch(loadCreditReportingActivities({residentId: leaseResident.resident.hash_id})).unwrap()

            setCreditReportingSummary(results.data.summary)

        }
    }, [])

    return (
        <div className="flex-grid-item">
            <h3>Credit Builder</h3>
            {isActive ?
                <>
                    {creditReportingSummary &&
                        <>
                            <div className="flex-line-block">
                                <div className="flex-line">Status: <strong>Active</strong></div>
                                {creditReportingSummary.last_reported_on && <div className="flex-line">Last Update: <strong className="rd-item">{insightUtils.formatDate(creditReportingSummary.last_reported_on)}</strong></div>}
                                {creditReportingSummary.last_amount_reported && <div className="flex-line">Amount Reported: <strong className="rd-item">{insightUtils.numberToCurrency(creditReportingSummary.last_amount_reported)}</strong></div>}
                                <div className="flex-line"># Months Reported: <strong>{creditReportingSummary.months_reported}</strong></div>
                            </div>
                            <div className="spacer"></div>
                            <div onClick={() => {
                                navigate(insightRoutes.renterCreditReportingActivityList())
                            }} className="btn btn-bottom btn-red"><span>View</span></div>
                        </>
                    }
                </>
                :
                <>
                    <div className="flex-line-blockwrap">
                        <p>Report Only Positive Rent Payments To Credit Bureau And Increase Your Credit Score</p>
                    </div>
                    <img src="/images/credit-builder.png" width={225}/>
                    <div className="spacer"></div>
                    <div onClick={() => {
                        navigate(insightRoutes.renterCreditReportingOnboarding())
                    }} className="btn btn-bottom btn-red"><span>Activate</span></div>
                </>
            }
        </div>
    )
}

export default CreditBuilderBlock;

