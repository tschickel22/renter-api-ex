import React from 'react';
import CriteriaDateRange from "./CriteriaDateRange";
import CriteriaProperty from "./CriteriaProperty";
import CriteriaAccountingMethod from "./CriteriaAccountingMethod";
import CriteriaDatePicker from "./CriteriaDatePicker";
import CriteriaGroupByMethod from "./CriteriaGroupByMethod";
import CriteriaAccountReconciliation from "./CriteriaAccountReconciliation";
import CriteriaUnitStatus from "./CriteriaUnitStatus";
import CriteriaVendor from "./CriteriaVendor";
import CriteriaPropertyOwner from "./CriteriaPropertyOwner";

const ReportCriteriaView = ({report, handleRerunReport, handleExportToCSV}) => {

    return (
        <div className="flex-row flex-space-between">
            <div className="hidden-print flex-row">
                <a className="btn btn-small btn-red" onClick={() => window.print()}>&nbsp;Print <i className="fa fa-print"></i></a>
                &nbsp;
                <a className="btn btn-small btn-red" onClick={() => handleExportToCSV()}>&nbsp;Export <i className="fa fa-file-export"></i></a>
            </div>
            <div className="hidden-print">
            </div>
            <div className="report-criteria flex-row">
                {report.criteria && report.criteria.map((criterion, i) =>
                    (<React.Fragment key={i}>
                        {criterion.id == "CriteriaProperty" && <CriteriaProperty handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaAccountReconciliation" && <CriteriaAccountReconciliation handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaDateRange" && <CriteriaDateRange report={report} handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaDatePicker" && <CriteriaDatePicker report={report} handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaAccountingMethod" && <CriteriaAccountingMethod handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaGroupByMethod" && <CriteriaGroupByMethod handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaUnitStatus" && <CriteriaUnitStatus handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaVendor" && <CriteriaVendor handleRerunReport={handleRerunReport} />}
                        {criterion.id == "CriteriaPropertyOwner" && <CriteriaPropertyOwner handleRerunReport={handleRerunReport} />}

                    </React.Fragment>)
                )}
            </div>
        </div>

    )}

export default ReportCriteriaView;

