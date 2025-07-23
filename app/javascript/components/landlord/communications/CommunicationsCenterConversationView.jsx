import React, {useEffect, useState} from 'react';
import CommentsView from "./CommentsView";
import {useSelector} from "react-redux";
import Moment from "react-moment";
import insightUtils from "../../../app/insightUtils";

const CommunicationsCenterConversationView = ({currentConversation, communicationType, reloadCommunications, setReloadCommunications}) => {
    return (
        <>
            {currentConversation && <div className="cc-conversation-container">
                <CommentsView title={currentConversation.title} relatedObjectHashId={currentConversation.id} relatedObjectType="LeaseResident" type={communicationType} subType="communications_center" trashedOnly={communicationType == "trash"} reloadCommunications={reloadCommunications} setReloadCommunications={setReloadCommunications} containerClassName="cc-conversation-container" />
            </div>}
        </>
    )}

export default CommunicationsCenterConversationView;

