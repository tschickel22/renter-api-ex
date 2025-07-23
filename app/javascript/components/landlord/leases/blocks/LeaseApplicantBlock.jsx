import React, {useState} from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";
import ScreeningBlockItem from "./ScreeningBlockItem";
import Modal from "../../../shared/Modal";
import store from "../../../../app/store";
import {deleteLeaseResident, loadLeaseResident, saveLeaseResident} from "../../../../slices/leaseResidentSlice";
import {loadLease} from "../../../../slices/leaseSlice";

const LeaseApplicantBlock = ({lease, leaseResident, setLease}) => {
    let navigate = useNavigate();
    const { constants } = useSelector((state) => state.company)

    const [baseErrors, setBaseErrors] = useState("")
    const [removingApplicant, setRemovingApplicant] = useState(false)

    function handleEditApplicant() {
        navigate(insightRoutes.residentEdit(lease.hash_id, leaseResident.hash_id))
    }

    function confirmRemoveApplicant() {
        setBaseErrors("")
        setRemovingApplicant(true)
    }

    async function handleRemoveApplicant() {
        const results = await store.dispatch(deleteLeaseResident({leaseResident: leaseResident})).unwrap();

        if (results.data.success) {
            const lease_results = await store.dispatch(loadLease({leaseId: lease.hash_id})).unwrap()

            if (lease_results.data.success) {
                setLease(lease_results.data.lease)
            }
            else {
                // Error!
                setBaseErrors("Unable to edit lease. Please try again.")
            }

            setRemovingApplicant(false)
        }
        else if (results.data.errors.base) {
            setBaseErrors(results.data.errors.base)
        }
    }

    return (
        <>
            <div className="flex-grid-item">
                {[constants.lease_statuses.lead.key, constants.lease_statuses.applicant.key, constants.lease_statuses.approved.key, constants.lease_statuses.renewing.key].indexOf(lease.status) >= 0 &&
                    <div className="flex-grid-item-actions">
                        <i onClick={handleEditApplicant} className="fal fa-edit"></i>
                        <i onClick={confirmRemoveApplicant} className="fal fa-trash"></i>
                    </div>
                }
                <div className="flex-line-resident-info">
                    <h3>{leaseResident.resident.first_name} {leaseResident.resident.last_name}</h3>
                </div>

                <div className="flex-line flex-resident-edit-info">
                    {insightUtils.getLabel(leaseResident.type, constants.lease_resident_types)}
                </div>

                <div className="rd-screening-block">
                    <ScreeningBlockItem leaseResident={leaseResident} hideTitle={true} />
                </div>

            </div>

            {removingApplicant &&
                <Modal closeModal={() => setRemovingApplicant(false)}>
                    <h2>Remove Applicant</h2>

                    {baseErrors && <div className="text-error text-center">{baseErrors}</div>}

                    <p className="text-center">Are you sure you want to remove {leaseResident.resident.first_name} {leaseResident.resident.last_name}?</p>

                    <div className="form-nav">
                        <div onClick={() => handleRemoveApplicant()}  className="btn btn-red"><span>Yes</span></div>
                        <div onClick={() => setRemovingApplicant(false)} className="btn btn-gray"><span>No</span></div>
                    </div>
                </Modal>
            }
        </>

    )}

export default LeaseApplicantBlock;

