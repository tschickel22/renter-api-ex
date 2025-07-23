import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const AnnouncementListRow = ({announcement, setCancellingAnnouncement, cloneAnnouncement, setDeletingAnnouncement}) => {

    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        <div className="flex-column">
                            {currentUser.communications_edit ?
                                <Link to={insightRoutes.announcementEdit(announcement.hash_id)}>
                                    {announcement.subject}
                                </Link>
                                :
                                <>{announcement.subject}<br/></>
                            }
                            <em>
                                {announcement.sent_at ?
                                    <>Sent {insightUtils.formatDate(announcement.sent_at)}</>
                                        :
                                    <>Unsent</>
                                }
                            </em>
                        </div>
                    </div>
                    <span className="st-col-25" title="Sent By">
                        {announcement.sent_by_name}
                    </span>
                    <span className="st-col-25" title="Sent To">
                        <Link to={insightRoutes.announcementEditRecipients(announcement.hash_id)}>{announcement.recipient_summary}</Link>
                    </span>
                    <span className="st-col-25" title="Resident Portal">
                        {announcement.display_summary}
                    </span>
                    <span className="st-nav-col">
                        {currentUser.communications_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <>
                                <li onClick={() => navigateAndClose(insightRoutes.announcementEdit(announcement.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                                <li onClick={() => cloneAnnouncement(announcement)}><i className="fal fa-times"></i> Clone</li>
                                <li onClick={() => navigateAndClose(insightRoutes.announcementEditRecipients(announcement.hash_id))}><i className="fal fa-pencil"></i> Edit Recipients</li>
                                {!announcement.sent_at && announcement.status == "queued" && <li onClick={() => setCancellingAnnouncement(announcement)}><i className="fal fa-times"></i> Cancel Delivery</li>}
                                {announcement.status == "draft" && <li onClick={() => setDeletingAnnouncement(announcement)}><i className="fal fa-trash"></i> Delete</li>}
                            </>
                        </RowMenu>}
                    </span>
                </div>
            </div>

        </>

    )
}

export default AnnouncementListRow;

