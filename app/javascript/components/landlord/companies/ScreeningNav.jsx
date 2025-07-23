import React from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {NavLink, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";

const ScreeningNav = ({}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { currentCompany } = useSelector((state) => state.company)

    return (
        <>
            <div className="horiz-nav">
                <div />
                <ul className="horiz-nav-list">
                    {currentUser.leasing_view && <li className="hn-item"><NavLink to={insightRoutes.leadList()} className="hn-item">Leads</NavLink></li>}
                    {currentUser.leasing_view && <li className="hn-item"><NavLink to={insightRoutes.applicationList()} state={{from: "screeningNav"}}  className="hn-item">Applications</NavLink></li>}
                    {currentUser.screening_view && currentCompany.external_screening_id && <li className="hn-item"><NavLink to={insightRoutes.screeningList()} className="hn-item">Screening</NavLink></li>}
                </ul>
                <div />
            </div>
        </>

    )}

export default ScreeningNav;


