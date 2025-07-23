import React, {useState} from 'react';

import {useNavigate} from "react-router-dom";
import insightUtils from "../../app/insightUtils";
import {useSelector} from "react-redux";
import ApplicationViewReportPage from "../landlord/leases/ApplicationViewReportPage";

const ApplicationListRow = ({leaseResident, handleRequestFullAccess}) => {

    const [reportRowOpen, setReportRowOpen] = useState(false)
    const [currentReportType, setCurrentReportType] = useState("Criminal")

    const { constants, properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => property.id == leaseResident.lease.property_id)
    const unit = ((property && property.units) || []).find((unit) => unit.id == leaseResident.lease.unit_id)

    return (
        <>
            {property &&
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-col-md-50 st-first-col">
                        <div className="flex-column">
                            {property.name}
                        </div>
                    </div>
                    <span className="st-col-15 hidden-md">
                        {leaseResident.credit_score}
                    </span>
                    <span className="st-col-20 hidden-md">
                        {insightUtils.getLabel(leaseResident.external_screening_status || "New", constants.external_screening_statuses)}
                    </span>
                    <span className="st-col-20 st-col-md-50" title="Date Requested">
                        {insightUtils.formatDate(leaseResident.invitation_sent_at)}
                    </span>
                    <span className="st-col-20">
                        {leaseResident.lease_resident_reports && leaseResident.lease_resident_reports.length > 0 ?
                            <a onClick={() => setReportRowOpen(true)}><i className="fal fa-pencil"></i> View Reports</a>
                            :
                            (
                                leaseResident.lease.status == constants.lease_statuses.future.key && !leaseResident.lease.lease_start_on ?
                                    <a onClick={(e) => handleRequestFullAccess(e)}><i className="fal fa-pencil"></i> Request Access</a>
                                    :
                                    <em>None</em>
                            )
                        }
                    </span>
                </div>

                {reportRowOpen &&
                <div className="st-cust-report">
                    <div className="cr-nav">
                        <div className="btn-cr-print">
                            {false && <i className="fal fa-print"></i>}
                            {false && <span>Print<br/>Report</span>}
                        </div>
                        <div className="cr-nav-center">
                            <span className="cr-nav-title">View a Report</span>
                            <div>
                                {leaseResident.lease_resident_reports.map((leaseResidentReport, i) => (
                                    <div key={i} onClick={() => setCurrentReportType(leaseResidentReport.report_type)} className={"btn btn-gray btn-cr-credit " + (leaseResidentReport.report_type == currentReportType ? "active" : "")}><span>{leaseResidentReport.report_type}</span></div>
                                ))}
                            </div>
                        </div>
                        <div onClick={() => setReportRowOpen(false)} className="btn-cr-close">
                            <span>Close</span>
                            <i className="fal fa-chevron-up"></i>
                        </div>
                    </div>

                    {leaseResident.lease_resident_reports.map((leaseResidentReport, i) => (
                        leaseResidentReport.report_type == currentReportType && <div key={i} className="cr-content" id="cr-content-credit">
                            <div className="cr-overview">
                                <div className="cr-overview-title">{leaseResidentReport.report_type} Report for <strong>{leaseResident.resident.first_name} {leaseResident.resident.last_name}</strong></div>
                                <div className="cr-overview-highlights">
                                    {leaseResident.credit_score && <div className="cr-credit-score">
                                        <div className="cs-rating-wrap">
                                            <div className="cs-number cr-large-number">{leaseResident.credit_score}</div>
                                            <div className={"cs-rating cs-rating-" + leaseResident.credit_level}></div>
                                        </div>
                                        <img className="credit-score-chart" src="/images/credit-score.svg" />
                                    </div>}
                                    <div className="cr-counts-wrap">
                                        {leaseResident.criminal_record_count != null && <div className="cr-counts cr-counts-criminal"><span className="cr-large-number">{leaseResident.criminal_record_count}</span>Criminal Counts</div>}
                                        <div className="h-divider"></div>
                                        <div className="v-divider"></div>
                                        {leaseResident.eviction_count != null && <div className="cr-counts cr-counts-eviction"><span className="cr-large-number">{leaseResident.eviction_count}</span>Eviction Counts</div>}
                                    </div>
                                </div>
                                <div className="cr-embed">
                                    <ApplicationViewReportPage leaseResidentId={leaseResident.hash_id} leaseResidentReportId={leaseResidentReport.hash_id} embedded={true} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                }
            </div>
            }
        </>

    )}

export default ApplicationListRow;

