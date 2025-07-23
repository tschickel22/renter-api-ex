import React from 'react'
import ReactDOM from 'react-dom'

import store from '../app/store'
import {Provider} from 'react-redux'
import {BrowserRouter as Router} from "react-router-dom";

import InsightDashboardStore from "../components/InsightDashboardStore";
import RenterPortal from "../components/RenterPortal";


document.addEventListener('DOMContentLoaded', () => {
    const node = document.getElementById('react-app')
    const data = JSON.parse(node.getAttribute('data'))

    ReactDOM.render(
        <React.StrictMode>
            <Router>
                <Provider store={store}>
                    <InsightDashboardStore mode="resident" railsData={data} />
                    <RenterPortal />

                </Provider>
            </Router>
        </React.StrictMode>,
        node
    )
})
