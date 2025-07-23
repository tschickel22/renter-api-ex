import React from 'react';
import {NavLink, useNavigate, useParams} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";

const SettingsNav = ({}) => {
    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

    let params = useParams();

    function handlePropertyChange(e) {
        const newPropertyId = e.target.value

        if (params.settingGroupKey) {
            navigate(insightRoutes.settingEdit(params.mode, newPropertyId, params.settingGroupKey))
        }
        else {
            navigate(insightRoutes.settingList(params.mode, newPropertyId))
        }
    }

    return (
        <>
            <div className="horiz-nav">
                <div>&nbsp;</div>

                <ul className="horiz-nav-list">
                    {insightUtils.isAdmin(currentUser) ?
                        <li className="hn-item"><NavLink to={insightRoutes.settingList('system')} style={{color: 'red'}}>System-wide Default Settings</NavLink></li>
                        :
                        <>
                            <li className="hn-item"><NavLink to={insightRoutes.settingList('company')}>Company Default Settings</NavLink></li>
                            <li className="hn-item"><NavLink to={insightRoutes.settingList("properties", params.propertyId)}>Property-Level Settings</NavLink></li>
                        </>
                    }
                </ul>

                <div>&nbsp;</div>

            </div>
            {params.mode == "properties" && <>
                <div className="flex-row flex-center ">
                    <p>Property Level Settings will override Company Default Settings at selected property.</p>
                </div>
                <div className="flex-row flex-center ">
                    <div className="st-col-25 st-col-md-100">
                        <Formik initialValues={{property_id: params.propertyId}}>
                            {({  }) => (
                                <Form>
                                    <FormItem name="property_id" label="Choose Property:" optional={true} labelClass="text-center">
                                        {properties && <BasicDropdown name="property_id" options={properties}  onChange={handlePropertyChange} />}
                                    </FormItem>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </>}
        </>

    )}

export default SettingsNav;


