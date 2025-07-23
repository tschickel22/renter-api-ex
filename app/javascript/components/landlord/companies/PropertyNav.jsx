import React from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {Link, NavLink, useLocation, useNavigate, useParams} from "react-router-dom";
import {useSelector} from "react-redux";

const PropertyNav = ({property}) => {

    let params = useParams();
    const navigate = useNavigate()
    const { state } = useLocation()

    const { currentUser } = useSelector((state) => state.user)

    function getBackLabel() {
        if (state && state.from) {
            if (state.from == "properties") return "Properties"
        }

        return "Back"
    }

    function goBack() {
        if (state && state.from) {
            if (state.from == "properties") {
                navigate(insightRoutes.propertyList())
                return
            }
        }

        navigate(-1)
    }

    return (
        <>
            {property && <h2>{property.name}</h2>}
            <div className="horiz-nav">
                {state && state.from && state.from == "properties" && <a onClick={() => goBack()} className="hv-sidebtn hv-sidebtn-left"><i className="fal fa-chevron-left"></i> {getBackLabel()}</a>}

                <ul className="horiz-nav-list">
                    <li className="hn-item"><NavLink to={insightRoutes.unitList(params.propertyId)} state={{from: "properties"}} className="hn-item" state={state}>Units</NavLink></li>
                    {currentUser.leasing_view && <li className="hn-item"><NavLink to={insightRoutes.applicationList(params.propertyId)} className="hn-item" state={state}>Applications</NavLink></li>}
                    {currentUser.residents_view && <li className="hn-item"><NavLink to={insightRoutes.residentListForProperty(params.propertyId)} className="hn-item" state={state}>Residents</NavLink></li>}
                    {currentUser.reports_view && <li className="hn-item"><NavLink to={insightRoutes.propertyHistory(params.propertyId)} className="hn-item" state={state}>History</NavLink></li>}
                </ul>

                {currentUser.properties_edit ? <Link to={insightRoutes.propertyEdit(params.propertyId)} className="hv-sidebtn hv-sidebtn-right hv-sidebtn-red btn-rd-edit">Edit <i className="fal fa-pencil-alt"></i></Link> : <div />}
            </div>
        </>

    )}

export default PropertyNav;


