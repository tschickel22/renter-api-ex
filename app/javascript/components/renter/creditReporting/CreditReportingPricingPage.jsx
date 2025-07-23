import React, {useState, useEffect} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {saveCompany} from "../../../slices/companySlice";
import Modal from "../../shared/Modal";
import {upgradeUserSubscription} from "../../../slices/userSlice";
import {loadResident, saveResident} from "../../../slices/residentSlice";
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";
import {Form, Formik} from "formik";


const CreditReportingPricingPage = ({}) => {
    const navigate = useNavigate()

    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [urlAdditions, setUrlAdditions] = useState([])
    const [resident, setResident] = useState(null)
    const [residentForForm, setResidentForForm] = useState(null)

    useEffect(async() => {

        const results = await store.dispatch(loadResident({residentId: "my"})).unwrap()
        let newResidentForForm = {
            hash_id: results.data.resident.hash_id,
            tax_id: results.data.resident.tax_id,
            date_of_birth: results.data.resident.date_of_birth
        }

        setResidentForForm(newResidentForForm)
        setResident(results.data.resident)

        // The Product (CB001) comes from the encrypted credentials
        let newUrlAdditions = ["addon_code%5B0%5D=PH001", "addon_quantity%5B0%5D=1"]

        // Prepare the email address for Zoho's acceptance (remove anything after the plus)
        const parts = currentUser.email.split('@')
        const emailName = parts[0].split('+')[0]
        const email = emailName + '@' + parts[1]

        newUrlAdditions.push("email="+encodeURIComponent(email))
        newUrlAdditions.push("last_name="+encodeURIComponent(results.data.resident.last_name))
        newUrlAdditions.push("first_name="+encodeURIComponent(results.data.resident.first_name))
        newUrlAdditions.push("card_last_name="+encodeURIComponent(results.data.resident.last_name))
        newUrlAdditions.push("card_first_name="+encodeURIComponent(results.data.resident.first_name))
        newUrlAdditions.push("mobile="+encodeURIComponent(results.data.resident.phone_number))

        setUrlAdditions(newUrlAdditions)


    }, []);

    async function handleFormikSubmit(values, {setSubmitting, setErrors}) {
        /*
           SAVE RESIDENT
         */

        setBaseErrorMessage("")

        try {
            const result = await store.dispatch(saveResident({resident: values})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {

                setResident(response.resident)

                // Are we good?
                if (!response.resident.date_of_birth || !response.resident.tax_id) {
                    setBaseErrorMessage("Please provide both pieces of information")
                }

            } else if (response.errors) {
                setErrors({lease_resident: response.errors})

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }

                insightUtils.scrollTo('errors')
            }
        } catch (err) {
            setBaseErrorMessage("Unable to save information. " + (err || ""))
            setSubmitting(false);
        }
    }


    return (
        <>
        {resident &&
            <div className="section">
                {(!resident.date_of_birth || !resident.tax_id) ?
                    <>
                        {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}
                    <Formik
                        initialValues={residentForForm}
                        onSubmit={handleFormikSubmit}
                    >
                        {({isSubmitting, values}) => (
                            <Form>
                                <h2>Information Missing</h2>
                                <div>In order for Credit Builder to work, we must collect the following information:</div>
                                <br/>

                                <div className="form-row form-center">
                                    <div className="form-item form-item-25">
                                        <FormItem label="Social Security Number or ITIN" name={"tax_id"} mask={insightUtils.ssnMask()}/>
                                    </div>
                                </div>
                                <div className="form-row form-center">
                                    <FormItem label="Date of Birth" formItemClass="form-item-25" name={"date_of_birth"} mask={insightUtils.dateMask()} placeholder="mm/dd/yyyy"/>
                                </div>
                                <div className="form-nav">
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <span>Saving...</span> : <span>Continue &gt;</span>}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                    </>
                    :
                    <>
                        {resident.credit_builder_status == constants.credit_builder_status_options.active.key ?
                            <>
                                <div>Your subscription is now updated.</div>
                                <div className="form-row">
                                    <div className="st-col-100">
                                        <div className="form-nav">
                                            <a className="btn btn-red" onClick={() => navigate(insightRoutes.renterPortal())}>Back</a>
                                        </div>
                                    </div>
                                </div>
                            </>
                            :
                            <iframe width={isMobileDevice ? "400" : "768"} height="2000" src={constants.env.zoho_renter_credit_builder_url + "?" + urlAdditions.join("&")} style={{border: "none"}}></iframe>
                        }
                    </>}
            </div>
        }
        </>
    )
}

export default CreditReportingPricingPage;

