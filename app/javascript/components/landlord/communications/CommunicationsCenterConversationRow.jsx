import React, {useEffect, useState} from 'react';
import Moment from "react-moment";
import Modal from "../../shared/Modal";
import store from "../../../app/store";
import {deleteConversation, trashConversation} from "../../../slices/communicationSlice";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {useParams} from "react-router-dom";

const CommunicationsCenterConversationRow = ({conversation, currentConversation, handleSelectConversation, setReloadCommunications}) => {

    let params = useParams()
    const { currentUser } = useSelector((state) => state.user)

    const isActive = (conversation == currentConversation)
    const [inquiry, setInquiry] = useState(false)
    const [deletingConversation, setDeletingConversation] = useState(false)

    async function handleTrashConversation() {
        await store.dispatch(trashConversation({leaseResidentId: conversation.id, type: conversation.type})).unwrap()
        setDeletingConversation(false)
        setReloadCommunications(true)
    }

    async function handleDeleteConversation() {
        await store.dispatch(deleteConversation({leaseResidentId: conversation.id, type: conversation.type})).unwrap()
        setDeletingConversation(false)
        setReloadCommunications(true)
    }

    return (
        <>
        {conversation &&
            <div onClick={() => handleSelectConversation(conversation.id)} className={"message " + (isActive ? "active" : (conversation.unread_count > 0 ? "message-unread" : "message-read")) + (inquiry ? " message-inquiry" : "")}>
                <div className="cc-message-top">
                    {false && <i className="fal fa-square btn-checkbox"></i>}
                    <i></i>
                    <div className="message-type">
                        <i className="fal fa-comments"></i> Message
                        <span>{conversation.unread_count > 0 ? " - UNREAD" : ""}</span>
                    </div>

                    {currentUser.communications_delete && <i onClick={() => setDeletingConversation(true)} className="fal fa-trash-alt btn-delete-message"></i>}
                </div>
                <div className="message-sender">
                    <img className="flex-img-avatar" src="/images/avatar-white-red.svg"/>
                    <div className="message-sender-name">{conversation.title}<span>{inquiry && <>(Inquiry)</>} <Moment fromNowDuring={86400 * 2000} date={conversation.created_at} format="MM/DD/YYYY [at] hh:mm A"/></span></div>
                </div>
                <div className="message-preview">{conversation.body}</div>
            </div>}

            {deletingConversation &&
            <Modal closeModal={() => setDeletingConversation(null)}>

                {params.communicationType == "trash" ?
                    <>
                        <h2>Delete Conversation?</h2>
                        <p className="text-center">Are you sure you want to permanently delete these messages? This cannot be undone.</p>

                        <div className="form-nav">
                            <div onClick={() => setDeletingConversation(null)} className="btn btn-gray"><span>Cancel</span></div>
                            <div onClick={() => handleDeleteConversation()} className="btn btn-red"><span>Delete Conversation</span></div>
                        </div>
                    </> :
                    <>
                        <h2>Move Conversation to Trash?</h2>
                        <p className="text-center">Are you sure you want to move this conversation to the trash?</p>

                        <div className="form-nav">
                            <div onClick={() => setDeletingConversation(null)} className="btn btn-gray"><span>Cancel</span></div>
                            <div onClick={() => handleTrashConversation()} className="btn btn-red"><span>Delete Conversation</span></div>
                        </div>
                    </>}
            </Modal>
            }
        </>

)}

export default CommunicationsCenterConversationRow;

