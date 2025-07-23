import React, {useEffect, useState} from 'react';
import {Link, NavLink, useLocation} from "react-router-dom";
import {client} from "../../app/client";
import store from "../../app/store";
import {loadUserFromRails} from "../../slices/userSlice";
import {useSelector} from "react-redux";
import insightRoutes from "../../app/insightRoutes";
import {searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import insightUtils from "../../app/insightUtils";

const ResidentSideBar = ({}) => {

    const location = useLocation();
    const { currentUser, currentActualUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)
    const { isMobileDevice } = useSelector((state) => state.dashboard)


    const [mobileMenuOpen, setMobileMenuOpen] = useState(null)
    const [leaseResidents, setLeaseResidents] = useState(null)
    const [isCurrentOrFutureResident, setIsCurrentOrFutureResident] = useState(false)

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location])

    useEffect(async() => {

        /*
           Load Lease
         */
        if (currentUser && !leaseResidents) {
            const results = await store.dispatch(searchForLeaseResidents({})).unwrap()
            console.log(results.data)
            setLeaseResidents(results.data.lease_residents)

            const currentOrFutureLeaseResident = results.data.lease_residents.find((leaseResident) => {
                return (leaseResident.lease.lease_start_on && leaseResident.lease.status == constants.lease_statuses.future.key) || leaseResident.lease.status == constants.lease_statuses.current.key || leaseResident.lease.status == constants.lease_statuses.former.key
            })

            if (currentOrFutureLeaseResident) {
                setIsCurrentOrFutureResident(true)
            }
            else {
                setIsCurrentOrFutureResident(false)
            }
        }

    }, [currentUser]);

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
        <div className={"sidenav" + (mobileMenuOpen ? " mobile-nav-active" : "")}>
            <div className="logo-block">
                <Link to="/" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight" /></Link>
                <div onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={"mobile-nav-btn" + (mobileMenuOpen ? " nav-btn-active" : "")}><i className="fal fa-bars"></i></div>
            </div>

            <div className="menu-block">
                <nav className="menu">
                    <div className="nav-top">
                        {currentUser && <>
                            {false && <a className="nav-item btn-settings"><i className="fal fa-cog"></i><span>Settings</span></a>}
                            <NavLink to={insightRoutes.renterPortal()} className="nav-item"><i className="fal fa-home"></i><span>Home</span></NavLink>
                            {isCurrentOrFutureResident && <>
                                <NavLink to={insightRoutes.renterMaintenanceRequestList()} className="nav-item"><i className="fal fa-tools"></i><span>Maintenance</span></NavLink>
                                <NavLink to={insightRoutes.communicationCenter(currentUser)} className="nav-item"><i className="fal fa-comments"></i><span>Communication</span></NavLink>
                            </>}
                            <a href="https://residentportal.renterinsight.com/portal/en/home" target="_blank" className="nav-item"><i className="fal fa-lightbulb"></i><span>Knowledge Center</span></a>

                            {isMobileDevice && <>
                                {insightUtils.isAdmin(currentActualUser) && currentActualUser.id != currentUser.id ?
                                    <a href={"/admin/users/" + currentActualUser.id + "/proxy"} className="nav-item"><i className="fal fa-sign-out" role="presentation"></i><span>Proxy Out</span></a>
                                    :
                                    <a onClick={handleSignOut} className="nav-item"><i className="fal fa-sign-out" role="presentation"></i><span>Log Out</span></a>
                                }
                            </>}
                        </>}
                    </div>
                    <div className="nav-bottom">
                        <a className="nav-item btn-help-terms"><i className="fal fa-question-circle"></i><span>Help/Terms</span></a>
                    </div>
                </nav>
            </div>
        </div>
    )}

export default ResidentSideBar;

