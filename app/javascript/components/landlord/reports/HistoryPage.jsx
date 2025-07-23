import React, {useEffect, useMemo, useState} from 'react';
import {useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {loadLease} from "../../../slices/leaseSlice";
import {loadCompany, loadHistories} from "../../../slices/companySlice";
import ListPage from "../../shared/ListPage";
import HistoryRow from "../../shared/HistoryRow";
import {Form, Formik} from "formik";
import ToggleSwitch from "../../shared/ToggleSwitch";
import CriteriaDateRange from "../reports/CriteriaDateRange";
import CompanyNav from "../companies/CompanyNav";
import StatusBlock from "../leases/blocks/StatusBlock";
import LeaseNav from "../leases/LeaseNav";
import PropertyNav from "../companies/PropertyNav";

const HistoryPage = ({mode}) => {
    let params = useParams();
    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

    const [lease, setLease] = useState(null)
    const [property, setProperty] = useState(null)
    const [company, setCompany] = useState(null)

    const [baseErrors, setBaseErrors] = useState(null)

    const [showSystemChanges, setShowSystemChanges] = useState(false)
    const [startDate, setStartDate] = useState(insightUtils.last30DaysRange.startDate)
    const [endDate, setEndDate] = useState(insightUtils.last30DaysRange.endDate)

    async function ensureSubject() {

        if (mode == "lease") {
            /*
               Load Lease
             */
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            if (results.data.success) {
                setLease(results.data.lease)
            }
            else {
                setBaseErrors("Unable to load lease.")
            }
        }
        else if (mode == "company") {
            /*
               Load Company
             */
            const results = await store.dispatch(loadCompany({companyId: params.companyId || "my"})).unwrap()

            if (results.data.success) {
                setCompany(results.data.company)
            }
            else {
                setBaseErrors("Unable to load company.")
            }
        }
        else if (mode == "property") {
            setProperty(insightUtils.getCurrentProperty(properties, params))
        }
    }

    useEffect(() => {
        ensureSubject()
    }, [properties, mode]);

    async function runSearch(text, page) {
        let searchParams = {mode: mode, includeSystemChanges: showSystemChanges, startDate: startDate, endDate: endDate}

        if (mode == "lease") {
            searchParams = {...searchParams, leaseId: params.leaseId}
        }
        else if (mode == "company") {
            searchParams = {...searchParams, companyId: params.companyId || "my"}
        }
        else if (mode == "property") {
            searchParams = {...searchParams, propertyId: params.propertyId}
        }

        const results = await store.dispatch(loadHistories(searchParams)).unwrap()
        return {total: results.data.histories.length, objects: results.data.histories}
    }

    function generateTableRow(historyItem, key) {
        return (<HistoryRow key={key} historyItem={historyItem} />)
    }

    function handleDateRangeChange(reportParams) {
        setStartDate(insightUtils.parseDate(reportParams.start_date))
        setEndDate(insightUtils.parseDate(reportParams.end_date))
    }

    const reloadWhenChanges = useMemo(() => {
        return [startDate, endDate, showSystemChanges];
    }, [startDate, endDate, showSystemChanges]);

    return (
        <>

            <div className="section">

                {baseErrors && <div className="text-error">{baseErrors}</div>}

                {lease && <>
                    <StatusBlock lease={lease} title="Lease Change History" />
                    <LeaseNav lease={lease} />
                </>}

                {(lease || property || company) && currentUser.reports_view && <>
                    <ListPage
                        title={mode == "lease" ? "" : mode == "property" ? "History" : company?.name}
                        subTitle={mode == "company" ? "Change History" : null}
                        titleImage={mode == "company" && !params.companyId ? <img className="section-img" src="/images/photo-properties.jpg" /> : mode == "property" ? <img className="section-img" src="/images/photo-units.jpg" /> : <></>}
                        runSearch={runSearch}
                        hideSearch={true}
                        nav={mode == "company" && !params.companyId ? <CompanyNav /> : mode == "property" ? <PropertyNav property={property} /> : <></>}
                        secondaryNav={<>
                            <div className="smallspacer"></div>

                            <Formik initialValues={{show_system: showSystemChanges}}>
                                {({  }) => (
                                    <Form>
                                        <div className="st-nav">
                                            <ToggleSwitch label="Show System Changes?" name="show_system" onChange={(e) => setShowSystemChanges(e)} />
                                            <CriteriaDateRange report={{params: {start_date: startDate, end_date: endDate}}} handleRerunReport={handleDateRangeChange} />
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </>
                        }
                        columns={[
                            {label: "Data", class: "st-col-25 hidden-md", sort_by: "title"},
                            {label: "Changes", class: "st-col-50 st-col-md-75", sort_by: "changes_html"},
                            {label: "Date", class: "st-col-10", sort_by: "updated_at"},
                            {label: "User", class: "st-col-15", sort_by: "user_full_name"},
                        ]}
                        defaultSortBy="updated_at"
                        defaultSortDir="desc"
                        reloadWhenChanges={reloadWhenChanges}
                        generateTableRow={generateTableRow}
                    />

                </>}

            </div>

        </>

    )}

export default HistoryPage;

