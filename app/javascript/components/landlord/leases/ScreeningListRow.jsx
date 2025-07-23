import React, {createRef, useEffect, useRef, useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import ApplicationViewReportPage from "./ApplicationViewReportPage";


const ScreeningListRow = ({lease_resident}) => {

    const navigate = useNavigate()
    const [rowMenuOpen, setRowMenuOpen] = useState(false)
    const [reportRowOpen, setReportRowOpen] = useState(false)
    const [currentReportType, setCurrentReportType] = useState("Criminal")

    const { constants, properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => property.id == lease_resident.lease.property_id)
    const unit = ((property && property.units) || []).find((unit) => unit.id == lease_resident.lease.unit_id)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            {property &&
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-30 st-col-md-50 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        <div className="flex-column">
                            <Link to={insightRoutes.leaseShow(lease_resident.lease.hash_id)} state={{from: 'screenings'}}>
                                {lease_resident.resident.first_name} {lease_resident.resident.last_name} ({insightUtils.getLabel(lease_resident.current_step, constants.lease_resident_steps)})
                            </Link>
                        </div>
                    </div>
                    <span className="st-col-20 hidden-md">
                        {property.name}<br/>
                        {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                    </span>
                    <span className="st-col-20 st-col-md-50" title="Last Updated">
                        {insightUtils.formatDate(lease_resident.updated_at)}
                    </span>
                    <span className="st-col-15 hidden-md">
                        {insightUtils.getLabel(lease_resident.external_screening_status || "New", constants.external_screening_statuses)}
                    </span>
                    <span className="st-col-15 hidden-md">
                        {lease_resident.screening_package && lease_resident.screening_package.name}
                    </span>
                    <span className="st-nav-col">
                        <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            {lease_resident.lease &&
                                <>
                                    <li onClick={() => navigateAndClose(insightRoutes.leaseShow(lease_resident.lease.hash_id))}><i className="fal fa-pencil"></i> View Application</li>
                                    {[constants.lease_resident_steps.lead.key, constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.occupant_details.key, constants.lease_resident_steps.applicant_details.key].indexOf(lease_resident.current_step) >= 0 && <li onClick={()=> {setRowMenuOpen(false); insightUtils.resendInvitation(lease_resident.hash_id)}}><i className="fal fa-arrow-circle-up"></i> Resend Invitation</li>}
                                </>
                            }
                            {lease_resident.lease_resident_reports && lease_resident.lease_resident_reports.length > 0 &&
                                <li onClick={() => setReportRowOpen(true)}><i className="fal fa-pencil"></i> View Reports</li>
                            }
                        </RowMenu>
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
                                    {lease_resident.lease_resident_reports.map((leaseResidentReport, i) => (
                                        <div key={i} onClick={() => setCurrentReportType(leaseResidentReport.report_type)} className={"btn btn-gray btn-cr-credit " + (leaseResidentReport.report_type == currentReportType ? "active" : "")}><span>{leaseResidentReport.report_type}</span></div>
                                    ))}
                                </div>
                            </div>
                            <div onClick={() => setReportRowOpen(false)} className="btn-cr-close">
                                <span>Close</span>
                                <i className="fal fa-chevron-up"></i>
                            </div>
                        </div>

                        {lease_resident.lease_resident_reports.map((leaseResidentReport, i) => (
                            leaseResidentReport.report_type == currentReportType && <div key={i} className="cr-content" id="cr-content-credit">
                                <div className="cr-overview">
                                    <div className="cr-overview-title">{leaseResidentReport.report_type} Report for <strong>{lease_resident.resident.first_name} {lease_resident.resident.last_name}</strong></div>
                                    <div className="cr-overview-highlights">
                                        {lease_resident.credit_score && <div className="cr-credit-score">
                                            <div className="cs-rating-wrap">
                                                <div className="cs-number cr-large-number">{lease_resident.credit_score}</div>
                                                <div className={"cs-rating cs-rating-" + lease_resident.credit_level}></div>
                                            </div>
                                            <img className="credit-score-chart" src="/images/credit-score.svg" />
                                        </div>}
                                        <div className="cr-counts-wrap">
                                            {lease_resident.criminal_record_count != null && <div className="cr-counts cr-counts-criminal"><span className="cr-large-number">{lease_resident.criminal_record_count}</span>Criminal Counts</div>}
                                            <div className="h-divider"></div>
                                            <div className="v-divider"></div>
                                            {lease_resident.eviction_count != null && <div className="cr-counts cr-counts-eviction"><span className="cr-large-number">{lease_resident.eviction_count}</span>Eviction Counts</div>}
                                        </div>
                                    </div>
                                    <div className="cr-embed">
                                        <ApplicationViewReportPage leaseResidentId={lease_resident.hash_id} leaseResidentReportId={leaseResidentReport.hash_id} embedded={true} />
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

export default ScreeningListRow;

