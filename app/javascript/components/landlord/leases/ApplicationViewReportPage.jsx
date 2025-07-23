import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {Link, useParams} from "react-router-dom";

import store from "../../../app/store";
import {loadLeaseResidentReport, saveReportDisclaimerAcceptance} from "../../../slices/leaseResidentSlice";
import insightRoutes from "../../../app/insightRoutes";

const ApplicationViewReportPage = ({leaseResidentId, leaseResidentReportId, embedded}) => {
    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [leaseResidentReport, setLeaseResidentReport] = useState(null)
    const [reportDisclaimer, setReportDisclaimer] = useState(null)

    useEffect(async () => {

        /*
           Load Lease
         */
        if (currentUser && !lease) {
            const result = await store.dispatch(loadLeaseResidentReport({leaseResidentId: leaseResidentId || params.leaseResidentId, leaseResidentReportId: leaseResidentReportId || params.leaseResidentReportId})).unwrap()
            const response = result.data

            if (response.success) {
                setLeaseResident(response.lease_resident)
                setLeaseResidentReport(response.lease_resident_report)
                setReportDisclaimer(response.report_disclaimer)
                setLease(response.lease)
            }
        }

    }, [currentUser, lease]);


    async function handleDisclaimerAccept() {
        await store.dispatch(saveReportDisclaimerAcceptance({leaseResidentId: leaseResidentId || params.leaseResidentId, leaseResidentReportId: leaseResidentReportId || params.leaseResidentReportId})).unwrap()

        // Trigger a reload
        setLease(null)
    }

    return (
        <>

            {leaseResident && leaseResidentReport && <div className="section">
                {!embedded && lease &&
                    <div className="flex-grid">
                        <div className="flex-left st-col-25">
                            <Link to={insightRoutes.leaseShow(lease.hash_id)} className="btn btn-gray">&lt; Back</Link>
                        </div>
                        <div className="flex-center st-col-50">
                            <h1 style={{marginTop: 0}}>{leaseResidentReport.report_type} Report</h1>
                        </div>
                        <div className="st-col-25">
                            &nbsp;
                        </div>
                    </div>
                }
                <div className="content" dangerouslySetInnerHTML={{__html: leaseResidentReport.report_content}} />
            </div>}
            {!leaseResidentReport && reportDisclaimer && <div className="alert-box">
                <div>
                    {reportDisclaimer.disclaimer}
                    <br/><br/>
                    <div className="btn-block" style={{justifyContent: "center"}}>
                        <div onClick={() => {handleDisclaimerAccept()}}  className="btn btn-red">Yes</div>
                        &nbsp;
                        <div onClick={() => {history.back()}} className="btn btn-clear">No</div>
                    </div>
                </div>
            </div>}

        </>

    )}

export default ApplicationViewReportPage;

