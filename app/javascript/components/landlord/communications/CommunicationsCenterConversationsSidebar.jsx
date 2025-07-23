import React, {useEffect, useState} from 'react';
import CommunicationsCenterConversationsList from "./CommunicationsCenterConversationsList";
import {useSelector} from "react-redux";
import BasicDropdown from "../../shared/BasicDropdown";
import FormItem from "../../shared/FormItem";
import {Form, Formik} from "formik";
import {useParams} from "react-router-dom";
import SearchBox from "../../shared/SearchBox";
import insightUtils from "../../../app/insightUtils";

const CommunicationsCenterConversationsSidebar = ({conversations, currentConversation, handleSelectConversation, setReloadCommunications, handlePropertyChange, setEditingCommunicationHashId, searchText, setSearchText, searchedText, setSearchedText, handleSearch, handleClear}) => {
    const params = useParams()

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

     return (
        <div className={"cc-message-container hidden-print " + (currentConversation ? " cc-messages-conversation-selected" : "")}>
            {insightUtils.isCompanyUserAtLeast(currentUser) &&
            <Formik initialValues={{property_id: params.propertyId}}>
                {({  }) => (
                    <Form>
                        <FormItem name="property_id" label="" optional={true} labelClass="text-center">
                            {properties && <BasicDropdown blankText="All Properties" name="property_id" options={properties} onChange={handlePropertyChange} />}
                        </FormItem>
                    </Form>
                )}
            </Formik>}
            <div className="cc-messages">
                {insightUtils.isCompanyUserAtLeast(currentUser) ?
                    <div className="cc-message-nav">

                        {currentUser.communications_edit && <span className="btn-messagenav-desktop">
                            <div onClick={() => setEditingCommunicationHashId("new_email")} className="btn btn-red btn-new-message"><span><i className="fas fa-plus"></i>New Message</span></div>
                        </span>}

                        {currentUser.communications_edit && <span className="btn-messagenav-mobile">
                            <div onClick={() => setEditingCommunicationHashId("new_email")} className="btn btn-red btn-new-message"><span><i className="fas fa-plus"></i>New</span></div>
                        </span>}

                        <div className="cc-search cc-search-messages">
                            <SearchBox searchText={searchText} setSearchText={setSearchText} searchedText={searchedText} setSearchedText={setSearchedText} handleSearch={handleSearch} handleClear={handleClear} hideIcon={true} />
                        </div>
                    </div>
                    :
                    <div>&nbsp;</div>
                }

                <div className="cc-messages-wrap cc-messages-scroll">
                    <CommunicationsCenterConversationsList conversations={conversations} setReloadCommunications={setReloadCommunications} currentConversation={currentConversation} handleSelectConversation={handleSelectConversation} />
                </div>
            </div>
        </div>
    )}

export default CommunicationsCenterConversationsSidebar;

