import React from 'react'
import ReactDOM from 'react-dom'

import store from '../app/store'
import {Provider} from 'react-redux'
import {BrowserRouter as Router} from "react-router-dom";

import LandlordDashboard from "../components/LandlordDashboard";
import InsightDashboardStore from "../components/InsightDashboardStore";


document.addEventListener('DOMContentLoaded', () => {
    const node = document.getElementById('react-app')
    const data = JSON.parse(node.getAttribute('data'))

    ReactDOM.render(
        <React.StrictMode>
            <Router>
                <Provider store={store}>
                    <InsightDashboardStore mode="landlord" railsData={data} />
                    <LandlordDashboard />

                </Provider>
            </Router>
        </React.StrictMode>,
        node
    )
})
