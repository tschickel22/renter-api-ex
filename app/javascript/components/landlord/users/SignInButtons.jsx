import React from 'react';

import {Link} from "react-router-dom";


const SignInButtons = ({forgotPasswordRoute, isSubmitting}) => {

    return (
        <>
            <div className="st-row" style={{marginBottom: "30px"}}>
                <div className="st-col-50 text-left">
                    <Link to={forgotPasswordRoute} className="btn-forgot-password">Forgot Password?</Link>
                </div>
                <div className="st-col-50 text-right">
                    <button className="btn btn-red btn-signin-submit" type="submit" disabled={isSubmitting}>
                        <span>Submit</span>
                    </button>
                </div>
            </div>

            <div className="st-row">
                <div className="st-col-50 text-left">
                    <a href="https://apple.co/3NVVEbP"><img src="/images/apple-app-store.svg" style={{height: "40px"}} /></a>
                </div>
                <div className="st-col-50 text-right">
                    <a href="https://play.google.com/store/apps/details?id=com.uMdabwXECsyC.natively&pcampaignid=web_share"><img src="/images/google-play.png" style={{height: "40px"}} /></a>
                </div>
            </div>

        </>

    )}

export default SignInButtons;

