import React, {useState} from 'react';

import BasicDropdown from "../../shared/BasicDropdown";
import StateDropdown from "../../shared/StateDropdown";
import CountryDropdown from "../../shared/CountryDropdown";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import AddPhotoBox from "../../shared/AddPhotoBox";
import {ErrorMessage} from "formik";

const ResidentIdentificationForm = ({leaseResident, currentSettings}) => {
    const { constants } = useSelector((state) => state.company)

    return (
        <>
            <h3>Your Identification</h3>

            <div className="form-row">
                <FormItem label="Identification Type" name="lease_resident.resident.id_type" optional={currentSettings.application_include_identification == "optional"}>
                    <BasicDropdown name={"lease_resident.resident.id_type"} options={constants.id_types}/>
                </FormItem>

                <FormItem label={leaseResident.resident.id_type == "passport" ? "Country Issued" : "State Issued"} name={"lease_resident.resident.id_issuer"}  optional={currentSettings.application_include_identification == "optional"}>
                    {leaseResident.resident.id_type == "passport" && <CountryDropdown name={"lease_resident.resident.id_issuer"} />}
                    {leaseResident.resident.id_type != "passport" && <StateDropdown name={"lease_resident.resident.id_issuer"} />}
                </FormItem>

                <FormItem label="Identification #" name={"lease_resident.resident.id_card_number"}  optional={currentSettings.application_include_identification == "optional"} />
            </div>

            {['copy', 'selfie'].indexOf(currentSettings.additional_identification_evidence) >= 0 && <div className="form-row">
                {currentSettings.additional_identification_evidence == "selfie" &&
                    <div className="form-item form-item-50">
                    <FormItem label="Photo Holding Identification Next to Face" formItemClass="form-item-100" name="lease_resident.resident.identification_selfie" optional={currentSettings.application_include_identification == "optional"}>
                        <AddPhotoBox apiPath={"/api/internal/residents/" + leaseResident.resident.hash_id} name="identification_selfie"
                                     header={<p style={{marginTop: 0}}>Upload a selfie with you holding your identification next to your face</p>}
                        />

                    </FormItem>
                    <div>
                        <label className="text-center">Example:</label>
                        <img src="/images/selfie-example.jpg" style={{maxWidth: "200px"}} />
                    </div>
                    </div>
                }

                <FormItem label="Copy of Identification" formItemClass="form-item-50" name="lease_resident.resident.identification_copy" optional={currentSettings.application_include_identification == "optional"}>
                    <AddPhotoBox apiPath={"/api/internal/residents/" + leaseResident.resident.hash_id} name="identification_copy"
                                 header={<p style={{marginTop: 0}}>Upload a copy of your identification</p>}
                    />
                </FormItem>
            </div>}

        </>

    )}

export default ResidentIdentificationForm;

