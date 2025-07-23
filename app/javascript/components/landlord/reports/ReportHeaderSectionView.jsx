import React, {useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import ReportCriteriaView from "./ReportCriteriaView";

const ReportHeaderSectionView = ({report, handleRerunReport, handleExportToCSV}) => {

    return (
        <>
            <h1>{report.title}</h1>

            {report.criteria_errors && <div className="text-error">{report.criteria_errors.join(", ")}</div>}

            <ReportCriteriaView report={report} handleRerunReport={handleRerunReport} handleExportToCSV={handleExportToCSV} />
        </>

    )}

export default ReportHeaderSectionView;

