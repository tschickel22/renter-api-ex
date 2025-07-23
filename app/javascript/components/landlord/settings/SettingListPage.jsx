import React from 'react';

import ListPage from "../../shared/ListPage";

import SettingGroupListRow from "./SettingGroupListRow";
import {useSelector} from "react-redux";
import SettingsNav from "./SettingsNav";
import {useParams} from "react-router-dom";


const SettingListPage = ({}) => {
    let params = useParams();

    const { settingsConfig } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    // This setting is used in emails: email_signature and we need to include it in a jsx file so that it doesn't show up as NOT UTILIZED
    function runSearch(text, page) {
        if (params.mode != "properties" || params.propertyId) {
            return {total: 0, objects: Object.keys(settingsConfig)}
        }
        else {
            return {total: 0, objects: []}
        }
    }

    function generateTableRow(settingGroupKey, key) {
        return (<SettingGroupListRow key={key} settingGroupKey={settingGroupKey} />)
    }

    return (
        <>
            {currentUser.settings_view && <ListPage
                title="Settings"
                titleImage={<img className="section-img" src="/images/photo-settings.jpg" />}
                runSearch={runSearch}
                hideSearch={true}
                nav={<SettingsNav/>}
                reloadWhenChanges={params.propertyId}
                columns={[
                    {label: "Product", class: "st-col-30"},
                    {label: "Description", class: "st-col-40"},
                    {label: "", class: "st-col-30"}
                ]}
                generateTableRow={generateTableRow}
            />}
        </>
    )}

export default SettingListPage;
