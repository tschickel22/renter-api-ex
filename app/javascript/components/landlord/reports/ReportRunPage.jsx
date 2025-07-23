import React, {useEffect, useState} from 'react';
import {useParams, useSearchParams} from "react-router-dom";
import {runReport} from "../../../slices/reportSlice";
import store from "../../../app/store";
import ReportDataTableSectionView from "./ReportDataTableSectionView";
import ReportHeaderSectionView from "./ReportHeaderSectionView";
import FinancialNav from "../financial/FinancialNav";
import ReportDataTableGroupedSectionView from "./ReportDataTableGroupedSectionView";
import ReportDataListSectionView from "./ReportDataListSectionView";

const ReportRunPage = ({}) => {
    let params = useParams();
    const [searchParams, setSearchParams] = useSearchParams()
    const [report, setReport] = useState(null)
    const [runFailed, setRunFailed] = useState(false)

    useEffect(async() => {
        const reportParams = Object.fromEntries([...searchParams])

        try {
            const results = await store.dispatch(runReport({reportId: params.reportId, reportParams: reportParams})).unwrap()
            console.log(results)
            setReport(results.data.report)
        }
        catch (e) {
            console.log("RUN FAILED:", e)
            setRunFailed(true)
        }

    }, [params.reportId])

    async function handleExportToCSV() {
        let reportParams = Object.fromEntries([...searchParams])

        // Call the server for the CSV
        const results = await store.dispatch(runReport({reportId: params.reportId, reportParams: reportParams, format: "csv"})).unwrap()

        // Now, have the browser download the data
        let blob = new Blob([results.data.csv], { "type": "text/csv;charset=utf8;" });
        let filename = "renter-insight-"+ params.reportId + '.csv';

        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        }
        else {
            const attachmentType = 'csv';
            let uri = 'data:attachment/'+ attachmentType +';charset=utf-8,' + encodeURI(results.data.csv);
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);

            link.setAttribute('visibility', 'hidden');
            link.download = filename

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    }

    async function handleRerunReport(newParams) {
        try {
                let reportParams = Object.fromEntries([...searchParams])
                reportParams = Object.assign(reportParams, newParams)
                setSearchParams(reportParams)

                const results = await store.dispatch(runReport({reportId: params.reportId, reportParams: reportParams})).unwrap()
                console.log(results)
                setReport(results.data.report)
        }
        catch (e) {
            console.log("RERUN FAILED:", e)
            setRunFailed(true)
        }
    }

    return (
        <>
            {!report ?
                <div className="section full-width-section">
                    {
                        !runFailed ?
                            <>Loading...</>
                            :
                            <div className="text-error">Uh-oh! We were unable to run this report.</div>
                    }

                </div>
                :
                <div className={"section full-width-section " + report.report_wrapper_class}>
                    {report.sections && report.sections.map((section, i) => (
                        <React.Fragment key={i}>
                            {section.hide_if_empty && (!section.data || Object.keys(section.data).length == 0) ?
                                <></>
                                :
                                <>
                                    {section.section_class == "FinancialNav" &&
                                    <>
                                        <div className="title-block hidden-print">
                                            <h1>{section.heading}</h1>
                                        </div>
                                        <FinancialNav />
                                    </>
                                    }
                                    {section.section_class == "HeaderSection" && <ReportHeaderSectionView key={i} report={report} handleRerunReport={handleRerunReport} handleExportToCSV={handleExportToCSV} />}
                                    {(section.section_class == "DataTableSection" || section.section_class == "DataTableAutoColumnsSection") && section.data &&
                                        (Array.isArray(section.data) ? <ReportDataTableSectionView key={i} section={section} /> : <ReportDataTableGroupedSectionView key={i} section={section} />)
                                    }
                                    {(section.section_class == "DataListSection") && section.data &&
                                        <ReportDataListSectionView key={i} section={section} />
                                    }
                                </>
                            }
                        </React.Fragment>
                    ))}
                </div>
            }

        </>

    )}

export default ReportRunPage;

