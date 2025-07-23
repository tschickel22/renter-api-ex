import React from 'react';
import DashboardTile from "../DashboardTile";

const DashboardOccupancy = ({dashboardData}) => {

    return (
        <>
            <DashboardTile icon={<i className="fal fa-house"/>} title="Occupancy" className="tile-short">
                <div className="indicator-and-stat">
                    {dashboardData.occupancy_pct ?
                        <>
                            <div className="stat only">{parseInt(dashboardData.occupancy_pct)}%</div>
                        </>
                        :
                        <div className="label only">N/A</div>
                    }
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardOccupancy;

