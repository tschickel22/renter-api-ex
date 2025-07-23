import React from 'react';
import DashboardTile from "../DashboardTile";

const DashboardRentCollected = ({dashboardData}) => {

    return (
        <>
            <DashboardTile icon={<i className="fal fa-dollar-circle"/>} title="Rent Collected" className="tile-short">
                <div className="indicator-and-stat">
                    {dashboardData.rent_collected_this_month_pct ?
                        <>
                            <div className="label">{dashboardData.this_month_title}</div>
                            <div className="stat">{parseInt(dashboardData.rent_collected_this_month_pct)}%</div>
                        </>
                        :
                        <div className="label only">N/A</div>
                    }
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardRentCollected;

