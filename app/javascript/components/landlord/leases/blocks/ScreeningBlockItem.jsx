import React, {useEffect, useState} from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";

const ScreeningBlockItem = ({leaseResident, hideTitle}) => {

    const { constants } = useSelector((state) => state.company)
    const { alertMessage } = useSelector((state) => state.dashboard)
    const [scoreGraphicOpen, setScoreGraphicOpen] = useState(false)
    const [needRefresh, setNeedRefresh] = useState(false)

    useEffect(() => {
        if (needRefresh && alertMessage.length == 0) {
            // Easiest way... just refresh the page
            document.location.href = document.location.href
        }
    }, [alertMessage, needRefresh])

    async function handleReopenApplication() {
        if (await insightUtils.reopenApplication(leaseResident.hash_id)) {
            setNeedRefresh(true)
        }
    }

    return (
        <>
            {leaseResident && leaseResident.lease_resident_reports && leaseResident.lease_resident_reports.length > 0 &&
            <div className="flex-line-block flex-line-resident">
                <div className="flex-line-resident-info flex-line-resident-info-no-actions">
                    {!hideTitle && <div className="flex-line flex-resident-name">
                        {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                    </div>}
                    {leaseResident.lease_resident_reports.map((leaseResidentReport, i) => (
                        <React.Fragment key={i}><Link to={insightRoutes.applicationViewReport(leaseResident.hash_id, leaseResidentReport.hash_id)}><i className="fal fa-eye btn-rd-edit-resident"></i> {leaseResidentReport.report_type}</Link><br/></React.Fragment>
                    ))}
                    {leaseResident.credit_score > 0 &&
                    <><a onClick={() => setScoreGraphicOpen(!scoreGraphicOpen)} onMouseOver={() => setScoreGraphicOpen(true)} onMouseOut={() => setScoreGraphicOpen(false)}><i className="fal fa-eye btn-rd-edit-resident"></i> Score: <span className="cs-rating-wrap"><span className="cs-number cr-large-number">{leaseResident.credit_score}</span><span className={"cs-rating cs-rating-" + leaseResident.credit_level}></span></span></a><br/>
                        <div onClick={() => setScoreGraphicOpen(false)} className={"credit-score-chart-tooltip " + (scoreGraphicOpen && "active")}>
                            <img className="credit-score-chart" src="/images/credit-score.svg" />
                        </div>
                    </>}
                </div>
            </div>
            }
            {leaseResident && leaseResident.external_screening_status == constants.external_screening_statuses.InternalScreeningSkipped.key &&
            <div className="flex-line-block flex-line-resident">
                <div className="flex-line-resident-info flex-line-resident-info-no-actions">
                    <div className="flex-line flex-resident-name">
                        {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                    </div>

                    Screening Skipped (No SSN)
                    <br/>
                    <a onClick={() => handleReopenApplication()}>Reopen Application</a>
                </div>
            </div>
            }
        </>
    )}

export default ScreeningBlockItem;

