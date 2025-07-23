import React from 'react';
import DashboardTile from "../DashboardTile";

const DashboardRentChange = ({dashboardData}) => {

    return (
        <>
            <DashboardTile icon={<i className="fal fa-bar-chart"/>} title="Rent Growth YoY" className="tile-short">
                <div className="indicator-and-stat">
                    {dashboardData.rent_yoy_pct ?
                        <>
                            <div className={"indicator " + (dashboardData.rent_yoy_pct > 0 ? "positive" : "negative")}>
                                <i className={"fa " + (dashboardData.rent_yoy_pct > 0 ? "fa-arrow-up" : "fa-arrow-down")}/>
                            </div>
                            <div className="stat">{parseInt(dashboardData.rent_yoy_pct)}%</div>
                        </>
                        :
                        <div className="label only">N/A</div>
                    }
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardRentChange;

