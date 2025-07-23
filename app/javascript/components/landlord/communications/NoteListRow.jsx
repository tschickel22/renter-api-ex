import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import Moment from "react-moment";


const NoteListRow = ({note, setDeletingNote}) => {

    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        insightUtils.handleForwardNavigation(url, location, navigate)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-75 st-first-col">
                        <div>
                            <div><strong>{note.subject || "Note"}</strong></div>
                            {note.body && <div className="text-muted" style={{marginTop: "10px", paddingRight: "10px"}} dangerouslySetInnerHTML={{__html: note.body.replaceAll("\n", '<br/>')}} />}
                        </div>
                    </div>
                    <span className="st-col-25">
                        <Moment date={note.created_at} format="MM/DD/YYYY [at] hh:mm A" />
                        {note.from?.name && <div className="text-muted">
                            by {note.from?.name}
                        </div>}
                    </span>
                    <span className="st-nav-col">
                        <div className="hidden-print">
                            {currentUser.communications_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <>
                                    <li onClick={() => navigateAndClose(insightRoutes.noteEdit(note.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                                    {currentUser.communications_delete && <li onClick={() => setDeletingNote(note)}><i className="fal fa-trash"></i> Delete</li>}
                                </>
                            </RowMenu>}
                        </div>
                    </span>
                </div>
            </div>

        </>

    )
}

export default NoteListRow;

