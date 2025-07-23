import React from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {NavLink, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";

const CompanyNav = ({}) => {

    const { state } = useLocation()

    const { currentUser } = useSelector((state) => state.user)

    return (
        <>
            <div className="horiz-nav">
                <div />
                <ul className="horiz-nav-list">
                    {currentUser.properties_view && <li className="hn-item"><NavLink to={insightRoutes.propertyList()} state={{from: "properties"}} className="hn-item" state={state}>Properties</NavLink></li>}
                    {currentUser.properties_view && <li className="hn-item"><NavLink to={insightRoutes.unitList()} state={{from: "properties"}} className="hn-item" state={state}>Units</NavLink></li>}
                    {currentUser.listings_view && <li className="hn-item"><NavLink to={insightRoutes.propertyListingList()} className="hn-item" state={state}>Listings</NavLink></li>}
                    {currentUser.leasing_view && <li className="hn-item"><NavLink to={insightRoutes.applicationList()} className="hn-item" state={state}>Applications</NavLink></li>}
                    {currentUser.residents_view && <li className="hn-item"><NavLink to={insightRoutes.residentList()} className="hn-item" state={state}>Residents</NavLink></li>}
                    {currentUser.reports_view && <li className="hn-item"><NavLink to={insightRoutes.companyHistory("my")} className="hn-item" state={state}>History</NavLink></li>}
                </ul>
                <div />
            </div>
        </>

    )}

export default CompanyNav;


