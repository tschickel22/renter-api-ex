import React from 'react';
import FinancialNav from "../financial/FinancialNav";
import Page from "../../shared/Page";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";


const TaxReportingEnrollmentPage = ({}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <>
            <Page
                title="1099 Reporting"
                titleImage={<img className="section-img" src="/images/1099-report.png"/>}
                nav={<FinancialNav/>}
            >
                <p className="text-center">To complete your set up, you will need to create an account with NELCO.</p>
                <a href={`${constants.env.nelco_url}/Account/CreateUser`} className="btn btn-red" target="_blank">Create account with NELCO</a>
                <p className="text-center">Once you do, enter your NELCO email and password on your <Link to={insightRoutes.companyEdit("my")}>Manage Account</Link> page to continue.</p>
            </Page>

        </>

    )
}


export default TaxReportingEnrollmentPage;

