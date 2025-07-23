import React, {useState} from 'react';
import ReapplicationBlockItem from "./ReapplicationBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../../../app/insightRoutes";


const ReapplicationBlock = ({lease, setLease}) => {

    const { constants } = useSelector((state) => state.company)

    const [inSelectionMode, setInSelectionMode] = useState(false)
    const [selectedResidents, setSelectedResidents] = useState([])

    function handleGenerateNewApplication() {
        setInSelectionMode(false)
        alert('Coming soon...')
    }

    return (
        <>
            <div className="flex-grid-item">
                <h3>Applications</h3>
                <div className="flex-line-blockwrap">

                    <ReapplicationBlockItem leaseResident={lease.primary_resident} inSelectionMode={inSelectionMode} selectedResidents={selectedResidents} setSelectedResidents={setSelectedResidents} />

                    {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                        <h3>{insightUtils.getLabel("LeaseResidentSecondary", constants.lease_resident_types)}</h3>
                        {lease.secondary_residents.map((secondaryResident, i) => (
                            <ReapplicationBlockItem key={i} leaseResident={secondaryResident} inSelectionMode={inSelectionMode} selectedResidents={selectedResidents} setSelectedResidents={setSelectedResidents}/>
                        ))}
                    </>}
                </div>

                <div className="spacer"></div>
                <div className="form-nav">
                    {inSelectionMode && <>
                        <a onClick={() => (setInSelectionMode(false))} className="btn btn-bottom btn-gray">Cancel</a>
                        {selectedResidents.length > 0 && <a onClick={() => (handleGenerateNewApplication())} className="btn btn-bottom btn-red">Continue</a>}
                    </>}
                    {!inSelectionMode && <a onClick={() => (setInSelectionMode(true))} className="btn btn-bottom btn-red">Invite to Reapply</a>}
                </div>
            </div>
        </>
    )}

export default ReapplicationBlock;

