import React, {useEffect, useState} from 'react';

import {loadEmailTemplate, loadEmailTemplates} from "../../slices/companySlice";
import store from "../../app/store";
import ListPage from "../shared/ListPage";
import Modal from "../shared/Modal";

const EmailTemplateListPage = ({}) => {

    const [currentEmailTemplate, setCurrentEmailTemplate] = useState(null)
    const [companyEmailTemplates, setCompanyEmailTemplates] = useState(null)
    const [residentEmailTemplates, setResidentEmailTemplates] = useState(null)

    useEffect(async() => {
        const results = await store.dispatch(loadEmailTemplates()).unwrap()

        setCompanyEmailTemplates(results.data.company_emails)
        setResidentEmailTemplates(results.data.resident_emails)
    }, [])

    async function handleLoadEmailTemplate(emailType, id) {
        const results = await store.dispatch(loadEmailTemplate({templateId: emailType + ":" + id})).unwrap()
        setCurrentEmailTemplate(results.data.body)
    }

    async function runCompanyEmailSearch(text, page) {
        return {total: companyEmailTemplates.length, objects: companyEmailTemplates}
    }

    async function runResidentEmailSearch(text, page) {
        return {total: residentEmailTemplates.length, objects: residentEmailTemplates}
    }

    function generateCompanyTableRow(email, key) {
        return generateTableRow("company", email, key)
    }

    function generateRenterTableRow(email, key) {
        return generateTableRow("resident", email, key)
    }

    function generateTableRow(emailType, email, key) {
        return (
            <div key={key} className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-50">
                        <a onClick={() => handleLoadEmailTemplate(emailType, email.id)}>{email.subject}</a>
                    </div>
                    <div className="st-col-50">
                        {email.description}
                    </div>
                </div>
            </div>)
    }

    return (
        <div className="section">
            {companyEmailTemplates && <ListPage
                title="Company Emails"
                runSearch={runCompanyEmailSearch}
                hideSearch={true}
                hideNavCol={true}
                titleImage={<React.Fragment />}
                columns={[
                    {label: "Subject", class: "st-col-50", sort_by: "subject"},
                    {label: "Description", class: "st-col-50", sort_by: "description"},
                ]}
                generateTableRow={generateCompanyTableRow}
            />}

            <hr />

            {residentEmailTemplates && <ListPage
                title="Renter Emails"
                runSearch={runResidentEmailSearch}
                hideSearch={true}
                hideNavCol={true}
                titleImage={<React.Fragment />}
                columns={[
                    {label: "Subject", class: "st-col-50", sort_by: "subject"},
                    {label: "Description", class: "st-col-50", sort_by: "description"},
                ]}
                generateTableRow={generateRenterTableRow}
            />}

            {currentEmailTemplate && <Modal closeModal={() => setCurrentEmailTemplate(null)}>
                <div dangerouslySetInnerHTML={{__html:currentEmailTemplate}}></div>
            </Modal>}
        </div>
    )}

export default EmailTemplateListPage;

