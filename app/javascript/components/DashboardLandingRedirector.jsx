import React, {useEffect} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../app/insightUtils";

const DashboardLandingRedirector = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    useEffect(() => {

        // Residents should not be here. Send them to the portal
        if (currentUser) {
            if (insightUtils.isAdmin(currentUser)) {
                window.document.location.href = '/dashboard_users'
            }
            else {
                window.document.location.href = '/dashboard'
            }
        }

    }, [currentUser]);

    return (
        <>
        </>
    )}

export default DashboardLandingRedirector;

