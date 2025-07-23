import React from 'react';
import ScreeningBlockItem from "./ScreeningBlockItem";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const ScreeningBlock = ({lease}) => {
    return (
        <div className="flex-grid-item rd-screening-block">
            <h3>Screening</h3>
            <div className="flex-line-blockwrap">

                <ScreeningBlockItem leaseResident={lease.primary_resident}/>

                {lease.secondary_residents && lease.secondary_residents.length > 0 && <>
                    {lease.secondary_residents.map((secondaryResident, i) => (
                        <ScreeningBlockItem key={i} leaseResident={secondaryResident}/>
                    ))}
                </>}

                {lease.guarantors && lease.guarantors.length > 0 && <>
                    {lease.guarantors.map((guarantor, i) => (
                        <ScreeningBlockItem key={i} leaseResident={guarantor}/>
                    ))}
                </>}
            </div>

            <div className="spacer"></div>
        </div>
    )}

export default ScreeningBlock;

