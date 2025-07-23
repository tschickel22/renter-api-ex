import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";

import store from "../../../app/store";
import CommunicationsChannel from "../../../channels/communications_channel";

import CommunicationsCenterNav from "./CommunicationsCenterNav";
import CommunicationsCenterConversationView from "./CommunicationsCenterConversationView";
import CommunicationsCenterConversationsSidebar from "./CommunicationsCenterConversationsSidebar";
import CommunicationsCenterProfileView from "./CommunicationsCenterProfileView";
import CommunicationsCenterMessageEditModal from "./CommunicationsCenterMessageEditModal";

import {loadConversations, markConversationAsRead} from "../../../slices/communicationSlice";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";

import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";


const CommunicationsCenterPage = ({}) => {

    let params = useParams()
    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const { isMobileDevice } = useSelector((state) => state.dashboard)

    const [leaseResidents, setLeaseResidents] = useState(null)
    const [templates, setTemplates] = useState(null)

    const communicationType = params.communicationType || "inbox"
    const propertyId = params.propertyId || "all"
    const conversationId = params.conversationId || "all"

    const [conversationGroups, setConversationGroups] = useState(null)
    const [conversations, setConversations] = useState(null)
    const [reloadCommunications, setReloadCommunications] = useState(false)

    const [newMessageCount, setNewMessageCount] = useState(0)
    const [searchText, setSearchText] = useState("")
    const [searchedText, setSearchedText] = useState("")

    const [currentConversation, setCurrentConversation] = useState(null)
    const [editingCommunicationHashId, setEditingCommunicationHashId] = useState(null)


    useEffect(() => {
        CommunicationsChannel.received = (data) => {
            if (data && data.communications && data.communications == "reload") {
                setReloadCommunications(true)
            }
        }
    }, [])

    useEffect(async () => {
        if (["new_email", "new_text", "new_chat"].indexOf(params.action) >= 0) {
            setEditingCommunicationHashId(params.action + ":" + params.conversationId)
        }

        const results = await store.dispatch(searchForLeaseResidents({mode: "resident_list"})).unwrap()
        console.log(results)

        let newLeaseResidents = Array.from(results.data.lease_residents)

        newLeaseResidents = newLeaseResidents.sort((a, b) => {
            let valA = insightUtils.resolvePath(a, "resident.name")
            let valB = insightUtils.resolvePath(b, "resident.name")

            return (valA > valB ? 1 : -1)
        })

        await setLeaseResidents(newLeaseResidents)

        setReloadCommunications(true)

    }, [])


    useEffect(async () => {
        if (reloadCommunications) {
            const results = await store.dispatch(loadConversations({propertyId: (propertyId == "all" ? null : propertyId), searchText: searchText})).unwrap()
            console.log(results)
            await setConversationGroups(results.data.conversation_groups)
            await setReloadCommunications(false)

            // Scroll to the bottom
            const conversationPane = document.getElementsByClassName("cc-conversation-container")[0]
            if (conversationPane) conversationPane.scrollTop = conversationPane.scrollHeight

        }
    }, [reloadCommunications])

    useEffect(() => {
        dataUpdated(true)
    }, [conversationGroups])

    useEffect(() => {
        dataUpdated(false)
    }, [communicationType])

    function dataUpdated(conversationGroupUpdated) {
        if (conversationGroups) {

            let newNewMessageCount = 0
            Object.keys(conversationGroups).forEach((key) => {
                if (key != "trash" && key != "system_email") {
                    conversationGroups[key].conversations.forEach((conversation) => {
                        newNewMessageCount = newNewMessageCount + (conversation.unread_count || 0)
                    })
                }
            })

            setNewMessageCount(newNewMessageCount)

            let filteredConversations = null

            if (communicationType) {
                // Should we go somewhere else?  If this communicationType has no messages, look for one that does
                if (!conversationGroups[communicationType] && conversationGroupUpdated) {
                    let newCommunicationType

                    Object.keys(conversationGroups).forEach((key) => {
                        if (key != "maintenance_requests") {
                            if (!newCommunicationType && conversationGroups[key].conversations) {
                                newCommunicationType = key
                            }
                        }
                    })

                    handleCommunicationTypeChange(newCommunicationType || "inbox")

                    filteredConversations = []
                }
                else {
                    filteredConversations = (conversationGroups[communicationType] && conversationGroups[communicationType].conversations) || []
                }
            }
            else {
                filteredConversations = conversationGroups["inbox"].conversations
            }

            let sortedConversations = Array.from(Object.values(filteredConversations))
            sortedConversations = sortedConversations.sort((a, b) => {
                let valA = insightUtils.resolvePath(a, "created_at")
                let valB = insightUtils.resolvePath(b, "created_at")

                return (valA > valB ? 1 : -1) * -1
            })

            setConversations(sortedConversations)

        }
    }

    useEffect(async () => {
        if (conversations) {
            let newConversation = null

            if (conversationId) {
                // Is the current communication in the conversations
                newConversation = conversations.find((conversation) => conversation.id == conversationId )
            }

            // Auto-select the first conversation if we aren't on mobile
            if (!isMobileDevice && !newConversation) {
                newConversation = conversations[0]
            }

            setCurrentConversation(newConversation)

            if (newConversation) {
                const results = await store.dispatch(markConversationAsRead({relatedObjectType: "LeaseResident", relatedObjectHashId: newConversation.id, type: newConversation.type})).unwrap()

                if (results.data && results.data.communications && results.data.communications.length > 0) {
                    let newConversationGroups = Object.assign({}, conversationGroups)
                    Object.keys(newConversationGroups).forEach((key) => {
                        newConversationGroups[key].conversations.forEach((conversation) => {
                            if (conversation.id == communication.related_object_hash_id) {
                                conversation.unread_count = 0
                            }
                        })
                    })

                    setConversationGroups(newConversationGroups)
                }
            }
        }
        else {
            setCurrentConversation(null)
        }
    }, [conversations, conversationId])

    function handlePropertyChange(e) {
        const newPropertyId = e.target.value

        navigate(insightRoutes.communicationCenter(currentUser, communicationType, newPropertyId))
        setReloadCommunications(true)

    }

    function handleCommunicationTypeChange(newCommunicationType) {
        navigate(insightRoutes.communicationCenter(currentUser, newCommunicationType, propertyId))
    }

    function handleSelectConversation(newConversationId) {
        console.log("handleSelectConversation", newConversationId)
        navigate(insightRoutes.communicationCenter(currentUser, communicationType, propertyId, newConversationId))
    }

    async function handleSearch() {
        await setSearchedText(searchText)
        setReloadCommunications(true)
    }

    function handleClear() {
        setSearchedText("")
        setSearchText("")
        setReloadCommunications(true)
    }


    return (
        <>
            <div className="section" id="ll-section-communication-center">

                <div className="title-block short-section">
                    <h1>Communication Center</h1>
                </div>

                {currentUser.communications_view && <>
                    <div className="cc-status-wrap hidden-print">
                        <div className="cc-new-messages">
                            {conversationGroups ?
                                <>{newMessageCount} New {newMessageCount == 1 ? "Message" : "Messages"} </>
                                :
                                <>Loading...</>
                            }
                        </div>
                    </div>

                    <CommunicationsCenterNav conversationGroups={conversationGroups} communicationType={communicationType} setCommunicationType={handleCommunicationTypeChange} searchText={searchText} setSearchText={setSearchText} searchedText={searchedText} setSearchedText={setSearchedText} setEditingCommunicationHashId={setEditingCommunicationHashId} handleSearch={handleSearch} handleClear={handleClear} currentConversation={currentConversation} setCurrentConversation={setCurrentConversation} />

                    <div className="communication-center-wrap">

                        <CommunicationsCenterConversationsSidebar conversations={conversations} currentConversation={currentConversation} handleSelectConversation={handleSelectConversation} handlePropertyChange={handlePropertyChange} setReloadCommunications={setReloadCommunications} setEditingCommunicationHashId={setEditingCommunicationHashId} searchText={searchText} setSearchText={setSearchText} searchedText={searchedText} setSearchedText={setSearchedText} setEditingCommunicationHashId={setEditingCommunicationHashId} handleSearch={handleSearch} handleClear={handleClear} />
                        <CommunicationsCenterConversationView currentConversation={currentConversation} communicationType={communicationType} reloadCommunications={reloadCommunications} setReloadCommunications={setReloadCommunications} />

                        {insightUtils.isCompanyUserAtLeast(currentUser) && communicationType != "system_email" &&
                            <CommunicationsCenterProfileView currentConversation={currentConversation} setEditingCommunicationHashId={setEditingCommunicationHashId} />
                        }

                    </div>
                </>}
            </div>

            {editingCommunicationHashId && <CommunicationsCenterMessageEditModal editingCommunicationHashId={editingCommunicationHashId} setEditingCommunicationHashId={setEditingCommunicationHashId} setReloadCommunications={setReloadCommunications} leaseResidents={leaseResidents} templates={templates} />}
        </>

    )}

export default CommunicationsCenterPage;

