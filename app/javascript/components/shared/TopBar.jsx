import React from 'react';
import {Link, NavLink, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";
import insightRoutes from "../../app/insightRoutes";
import {client} from "../../app/client";
import store from "../../app/store";
import {loadUserFromRails} from "../../slices/userSlice";
import insightUtils from "../../app/insightUtils";


const TopBar = ({}) => {
    const location = useLocation()
    const { currentActualUser, currentUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    function handleSignOut() {
        client.delete("/users/sign_out")
            .then((response) => {
                    store.dispatch(loadUserFromRails({}))

                    // Update CSRF token
                    document.querySelector('meta[name="csrf-token"]').content = response.new_csrf
                },
                () => {
                    console.log("Error: Could not sign out")
                    // Error!
                })
    }

    return (
        <div className="topnav">
            <div className="topnav-block">
                <div className="logo-block">
                    <Link to="/" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight" /></Link>
                </div>
                {currentUser &&
                    <div className="user-menu nav-dropdown-wrapper">
                        <div className="circle">{currentUser.first_name.slice(0,1)}{currentUser.last_name.slice(0,1)}</div>

                        <div className="nav-dropdown">
                            {currentUser.settings_edit && !insightUtils.isResident(currentUser) && <Link to={insightRoutes.companyEdit("my")} state={{return_url: location.pathname + (window.location.search || '')}} className="nav-item"><span>Manage Account</span></Link>}
                            {currentUser.settings_edit && !insightUtils.isResident(currentUser) && <a href={constants.env.zoho_sso_url} target="_blank" className="nav-item"><span>Billing & Subscriptions</span></a>}

                            {currentActualUser && currentActualUser.user_type == "admin" && currentActualUser.id != currentUser.id ?
                                <a href={"/admin/users/" + currentActualUser.id + "/proxy"} className="nav-item"><span>Proxy Out</span></a>
                                :
                                <a onClick={handleSignOut}><span>Log Out</span></a>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>

    )}

export default TopBar;

