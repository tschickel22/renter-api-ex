import React, {useEffect, useState} from 'react';
import DashboardRentChange from "./tiles/DashboardRentChange";
import DashboardRentCollected from "./tiles/DashboardRentCollected";
import DashboardOccupancy from "./tiles/DashboardOccupancy";
import DashboardMessages from "./tiles/DashboardMessages";
import DashboardMaintenanceRequests from "./tiles/DashboardMaintenanceRequests";
import DashboardApplications from "./tiles/DashboardApplications";
import DashboardLeases from "./tiles/DashboardLeases";
import store from "../../../app/store";
import {loadDashboard} from "../../../slices/dashboardSlice";
import DashboardLeasesExpiring from "./tiles/DashboardLeasesExpiring";
import DashboardListings from "./tiles/DashboardListings";
import DashboardRentCollectedGraph from "./tiles/DashboardRentCollectedGraph";
import DashboardOutstandingBalances from "./tiles/DashboardOutstandingBalances";
import DashboardOccupancyGraph from "./tiles/DashboardOccupancyGraph";
import {useSelector} from "react-redux";
import DashboardQuickAccess from "./tiles/DashboardQuickAccess";
import DashboardIncomeVsExpensesGraph from "./tiles/DashboardIncomeVsExpensesGraph";

const DashboardPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    const [dashboardData, setDashboardData] = useState(null)

    useEffect(() => {
        // Only company admins see dashboard - removed this rule 7/13/2023
        /* if (currentUser && !insightUtils.isCompanyAdmin(currentUser)) {
            navigate("/")
        }*/
    })

    useEffect(async () => {
        // Load the dashboard data for this user
        const results = await store.dispatch(loadDashboard()).unwrap()

        setDashboardData(results.data)
    }, [])

    return (
        <>
            <div className="section dashboard">
                {dashboardData ? <>
                        <div className="flex-row">
                            <DashboardQuickAccess />
                        </div>
                        {currentUser.reports_view && <div className="flex-row">
                            <DashboardRentChange dashboardData={dashboardData} />
                            <DashboardRentCollected dashboardData={dashboardData} />
                            <DashboardOccupancy dashboardData={dashboardData} />
                        </div>}

                        <div className="flex-row">
                            {currentUser.communications_view && <DashboardMessages />}
                            {currentUser.maintenance_requests_view && <DashboardMaintenanceRequests />}
                            {currentUser.leasing_view && <DashboardApplications />}
                            {currentUser.leasing_view && <DashboardLeases />}
                            {currentUser.leasing_view && <DashboardLeasesExpiring />}
                            {currentUser.listings_view && <DashboardListings />}
                            {currentUser.reports_view && <>
                                <DashboardRentCollectedGraph dashboardData={dashboardData} />
                                <DashboardOutstandingBalances />
                                <DashboardOccupancyGraph dashboardData={dashboardData} />
                                <DashboardIncomeVsExpensesGraph dashboardData={dashboardData} />
                            </>}
                        </div>
                    </>

                        :

                    <div className="loading">Loading...</div>
                }
            </div>
        </>

    )}

export default DashboardPage;

