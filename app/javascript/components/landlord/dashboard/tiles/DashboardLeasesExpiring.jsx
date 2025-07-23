import React, {useEffect, useState} from 'react';

import store from "../../../../app/store";

import insightRoutes from "../../../../app/insightRoutes";
import {searchForLeases} from "../../../../slices/leaseSlice";
import {Link, useNavigate} from "react-router-dom";
import moment from "moment";
import DashboardTile from "../DashboardTile";

const DashboardLeasesExpiring = ({}) => {

    let navigate = useNavigate()

    const [count30, setCount30] = useState(0)
    const [count60, setCount60] = useState(0)
    const [count90, setCount90] = useState(0)
    const [total, setTotal] = useState(null)


    useEffect(async () => {
        const results = await store.dispatch(searchForLeases({mode: "residents", searchText: "", status: "expiring", daysTo: 90})).unwrap()

        results.data.leases

        // Organize by days
        let counts = {30: 0, 60: 0, 90: 0}
        let today = moment()

        if (results.data.leases) {
            results.data.leases.forEach((lease) => {
                let leaseEndOn = moment(lease.lease_end_on)
                let daysUntil = leaseEndOn.diff(today, "days")

                if (daysUntil) {
                    if (daysUntil <= 30) {
                        counts[30] = counts[30] + 1
                    }
                    else if (daysUntil <= 60) {
                        counts[60] = counts[60] + 1
                    }
                    else if (daysUntil <= 90) {
                        counts[90] = counts[90] + 1
                    }
                }
            })
        }

        setCount30(counts[30])
        setCount60(counts[60])
        setCount90(counts[90])
        setTotal(counts[30] + counts[60] + counts[90])

    },[])

    return (
        <>
            <DashboardTile icon={<i className="fal fa-memo"/>} title="Leases Expiring" total={total} className="tile tile-list" viewAllPath={insightRoutes.residentList("expiring", 0, 90)}>
                <div className="section-table-wrap">
                    <div className="section-list">

                        <div className="st-row priority-high" onClick={() => navigate(insightRoutes.residentList("expiring", 0, 30))} style={{cursor: "pointer"}}>
                            <div className="st-col-100">
                                Leases expiring in <strong>30 days or less</strong>
                                <span className="float-right">{count30}</span>
                            </div>
                        </div>
                        <div className="st-row priority-medium" onClick={() => navigate(insightRoutes.residentList("expiring", 31, 60))} style={{cursor: "pointer"}}>
                            <div className="st-col-100">
                                Leases expiring in <strong>31-60 days</strong>
                                <span className="float-right">{count60}</span>
                            </div>
                        </div>
                        <div className="st-row priority-low" onClick={() => navigate(insightRoutes.residentList("expiring", 61, 90))} style={{cursor: "pointer"}}>
                            <div className="st-col-100">
                                Leases expiring in <strong>61-90 days</strong>
                                <span className="float-right">{count90}</span>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="tile-spacer" />
                <Link to={insightRoutes.residentList("expiring", 0, 90)} className="tile-pagination">Showing {total} | View All</Link>

            </DashboardTile>
        </>

    )}

export default DashboardLeasesExpiring;

