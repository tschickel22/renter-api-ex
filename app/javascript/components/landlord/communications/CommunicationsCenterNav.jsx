import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import SearchBox from "../../shared/SearchBox";
import insightUtils from "../../../app/insightUtils";
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const CommunicationsCenterNav = ({conversationGroups, communicationType, setCommunicationType, setEditingCommunicationHashId, searchText, setSearchText, searchedText, setSearchedText, handleSearch, handleClear, currentConversation, setCurrentConversation}) => {

    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const [stats, setStats] = useState({})

    const communicationTypes =
     (insightUtils.isResident(currentUser)) ?
         [
             {id: "trash", name: "Trash"}
         ]
         :
         [
             {id: "sent", name: "Sent"},
             {id: "trash", name: "Trash"}
         ]

    useEffect(() => {
        if (conversationGroups) {
            let newStats = {}

            Object.keys(conversationGroups).forEach((key) => {
                newStats[key] = 0

                conversationGroups[key].conversations.forEach((conversation) => {
                    if (key != "trash" && key != "system_email") {
                        newStats[key] = newStats[key] + conversation.unread_count
                    }
                })
            })

            setStats(newStats)
        }
    }, [conversationGroups])

    return (
        <>
            <div className="horiz-nav horiz-nav-communication-center">

                <div className="hv-sidenav-left">
                    {insightUtils.isResident(currentUser) &&
                        <div onClick={() => setEditingCommunicationHashId("new_chat")} className="btn btn-red btn-new-message"><span><i className="fas fa-plus"></i>New Message</span></div>
                    }

                    {false && insightUtils.isCompanyUserAtLeast(currentUser) && <div className="hv-sideitem btn-cc-templates"><i className="fal fa-files"></i> Templates</div>}
                </div>

                <ul className="horiz-nav-list">
                    <li onClick={()=>setCommunicationType(null)} className={"hn-item " + (communicationType == "inbox" ? "active" : "")}>Inbox {(!!stats['inbox'] && stats['inbox'] > 0) && <span>({stats['inbox'] || 0})</span>}</li>
                    {conversationGroups && communicationTypes.map((ct, i) => {
                        let show = true
                        if ((ct.id == "trash" || ct.id == "sent") && !conversationGroups[ct.id]) show = false

                        return show ? <li key={i} onClick={()=>setCommunicationType(ct.id)} className={"hn-item btn-cc-email " + (communicationType == ct.id ? "active" : "")}>{ct.name} {stats[ct.id] > 0 && <span>({stats[ct.id] || 0})</span>}</li> : <React.Fragment key={i} />
                    })}
                    {insightUtils.isCompanyUserAtLeast(currentUser) && <li onClick={()=> navigate(insightRoutes.announcementList())} className="hn-item ">Announcements</li>}
                    {insightUtils.isCompanyUserAtLeast(currentUser) && <li onClick={()=> setCommunicationType("system_email")} className={"hn-item " + (communicationType == "system_email" ? "active" : "")}>System Email {(!!stats['system_email'] && stats['system_email'] > 0) && <span>({stats['system_email'] || 0})</span>}</li>}
                    {insightUtils.isCompanyUserAtLeast(currentUser) && <li onClick={()=> navigate(insightRoutes.maintenanceRequestList())} className="hn-item ">Maintenance Requests {(!!stats['maintenance_requests'] && stats['maintenance_requests'] > 0) && <span>({stats['maintenance_requests'] || 0})</span>}</li>}
                </ul>

                {currentConversation &&
                    <div className="btn-messages-mobile-back-wrap">
                        <div onClick={() => setCurrentConversation(null)} className="btn btn-red btn-messages-mobile-back"><span><i className="fas fa-arrow-left"></i>Back</span></div>
                    </div>
                }

                <div className="cc-search cc-search-nav">
                    <SearchBox searchText={searchText} setSearchText={setSearchText} searchedText={searchedText} setSearchedText={setSearchedText} handleSearch={handleSearch} handleClear={handleClear} hideIcon={true} />
                </div>

            </div>
        </>

)}

export default CommunicationsCenterNav;

