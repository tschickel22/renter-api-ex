import React from 'react';

import store from "../../../../app/store";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";
import {getFinancialSummary} from "../../../../slices/financialSlice";
import insightUtils from "../../../../app/insightUtils";
import DashboardListTile from "../DashboardListTile";
import {useSelector} from "react-redux";

const DashboardOutstandingBalances = ({}) => {

    const { constants } = useSelector((state) => state.company)

    async function runSearch(text) {
        const results = await store.dispatch(getFinancialSummary({})).unwrap()
        let pastDueLeases = results.data.summaries.filter((leaseSummary) => leaseSummary.past_amount > 0 && leaseSummary.lease_status == constants.lease_statuses.current.key)

        pastDueLeases = pastDueLeases.sort((a, b) => {
            let valA = parseInt(a.past_amount)
            let valB = parseInt(b.past_amount)

            return (valA > valB ? -1 : 1)
        })

        return {total: pastDueLeases.length, objects: pastDueLeases}
    }

    function generateTableRow(summaryRow, key) {
        return (
            <div className="st-row-wrap" key={key}>
                <div className="st-row">
                    <div className="st-col-50 st-long-text">
                        <Link to={insightRoutes.leaseShow(summaryRow.lease_hash_id)}>{summaryRow.resident_first_name} {summaryRow.resident_last_name}</Link>
                    </div>
                    <div className="st-col-20 st-long-text">
                        {summaryRow.unit_number}
                    </div>
                    <div className="st-col-30 text-right">
                        {insightUtils.numberToCurrency(summaryRow.past_amount)}
                    </div>
                </div>
            </div>)
    }

    return (
        <>
            <DashboardListTile
                icon={<i className="fal fa-dollar-circle"/>}
                title="Outstanding Balances"
                nav={<div className="flex-row" style={{gap: 0}}>
                    <div className="st-col-100 negative"></div>
                </div>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                columns={[
                    {label: "Name", class: "st-col-50"},
                    {label: "Unit", class: "st-col-20"},
                    {label: "Past Due", class: "st-col-30 text-right"},
                ]}
                viewAllPath={insightRoutes.reportRun('aging') + "?aging_detail_sort_by=total_due&aging_detail_sort_dir=desc"}
            />
        </>

    )}

export default DashboardOutstandingBalances;

