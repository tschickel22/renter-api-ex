import React, {useEffect, useRef, useState} from "react";

import store from '../app/store'
import {loadUserFromRails} from "../slices/userSlice";
import {loadCompanyFromRails} from "../slices/companySlice";
import {loadProperties} from "../slices/propertySlice";
import {loadDashboardFromRails} from "../slices/dashboardSlice";

function useDidMount() {
    const didMountRef = useRef(true);

    useEffect(() => {
        didMountRef.current = false;
    }, []);
    return didMountRef.current;
};


// Need a new name for this
// It may end up not being important enough for its own component
const InsightDashboardStore = ({railsData, mode}) => {

    const didMount = useDidMount();

    useEffect(() => {
        if(didMount) {
            console.log("Mounting InsightDashboardStore")

            store.dispatch(loadDashboardFromRails(railsData))
            store.dispatch(loadCompanyFromRails(railsData))
            store.dispatch(loadUserFromRails(railsData))
            store.dispatch(loadProperties())
            
        }

    }, [didMount])


    return (<div /> )
}

export default InsightDashboardStore;