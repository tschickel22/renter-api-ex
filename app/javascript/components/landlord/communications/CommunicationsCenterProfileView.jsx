import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {loadLeaseResident} from "../../../slices/leaseResidentSlice";
import store from "../../../app/store";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const CommunicationsCenterProfileView = ({currentConversation, setEditingCommunicationHashId}) => {

    const { constants } = useSelector((state) => state.company)

    const [leaseResident, setLeaseResident] = useState(null)
    const [lease, setLease] = useState(null)
    const [coResidents, setCoResidents] = useState(null)
    const [mode, setMode] = useState("about")

    useEffect(async () => {
        if (currentConversation) {
            const results = await store.dispatch(loadLeaseResident({leaseResidentId: currentConversation.id})).unwrap()

            setLease(results.data.lease)
            setLeaseResident(results.data.lease_resident)

            // Figure out who the co-residents are
            let newCoResidents = [results.data.lease.primary_resident].concat(results.data.lease.secondary_residents)
            newCoResidents = newCoResidents.filter((secondaryResident) => (secondaryResident.hash_id != results.data.lease_resident.hash_id))

            setCoResidents(newCoResidents)

        }
        else {
            setLease(null)
            setLeaseResident(null)
        }
    }, [currentConversation])

    return (
        <>
            <div className="cc-profile-container hidden-print">
                {false && <div className="sm-autosave-wrap sm-autosave-desktop">
                    <div className="system-message sm-green sm-autosave"><i className="far fa-circle-check"></i>Autosaved</div>
                </div>}


                {leaseResident && <div className="cc-profile-wrap cc-profile-wrap-known">
                    <img className="flex-img-avatar" src="/images/avatar-white-red.svg"/>

                    <div className="cc-profile-name">{leaseResident.resident.name}</div>

                    <div className="cc-profile-btns">
                        <div onClick={() => setEditingCommunicationHashId("new_email:" + leaseResident.hash_id)} className="btn btn-gray"><span><i className="fal fa-envelope"></i>Email</span></div>
                        {leaseResident.resident.phone_number && !leaseResident.resident.text_opted_out_at && <div onClick={() => setEditingCommunicationHashId("new_text:" + leaseResident.hash_id)} className="btn btn-gray"><span><i className="fal fa-comments"></i>Text</span></div>}
                        {leaseResident.resident.phone_number && <a href={"tel:"+ leaseResident.resident.phone_number} title={leaseResident.resident.phone_number} className="btn btn-gray"><span><i className="fal fa-phone"></i>Call</span></a>}
                    </div>

                    {false && <div className="cc-profile-nav">
                        <div onClick={() => setMode("about")} className={"cc-profile-nav-item " + (mode == "about" ? "active" : "")}>About</div>
                        <div onClick={() => setMode("files")} className={"cc-profile-nav-item " + (mode == "files" ? "active" : "")}>Files</div>
                        <div onClick={() => setMode("communications")} className={"cc-profile-nav-item " + (mode == "communications" ? "active" : "")}>History</div>
                    </div>}

                    <div className="cc-profile-content">

                        {mode == "about" &&
                        <div className="cc-profile-about">
                            {lease.status == constants.lease_statuses.lead.key && <>
                                <p>Status: <strong>Lead</strong></p>
                            </>}

                            {lease.status == constants.lease_statuses.future.key && <>
                                <p>Status: <strong>Future</strong></p>
                            </>}

                            {lease.status == constants.lease_statuses.current.key && <>
                                <p>Status: <strong>Current</strong></p>
                            </>}

                            {lease.status == constants.lease_statuses.applicant.key && <>
                                <p>Status: <strong>Applicant</strong></p>
                                <p>Application Status: <span className="btn-ledger-balance">{insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}</span></p>
                            </>}


                            {lease.unit &&
                                <>
                                <p>{lease.unit.street_and_unit}</p>
                                <p>
                                    {lease.lease_start_on && lease.lease_end_on && <>Lease: <Link to={insightRoutes.leaseShow(lease.hash_id)}>{insightUtils.formatDate(lease.lease_start_on)} - {insightUtils.formatDate(lease.lease_end_on)}</Link><br/></>}
                                    {lease.rent && <>Monthly Rent: <Link to={insightRoutes.leaseShow(lease.hash_id)}>{insightUtils.numberToCurrency(lease.rent)}</Link><br/></>}
                                </p>
                            </>}

                            {lease.status == constants.lease_statuses.current.key && <>
                                <p>Balance: <Link to={insightRoutes.residentLedger(lease.hash_id)}>{insightUtils.numberToCurrency(lease.ledger_balance || 0, 2)}</Link></p>
                                <p>Last Payment: <Link to={insightRoutes.residentLedger(lease.hash_id)}>{lease.last_payment_on ? insightUtils.formatDate(lease.last_payment_on) : "None"}</Link></p>
                            </>}

                            {coResidents && coResidents.length > 0 && <>
                                <p>Co-Residents: {coResidents.map((secondaryResident) => (secondaryResident.resident.name)).join(", ")}</p>
                            </>}

                            {lease.occupants && lease.occupants.length > 0 && <>
                                <p>Occupants: {lease.occupants.map((occupant) => (occupant.resident.name)).join(", ")}</p>
                            </>}


                            {false && <p>
                                <strong>Tenant Notes:</strong><br/>
                                Mike has been a great tenant with an outstanding payment record over 4 years of renting this unit. <a className="btn-edit-tenant-notes">(Edit)</a>
                            </p>}
                        </div>}

                        {mode == "files" &&
                        <div className="cc-profile-files">
                            <ul>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>

                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-pdf"></i>
                                        <div className="cc-file-name" title="documentname.pdf">documentname.pdf</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="documentname.docx">documentname.docx</div>
                                    </div>
                                </li>
                                <li>
                                    <div className="cc-file-wrap"><i className="far fa-file-word"></i>
                                        <div className="cc-file-name" title="really-long-document-name.docx">really-long-document-name.docx</div>
                                    </div>
                                </li>

                            </ul>

                            <div className="btn btn-red btn-add-file"><span><i className="fas fa-plus"></i> Add File</span></div>
                        </div>}

                        {mode == "communications" &&
                            <div className="cc-profile-communications">

                                <div className="cc-profile-communications-scroll">
                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-comments"></i> Chat</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/15/22 at 3:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>

                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-envelope"></i> Email - UNREAD</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/14/22 at 10:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>


                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-comments"></i> Chat</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/15/22 at 3:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>

                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-envelope"></i> Email - UNREAD</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/14/22 at 10:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>


                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-comments"></i> Chat</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/15/22 at 3:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>

                                    <div className="message">
                                        <div className="cc-message-top">
                                            <div className="message-type"><i className="fal fa-envelope"></i> Email - UNREAD</div>
                                            <i className="fal fa-trash-alt btn-delete-message btn-convo-message-delete"></i>
                                        </div>
                                        <div className="message-sender-time">Sent on 02/14/22 at 10:21pm</div>
                                        <div className="message-preview">Thanks very much, I appreciate it. I am ready for this problem to be resolved.</div>
                                    </div>

                                </div>
                                <div className="btn btn-red btn-new-message"><span>New Message</span></div>
                            </div>
                        }

                    </div>
                </div>}

            </div>
        </>
    )}

export default CommunicationsCenterProfileView;

