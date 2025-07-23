import React, {useState} from 'react';
import FinancialNav from "../financial/FinancialNav";
import ListPage from "../../shared/ListPage";
import store from "../../../app/store";

import {loadTaxReportings, submitTaxReportings} from "../../../slices/taxReportingSlice";
import TaxReportingRow from "./TaxReportingRow";
import {useSelector} from "react-redux";
import TaxReportingEnrollmentPage from "./TaxReportingEnrollmentPage";
import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import Modal from "../../shared/Modal";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";


const TaxReportingListPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    const [allTaxReportings, setAllTaxReportings] = useState([])
    const [selectedTaxReportingIds, setSelectedTaxReportingIds] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [redirectingToUrl, setRedirectingToUrl] = useState(null)
    const [reportYear, setReportYear] = useState(constants.tax_reporting_current_year)
    const [reloadTable, setReloadTable] = useState(0)

    async function runSearch(text) {
        const results = await store.dispatch(loadTaxReportings({reportYear: reportYear, searchText: text})).unwrap()

        // Update the selected transactions
        const newSelections = selectedTaxReportingIds.filter((id) => results.data.tax_reportings.find((txn) => txn.id == id))

        setSelectedTaxReportingIds(newSelections)

        setAllTaxReportings(results.data.tax_reportings)

        return {total: results.data.tax_reportings.length, objects: results.data.tax_reportings}
    }

    function generateTableRow(taxReporting, key) {
        return (<TaxReportingRow key={key} taxReporting={taxReporting} allowSelection={reportYear == constants.tax_reporting_current_year} selected={selectedTaxReportingIds} setSelected={setSelectedTaxReportingIds} />)
    }

    function handleSelectAllTaxReportings() {
        const allTaxReportingIds = allTaxReportings.map((t) => t.id)

        if (selectedTaxReportingIds.length < allTaxReportingIds.length) {
            setSelectedTaxReportingIds(allTaxReportingIds)
        }
        else {
            setSelectedTaxReportingIds([])
        }
    }

    async function handleSubmitTaxReportings() {
        setIsGenerating(true)
        const results = await store.dispatch(submitTaxReportings({taxReportingIds: selectedTaxReportingIds})).unwrap()
        console.log(results)

        if (results.data.errors && results.data.errors.length > 0) {
            let errorMessageData = {message: "Some errors occurred in generating the 1099s:<br/>" + results.data.errors.join(', ')}

            if (errorMessageData.message.includes("Incorrect Nelco Email")) {
                errorMessageData.linkText = "Update Nelco Credentials"
                errorMessageData.url = insightRoutes.companyEdit("my")
                errorMessageData.navigateState = {return_url: location.pathname}
            }

            store.dispatch(displayAlertMessage(errorMessageData))
        }
        else {
            const redirectingTaxReport = results.data.tax_reportings.find((txn) => txn.external_url)

            if (redirectingTaxReport) setRedirectingToUrl(redirectingTaxReport.external_url)
        }

        setIsGenerating(false)
        setReloadTable(reloadTable + 1)
    }

    function handleRedirect() {
        setRedirectingToUrl(null)
    }

    function handleYearChange(e) {
        setReportYear(e.target.value)
        setReloadTable(reloadTable + 1)
    }

    return (
        <>
            {currentCompany && currentCompany.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.pending.key && <TaxReportingEnrollmentPage />}
            {currentCompany && currentCompany.tax_reporting_onboard_status == constants.tax_reporting_onboard_statuses.completed.key && <ListPage
                title="1099 Reporting"
                titleImage={<img className="section-img" src="/images/1099-report.png"/>}
                nav={<FinancialNav/>}
                addButton={
                    <Formik initialValues={{year: constants.tax_reporting_current_year}}>
                        {({  }) => (
                            <Form>
                                <div className="st-nav">
                                    <div className="form-item">
                                        <BasicDropdown name="year" options={constants.tax_reporting_years.map((year) => ({id: year, name: `Tax Year ${year}`}))} onChange={(e) => handleYearChange(e)} blankText={false}/>
                                    </div>
                                    {reportYear == constants.tax_reporting_current_year && <>
                                        &nbsp;&nbsp;
                                        <a onClick={() => handleSubmitTaxReportings()} className={(selectedTaxReportingIds.length == 0 || isGenerating) ? "btn btn-gray btn-sm" : "btn btn-red btn-sm"}><span>{isGenerating ? <>Generating...</> : <>Generate {selectedTaxReportingIds.length <= 1 ? "1099" : "1099's"} <i className="fas fa-plus"></i></>}</span></a>
                                    </>}
                                </div>
                            </Form>
                        )}
                    </Formik>
                }
                runSearch={runSearch}
                reloadWhenChanges={reloadTable}
                hideNavCol={true}
                noDataMessage={"You have no owners or vendors to report on"}
                columns={
                    [
                        {label: "Type", class: "st-col-15", sort_by: "related_object_type", selectAll: reportYear == constants.tax_reporting_current_year ? handleSelectAllTaxReportings : null},
                        {label: "Name", class: "st-col-15", sort_by: "name"},
                        {label: "Paid", class: "st-col-15 text-right", sort_by: "amount_paid", data_type: "float"},
                        {label: "Rental Income", class: "st-col-15 text-right", sort_by: "rental_income", data_type: "float"},
                        {label: "Other Income", class: "st-col-15 text-right", sort_by: "other_income", data_type: "float"},
                        {label: "Total", class: "st-col-15 text-right", sort_by: "total", data_type: "float"},
                        {label: "Status", class: "st-col-15 text-center", sort_by: "status_pretty"},
                    ]
                }
                allSelected={selectedTaxReportingIds.length > 0 && selectedTaxReportingIds.length == allTaxReportings.length}
                generateTableRow={generateTableRow}
                afterTableContent={<>
                    <p text="text-muted">Some payments do not have to be reported. General exclusions include, merchandise or payments to a corporation (including a limited liability company (LLC) that is treated as a C or S. corporation).  See <a href="https://www.irs.gov/pub/irs-pdf/i1099mec.pdf" target="_blank">IRS</a> for more info.</p>
                </>}
            />}

            {redirectingToUrl && <Modal>
                <h2>1099 Generated</h2>

                <p className="text-center">To complete the process, you will be redirected to NELCO.</p>

                <div className="form-nav">
                    <a href={redirectingToUrl} onClick={() => handleRedirect()} className="btn btn-red" target="_blank"><span>Proceed to NELCO</span></a>
                </div>

            </Modal>}
        </>

    )
}


export default TaxReportingListPage;

