import React, {useEffect, useState} from "react";
import store from "../../../app/store";
import ListPage from "../../shared/ListPage";
import {loadCreditReportingActivities, loadResident} from "../../../slices/residentSlice";
import CreditReportingActivityListRow from "./CreditReportingActivityListRow";
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";

const CreditReportingActivityListPage = ({}) => {
    const navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [resident, setResident] = useState(null)

    useEffect(async() => {
        if (!resident) {
            const results = await store.dispatch(loadResident({residentId: "my"})).unwrap()
            setResident(results.data.resident)
        }
    }, []);

    async function runSearch(text) {
        if (resident) {
            const results = await store.dispatch(loadCreditReportingActivities({residentId: resident.hash_id})).unwrap()

            return {total: results.data.credit_reporting_breakdown.length, objects: results.data.credit_reporting_breakdown}
        }
    }

    function generateTableRow(creditReportingYear, key) {
        return (<CreditReportingActivityListRow key={key} creditReportingYear={creditReportingYear} />)
    }

    return (
        <>
            <ListPage
                title="Congratulations!"
                subTitle="You're Building Your Credit"
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg"/>}
                runSearch={runSearch}
                hideSearch={true}
                reloadWhenChanges={resident}
                noDataMessage={"You have no reporting history"}
                columns={[
                    {label: "", class: "st-col-10"},
                    {label: "Jan", class: "st-col-10"},
                    {label: "Feb", class: "st-col-10"},
                    {label: "Mar", class: "st-col-10"},
                    {label: "Apr", class: "st-col-10"},
                    {label: "May", class: "st-col-10"},
                    {label: "Jun", class: "st-col-10"},
                    {label: "Jul", class: "st-col-10"},
                    {label: "Aug", class: "st-col-10"},
                    {label: "Sep", class: "st-col-10"},
                    {label: "Oct", class: "st-col-10"},
                    {label: "Nov", class: "st-col-10"},
                    {label: "Dec", class: "st-col-10"}

                ]}
                generateTableRow={generateTableRow}
            />

            <div className="form-row">
                <div className="st-col-100">
                    <div className="form-nav">
                        <a className="btn btn-gray" href={constants.env.zoho_sso_url} target="_blank">Unsubscribe</a>
                        <a className="btn btn-red" onClick={() => navigate(insightRoutes.renterPortal())}>Back</a>
                    </div>
                    <div className="text-muted">Subscription will auto-cancel at move-out.</div>
                </div>
            </div>
        </>

    )
}

export default CreditReportingActivityListPage;

