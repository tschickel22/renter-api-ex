import React from 'react';
import CommunicationsCenterConversationRow from "./CommunicationsCenterConversationRow";

const CommunicationsCenterConversationsList = ({conversations, currentConversation, setReloadCommunications, handleSelectConversation}) => {

    return (
        <>
            {!conversations && <>Loading...</>}
            {conversations && conversations.map((conversation, i) => {
                return <CommunicationsCenterConversationRow conversation={conversation} currentConversation={currentConversation} handleSelectConversation={handleSelectConversation} setReloadCommunications={setReloadCommunications} key={i} />
            })}
        </>

)}

export default CommunicationsCenterConversationsList;

