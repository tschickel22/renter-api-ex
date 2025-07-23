import React, {useState} from 'react';
import {useSelector} from "react-redux";
import {Link, useNavigate, useParams} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";


const SettingGroupListRow = ({settingGroupKey}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { settingsConfig } = useSelector((state) => state.company)
    const settingGroup = settingsConfig[settingGroupKey]

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            {!settingGroup.special_use &&
                <div className="st-row-wrap">
                    <div className="st-row">
                        <div className="st-col-30 st-first-col">
                            <div className="flex-column">
                                {settingGroup.sub_groups && settingGroup.sub_groups.length > 0 ?
                                    <Link to={insightRoutes.settingEdit(params.mode, params.propertyId, settingGroupKey)}>{settingGroup.name}</Link>
                                    :
                                    settingGroup.name
                                }
                            </div>
                        </div>
                        <span className="st-col-40">
                            {settingGroup.sub_groups && settingGroup.sub_groups.length > 0 ? settingGroup.description : "No Settings"}
                        </span>
                        <span className="st-col-30">

                        </span>
                        <span className="st-nav-col">
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={()=>navigateAndClose(insightRoutes.settingEdit(params.mode, params.propertyId, settingGroupKey))}><i className="fal fa-pencil"></i> Edit</li>
                            </RowMenu>
                        </span>
                    </div>
                </div>
            }
        </>

    )}

export default SettingGroupListRow;

