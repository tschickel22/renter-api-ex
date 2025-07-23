import React, {useState} from 'react';
import Modal from "../../../shared/Modal";
import {useNavigate} from "react-router-dom";
import store from "../../../../app/store";
import {saveLease} from "../../../../slices/leaseSlice";
import insightRoutes from "../../../../app/insightRoutes";
import {displayAlertMessage} from "../../../../slices/dashboardSlice";
import {useSelector} from "react-redux";
import insightUtils from "../../../../app/insightUtils";

const ApplicationActionButton = ({lease, setLease, onEditLease, incompleteApplication}) => {
    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [actionToConfirm, setActionToConfirm] = useState(null)

    async function updateApplicationStatus(newApplicationStatus) {
        let leaseData = {hash_id: lease.hash_id, application_status: newApplicationStatus}
        if (newApplicationStatus == constants.lease_application_statuses.approved.key) leaseData.lease_action = constants.lease_actions.approve.key
        if (newApplicationStatus == constants.lease_application_statuses.declined.key) leaseData.lease_action = constants.lease_actions.decline.key

        const results = await store.dispatch(saveLease({lease: leaseData})).unwrap()
        console.log('updateApplicationStatus', results)

        if (results.data.lease) {
            await setLease(results.data.lease)
            return true
        }
        else {
            store.dispatch(displayAlertMessage({message: insightUtils.gatherErrors(results.data, "Could not update status")}))
            return false
        }
    }

    async function handleApproveApplication(goToGenerateLease) {
        const updateSuccessful = await updateApplicationStatus(constants.lease_application_statuses.approved.key)
        await setActionToConfirm(null)

        if (updateSuccessful) {
            if (goToGenerateLease) {
                navigate(insightRoutes.leaseEdit(lease.hash_id))
            }
            else {
                store.dispatch(displayAlertMessage({message: "Application approved."}))
            }
        }
    }

    async function handleDeclineApplication() {
        const updateSuccessful = await updateApplicationStatus(constants.lease_application_statuses.declined.key)
        await setActionToConfirm(null)

        if (updateSuccessful) {
            store.dispatch(displayAlertMessage({message: "Application declined."}))
        }
    }

    return (
        <>
            {constants.lease_application_statuses.declined.key == lease.application_status ?
                <a onClick={() => setActionToConfirm(constants.lease_application_statuses.approved.key)} className="btn btn-red">Approve Application</a>
                :
                <>
                    {constants.lease_application_statuses.approved.key == lease.application_status ?
                        <a onClick={() => setActionToConfirm(constants.lease_application_statuses.declined.key)} className="btn btn-red">Decline Application</a>
                        :
                        <div className="btn-dropdown">
                            <a className="btn btn-red">Approve / Deny<i className="fas fa-caret-down"/></a>
                            <ul>
                                <li><a onClick={() => setActionToConfirm(constants.lease_application_statuses.approved.key)}>Approve Application</a></li>
                                <li><a onClick={() => setActionToConfirm(constants.lease_application_statuses.declined.key)}>Decline Application</a></li>
                            </ul>
                        </div>
                    }
                </>
            }


            {actionToConfirm == constants.lease_application_statuses.approved.key && <Modal closeModal={() => setActionToConfirm(null)}>
                <h2>Approve Application</h2>
                {onEditLease ?
                    <>
                        <p className="text-center">Are you sure you want to approve this application{incompleteApplication && <>, <strong>all co-applicant applications are not complete</strong></>}?</p>
                        <div className="form-nav">
                            <div onClick={() => handleApproveApplication(false)} className="btn btn-red"><span>Yes</span></div>
                            <div onClick={() => setActionToConfirm(null)}  className="btn btn-gray"><span>Cancel</span></div>
                        </div>
                    </>
                    :
                    <>
                        <p className="text-center">Do you want to generate the lease now{incompleteApplication && <>, <strong>all co-applicant applications are not complete</strong></>}?</p>
                        <div className="form-nav">
                            <div onClick={() => handleApproveApplication(true)}  className="btn btn-red"><span>Yes, take me to generate the lease</span></div>
                            <div onClick={() => handleApproveApplication(false)} className="btn btn-gray"><span>No, I'll do it later</span></div>
                            <div onClick={() => setActionToConfirm(null)}  className="btn btn-gray"><span>Cancel</span></div>
                        </div>
                    </>

                }


            </Modal>}

            {actionToConfirm == constants.lease_application_statuses.declined.key && <Modal closeModal={() => setActionToConfirm(null)}>
                <h2>Decline Application</h2>
                <p className="text-center">Are you sure you want to decline this application{incompleteApplication && <>, <strong>all co-applicant applications are not complete</strong></>}?</p>

                <div className="form-nav">
                    <div onClick={() => handleDeclineApplication()}  className="btn btn-red"><span>Yes</span></div>
                    <div onClick={() => setActionToConfirm(null)} className="btn btn-gray"><span>No</span></div>
                </div>
            </Modal>}
        </>
    )}

export default ApplicationActionButton;

