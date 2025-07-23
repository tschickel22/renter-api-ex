
import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import FormItem from "../../shared/FormItem";
import StateDropdown from "../../shared/StateDropdown";
import insightUtils from "../../../app/insightUtils";
import {useFormikContext} from "formik";

const LeaseIntentionsRow = ({residentType, lease, leaseResident}) => {

    const formikProps = useFormikContext()

    const { settings, constants } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [moveOutIntention, setMoveOutIntention] = useState(null)

    useEffect(async () => {
        if (settings) {
            setCurrentSettings(insightUtils.getSettings(settings, lease.property_id))
        }
    }, [settings])

    useEffect(() => {
        if (lease.move_out_step == constants.lease_move_out_steps.collect_all_addresses.key) {
            setMoveOutIntention(constants.lease_resident_move_out_intentions.move_out.key)
        }
        else {
            setMoveOutIntention(insightUtils.getValue(formikProps.values, residentType + ".move_out_intention"))
        }
    }, [])

    return (
        <>
        {lease.move_out_step == constants.lease_move_out_steps.collect_all_addresses.key ?
            <></>
            :
                <div className="form-row">
                    <div className="form-item form-item-25 text-left">
                        {leaseResident.resident.name}
                    </div>

                    <FormItem label="" name={residentType + ".move_out_intention"} formItemClass="form-item-25">
                        <RadioButtonGroup name={residentType + ".move_out_intention"} options={[{id: constants.lease_resident_move_out_intentions.renew.key, name: "Renew Lease"}, {id: constants.lease_resident_move_out_intentions.move_out.key, name: "Move-out"}]} direction="row" handleOptionChange={(newIntention) => {setMoveOutIntention(newIntention)}} />
                    </FormItem>

                </div>
            }

            {moveOutIntention == constants.lease_resident_move_out_intentions.move_out.key &&
                <>
                    <p>Enter a forwarding address for {leaseResident.resident.name}</p>
                    <div className="form-row">
                        <FormItem label="Forwarding Address" name={residentType + ".forwarding_street"} optional={insightUtils.isResident(currentUser) || !currentSettings.forwarding_addresses_required} />
                        <FormItem label="City" name={residentType + ".forwarding_city"} optional={insightUtils.isResident(currentUser) || !currentSettings.forwarding_addresses_required} />
                        <FormItem label="State" name={residentType + ".forwarding_state"} optional={insightUtils.isResident(currentUser) || !currentSettings.forwarding_addresses_required}>
                            <StateDropdown name={residentType + ".forwarding_state"}/>
                        </FormItem>
                        <FormItem label="Zip" name={residentType + ".forwarding_zip"} mask={insightUtils.zipMask()} optional={insightUtils.isResident(currentUser) || !currentSettings.forwarding_addresses_required} />
                    </div>
                    <hr/>
                </>
            }
            <div style={{borderTop: '1px solid lightgray'}}>
                &nbsp;
            </div>
        </>

    )}

export default LeaseIntentionsRow;

