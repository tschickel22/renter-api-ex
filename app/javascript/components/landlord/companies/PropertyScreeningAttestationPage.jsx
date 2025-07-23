import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";

import store from "../../../app/store";
import {activatePropertyForScreening, loadProperties, loadScreeningAttestations, saveProperty, saveScreeningAttestations} from "../../../slices/propertySlice";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import PropertyTypeDropdown from "./PropertyTypeDropdown";
import FormItem from "../../shared/FormItem";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const PropertyScreeningAttestationPage = ({}) => {
    let navigate = useNavigate();
    let location = useLocation()
    let params = useParams();

    const {  properties } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [property, setProperty] = useState(null)
    const [attestationData, setAttestationData] = useState(null)

    useEffect(async() => {

        if (properties && !attestationData) {
            let newProperty = null

            if (parseInt(params.propertyId) > 0) {
                newProperty = (properties || []).find((property) => property.id == parseInt(params.propertyId))
            }

            setProperty(newProperty)

            // Do we need to activate first?
            if (!newProperty.external_screening_id) {
                const results = await store.dispatch(activatePropertyForScreening({property: newProperty})).unwrap()

                if (results.data.success) {
                    // Nothing to do... carry on
                }
                else {
                    if (results.data.errors.base) {
                        store.dispatch(displayAlertMessage({message: results.data.errors.base}))
                        return
                    }
                    else {
                        store.dispatch(displayAlertMessage({message: "Unable to activate "+newProperty.name}))
                        return
                    }
                }
            }

            const results = await store.dispatch(loadScreeningAttestations({propertyId: params.propertyId})).unwrap()
            const response = results.data

            setAttestationData(response.attestation_data)

            // Loading the screening attestation for a property can automatically save them if there's nothing to do
            // In this case, just reload the properties now
            if (response.attestation_data && response.attestation_data.attestations && response.attestation_data.attestations.length == 0) {
                store.dispatch(loadProperties())
            }
        }
    }, [properties, attestationData])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        let attestationAnswers = {}
        attestationData.attestations.forEach((attestation) => {
            if (values[`attestation_${attestation.attestationId}`] == true) {
                attestationAnswers[attestation.attestationId] = values[`attestation_${attestation.attestationId}`]
            }
        })

        if (attestationData.attestations.length > Object.keys(attestationAnswers).length) {
            setBaseErrorMessage("You must confirm all attestations")
        }
        else {
            try {

                const results = await store.dispatch(saveScreeningAttestations({propertyId: params.propertyId, attestationData: attestationData, attestationAnswers: attestationAnswers})).unwrap()
                const response = results.data
                console.log(response)

                setSubmitting(false);

                if (response.success) {
                    store.dispatch(loadProperties())
                    closeView()
                }
                else if (response.errors) {
                    setErrors(response.errors)

                    if (response.errors.base) {
                        setBaseErrorMessage([response.errors.base].flat().join(", "))
                    }

                    insightUtils.scrollTo('errors')
                }

            } catch (err) {
                // Error!
                setBaseErrorMessage("Unable to save attestations")
                setSubmitting(false);
            }
        }
    }

    function closeView() {
        insightUtils.handleBackNavigation(insightRoutes.propertyList(), location, navigate)
    }

    return (
        <>
        {properties && property &&
        <div className="section">

            <h2>Attestations for {property.name}</h2>
            <p className="text-center">Use this form to complete the screening attestations for a property.</p>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            {!attestationData ? <>Loading Attestation Questions...</> :

            <Formik
                initialValues={attestationData}
                onSubmit={handleFormikSubmit}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="add-property-wrap">

                            {(!attestationData.attestations || attestationData.attestations.length == 0) ? <>
                                No further action is necessary.

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray"><span>Back</span></a>
                                </div>
                            </>:
                            <>

                                {attestationData.attestations.map((attestation, i) => {
                                    return (<div key={i}>
                                        <h4>{attestation.name}</h4>
                                        <FormItem name={`attestation_${attestation.attestationId}`} label={attestation.legalText} type="checkbox" optional={true} />
                                    </div>)
                                })}

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray"><span>Cancel</span></a>

                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        {!isSubmitting && <span>Save</span>}
                                        {isSubmitting && <span>Saving...</span>}
                                    </button>
                                </div>
                            </>}
                        </div>
                    </Form>
                )}
            </Formik>
            }
        </div>
        }

        </>
    )}

export default PropertyScreeningAttestationPage;

