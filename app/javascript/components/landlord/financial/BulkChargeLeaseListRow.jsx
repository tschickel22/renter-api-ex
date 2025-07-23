import React from 'react';
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";


const BulkChargeLeaseListRow = ({leaseResident, bulkCharge, bulkChargeLease, selected, setSelected}) => {

    const lease = leaseResident?.lease || bulkChargeLease.lease
    const { properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => (property.id == lease?.property_id))
    const unit = lease ? ((property && property.units) || []).find((unit) => unit.id == lease.unit_id) : null

    function toggleSelection(id) {
        let newSelected = [...selected]

        if (newSelected.indexOf(id) >= 0) {
            newSelected.splice( newSelected.indexOf(id), 1 )
        }
        else {
            newSelected.push(id)
        }

        setSelected(newSelected)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    {leaseResident ?
                        <>
                            <div className="st-col-15 st-first-col">
                                {setSelected &&
                                    <i className={"fa-square btn-checkbox " + (selected.indexOf(leaseResident.hash_id) >= 0 ? "fas active" : "fal")} onClick={() => toggleSelection(leaseResident.hash_id)}></i>
                                }
                                {leaseResident?.resident && <>{leaseResident.resident.name}</>}
                            </div>
                            <span className="st-col-25">
                                {property && property.name}<br/>
                                {unit && <>{unit.unit_number ? unit.street : ""}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                            </span>
                            <span className="st-col-10">
                                {unit && <>{unit.unit_number ? unit.unit_number : unit.street}</>}
                            </span>
                        </> :
                        <>
                            <div className="st-col-15 st-first-col">
                                {setSelected &&
                                    <i className={"fa-square btn-checkbox " + (selected.indexOf(bulkChargeLease.id || bulkChargeLease.selection_id) >= 0 ? "fas active" : "fal")} onClick={() => toggleSelection(bulkChargeLease.id || bulkChargeLease.selection_id)}></i>
                                }
                                {bulkChargeLease.resident?.name}
                            </div>
                            <span className="st-col-25">
                                {property && property.name}<br/>
                                {unit && <>{unit.unit_number ? unit.street : ""}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                            </span>
                            <span className="st-col-10">
                                {unit && <>{unit.unit_number ? unit.unit_number : unit.street}</>}
                            </span>
                            {!bulkCharge.same_for_all &&
                                <span className="st-col-25">
                                    <FormItem name={"bulk_charge_leases.s" + (bulkChargeLease.id || bulkChargeLease.selection_id) + ".amount"} mask={insightUtils.currencyMask()}/>
                                </span>
                            }
                            {!bulkCharge.same_for_all &&
                                <span className="st-col-25">
                                    <FormItem name={"bulk_charge_leases.s" + (bulkChargeLease.id || bulkChargeLease.selection_id) + ".description"}/>
                                </span>
                            }
                        </>
                    }
                    <span className="st-nav-col">

                    </span>
                </div>
            </div>

        </>

    )
}

export default BulkChargeLeaseListRow;

