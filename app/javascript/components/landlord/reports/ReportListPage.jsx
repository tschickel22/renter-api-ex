import React, {useEffect, useState} from 'react';
import {Link, useParams} from "react-router-dom";
import {runReport} from "../../../slices/reportSlice";
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";

const ReportListPage = ({}) => {
    let params = useParams();

    const [reports, setReports] = useState(null)

    /*
    useEffect(async() => {
        const results = await store.dispatch(loadReports({reportId: params.reportId, reportParams: reportParams})).unwrap()
        console.log(results)
        setReports(results.data.report)
    }, [])
    */
    return (
        <>

            <div className="section">
                <Link to={insightRoutes.reportRun('transactions')} />
            </div>

        </>

    )}

export default ReportListPage;

