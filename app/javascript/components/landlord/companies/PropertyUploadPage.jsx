import React, {useState} from 'react';
import {uploadProperties} from "../../../slices/propertySlice";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";

const PropertyUploadPage = ({}) => {

    const { currentActualUser } = useSelector((state) => state.user)

    const [uploadResults, setUploadResults] = useState(null)
    const [errorCount, setErrorCount] = useState(0)

    async function handleFormikSubmit(values, { setSubmitting }) {
        setSubmitting(true)
        setUploadResults(null)
        setErrorCount(0)

        try {
            const results = await store.dispatch(uploadProperties({propertiesUpload: values.properties_upload})).unwrap()

            // Need to parse the JSON due to the content type of the post
            const response = JSON.parse(results.data)
            console.log(response)

            if (response.results) {
                setErrorCount(Object.values(response.results).filter((result) => (result.status == "error")).length)
                setUploadResults(response.results)
            }
        }
        catch {
            setErrorCount(1)
            setUploadResults([{status: 'error', message: 'Unable to process file, please contact support@renterinsight.com'}])
        }

        setSubmitting(false)
    }

    return (
        <>
             <div className="section">
                <div className="title-block">
                    <h1>Upload Properties</h1>
                </div>

                <div className="section-table-wrap">
                    <div className="section-table">
                        <p>
                            In order to quickly add a group of properties, download the <a href="/renter-insight-add-property-template.xlsx">Add Property Template</a>, populate it and email it to <a href="mailto:support@renterinsight.com">support@renterinsight.com</a>.
                            You can also add a group of residents, by downloading the <a href="/renter-insight-add-resident-template.xlsx">Add Resident Template</a>, populate it and return it to <a href="mailto:support@renterinsight.com">Renter Insight support</a>.
                            All files will be added within 24 business hours and any added residents will be emailed credentials to access the Renter Insight resident portal.
                        </p>

                        {currentActualUser && currentActualUser.user_type == "admin" &&
                            <Formik
                                initialValues={{properties_upload: ''}}
                                onSubmit={handleFormikSubmit}
                            >
                                {({isSubmitting, setFieldValue, values}) => (
                                    <Form>
                                        <div className="add-property-wrap">
                                            <div className="form-row">
                                                <FormItem label="Completed Property Template" name="properties_upload">
                                                    <input
                                                        type="file"
                                                        name="properties_upload"
                                                        onChange={(event) => {
                                                            setFieldValue('properties_upload', event.currentTarget.files[0]);
                                                        }}
                                                    />
                                                </FormItem>
                                            </div>

                                            {uploadResults && <>
                                                <strong>Upload Results:</strong>
                                                {
                                                    errorCount > 0 ?
                                                        <p>There are errors. Please correct and upload again.</p>
                                                        :
                                                        <p>{Object.values(uploadResults).length} records were saved.</p>
                                                }

                                                {Object.keys(uploadResults).map((rowNumber) => {
                                                        return (<div key={rowNumber} style={uploadResults[rowNumber].status == "error" ? {color: 'red'} : {}}>Row {rowNumber}: ({uploadResults[rowNumber].property_name} / {uploadResults[rowNumber].unit_number}) {uploadResults[rowNumber].message}</div>)
                                                    }
                                                )}
                                            </>}

                                            {(!uploadResults || errorCount > 0) ?
                                                <div className="form-nav">
                                                    <Link to={insightRoutes.propertyList()} className="btn btn-gray"><span>Cancel</span></Link>
                                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                        {!isSubmitting && <span>Upload Properties</span>}
                                                        {isSubmitting && <span>Processing...</span>}
                                                    </button>
                                                </div>
                                                :
                                                <div className="form-nav">
                                                    <Link to={insightRoutes.propertyList()} className="btn btn-red"><span>View Properties</span></Link>
                                                </div>
                                            }
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        }
                    </div>
                </div>
             </div>
        </>
    )}

export default PropertyUploadPage;

