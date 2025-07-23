import React, {useEffect, useState} from 'react';
import store from "../../../app/store";
import insightUtils from "../../../app/insightUtils";
import {Field, Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import {deleteCommunication, saveCommunication, searchForCommunications, trashCommunication} from "../../../slices/communicationSlice";
import {useSelector} from "react-redux";
import Moment from "react-moment";
import Modal from "../../shared/Modal";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const CommentsView = ({title, type, subType, relatedObjectType, relatedObjectHashId, extraClassName, trashedOnly, hideReply, reloadCommunications, setReloadCommunications, containerClassName, addLabel }) => {

    const { currentUser }= useSelector((state) => state.user)

    const [comments, setComments] = useState(null)
    const [reloadComments, setReloadComments] = useState(false)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [deletingComment, setDeletingComment] = useState(null)
    const [editingComment, setEditingComment] = useState(null)

    useEffect(async () => {
        if (relatedObjectHashId && type) {
            await callServerForComments()
        }
        else{
            console.log("decided not too", relatedObjectHashId, type)
        }
    }, [relatedObjectHashId, type, trashedOnly])

    useEffect(async () => {
        if (reloadCommunications) {
            setReloadComments(true)
        }
    }, [reloadCommunications])


    useEffect(async () => {
        if (reloadComments) {
           await callServerForComments()
           setReloadComments(false)
        }
    }, [reloadComments])

    async function callServerForComments() {
        const results = await store.dispatch(searchForCommunications({type: type || "CommunicationNotePublic", relatedObjectType: relatedObjectType, relatedObjectHashId: relatedObjectHashId})).unwrap()

        await setComments(results.data.communications.filter((comment) => { return ((trashedOnly && comment.trashed_at) || (!trashedOnly && !comment.trashed_at))}))

        const { hash } = window.location

        if (hash && hash.indexOf("comment-") >= 0) {
            const comment_hash_id = hash.split("-")[1]
            const comment = results.data.communications.find((comment) => ( !comment.trashed_at && comment.hash_id == comment_hash_id))

            if (comment) {
                setTimeout(() => {
                    const positionY = document.getElementById("comment-"+comment_hash_id).offsetTop
                    document.getElementsByClassName(containerClassName)[0].scrollTo(0, positionY - (containerClassName == "main-container" ? 140 : 0))
                }, 200)
            }
        }
    }

    async function handleTrashMessage() {
        await store.dispatch(trashCommunication({communication: deletingComment})).unwrap()

        setDeletingComment(null)
        handleTriggerReloadComments()
    }

    async function handleDeleteMessage() {
        await store.dispatch(deleteCommunication({communication: deletingComment})).unwrap()

        setDeletingComment(null)
        handleTriggerReloadComments()
    }

    function handleTriggerReloadComments() {

        setReloadComments(true)

        if (setReloadCommunications) setReloadCommunications(true)
    }

    return (
        <>
            <div className="spacer"></div>

            {comments &&
                <Formik
                    initialValues={{body: ""}}
                    onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
                        setBaseErrorMessage("")

                        values.type = type
                        values.sub_type = subType

                        // Try to figure out the mediums to use
                        if (comments && comments.length > 0) {

                            // If this is a resident, use the last comment
                            if (insightUtils.isResident(currentUser)) {
                                let lastComment = comments[comments.length - 1]
                                values.mediums = lastComment.mediums
                            }
                            else {
                                let filteredComments = comments.filter((comment) => (comment.to_type == "Property"))
                                if (filteredComments.length == 0) filteredComments = comments

                                // OLD WAY Use the medium of the message we are replying to values.mediums = filteredComments[filteredComments.length - 1].mediums
                                // Now: send it everywhere
                                values.mediums = ["chat", "email", "text"]
                            }
                        }

                        // Always include chat
                        if (!values.mediums) values.mediums = ["chat"]
                        else if (values.mediums.indexOf("chat") < 0) values.mediums.push("chat")

                        const results = await store.dispatch(saveCommunication({communication: values, relatedObjectType: relatedObjectType, relatedObjectHashId: relatedObjectHashId})).unwrap()
                        const response = results.data

                        console.log(response)
                        setSubmitting(false);

                        if (response.success) {
                            handleTriggerReloadComments()
                            resetForm()
                        }
                        else if (response.errors) {
                            setErrors(response.errors)

                            if (response.errors.base) {
                                setBaseErrorMessage([response.errors.base].flat().join(", "))
                            }

                            insightUtils.scrollTo('errors')
                        }

                    }}
                >
                    {({ isSubmitting, values }) => (
                        <Form style={{width: "100%"}}>
                            <div className={"conversation-wrap " + (extraClassName ? extraClassName : "") + (comments.length == 0 ? " conversation-empty" : "")}>


                                <h3>{title}{subType == "communications_center" &&  <div className="float-right hidden-print">
                                    <a className="btn btn-gray btn-small" onClick={() => window.print()}>&nbsp;Print <i className="fa fa-print"></i></a>
                                </div>}</h3>

                                {comments.map((comment, i) => {
                                    return <React.Fragment key={i}>
                                        {type == "system_email" ?
                                            <div className="convo-message" id={"comment-" + comment.hash_id}>
                                                <div className="convo-quote">
                                                    <h3>
                                                        System
                                                        <em>
                                                            <Moment fromNowDuring={86400*2000} date={comment.created_at} format="MM/DD/YYYY [at] hh:mm A" />
                                                            {insightUtils.isCompanyUserAtLeast(currentUser) && comment.recipients && comment.recipients.length > 0 && <> - {comment.recipients.join(", ")}</>}
                                                        </em>
                                                    </h3>
                                                    <p style={{whiteSpace: "pre-wrap"}}>{comment.body}</p>
                                                </div>
                                            </div>
                                            :
                                            (currentUser && comment.from && comment.from_type == "User" && comment.from_id == currentUser.id ?
                                                <div className="convo-message" id={"comment-" + comment.hash_id}>
                                                    <div className="convo-message-icons hidden-print">
                                                        {!trashedOnly && currentUser.communications_edit && <i onClick={() => setEditingComment(comment)} className="fal fa-edit btn-convo-message-edit"></i>}
                                                        {currentUser.communications_delete && <i onClick={() => setDeletingComment(comment)} className="fal fa-trash-alt btn-convo-message-delete"></i>}
                                                    </div>
                                                    <img className="flex-img-avatar hidden-print" src="/images/avatar-white-red.svg"/>
                                                    <div className="convo-quote">
                                                        <h3>You
                                                            <em>
                                                                <Moment fromNowDuring={86400*2000} date={comment.created_at} format="MM/DD/YYYY [at] hh:mm A" />
                                                                {insightUtils.isCompanyUserAtLeast(currentUser) && comment.recipients && comment.recipients.length > 0 && <> - {comment.recipients.join(", ")}</>}
                                                            </em>
                                                        </h3>

                                                        <p style={{whiteSpace: "pre-wrap"}}>{comment.body}</p>

                                                        {comment.sub_type == "announcement" && comment.related_object &&
                                                            <div className="hidden-print" style={{marginTop: "20px"}}>
                                                                <Link to={insightRoutes.announcementShow(currentUser, comment.related_object.hash_id)}>View Announcement{comment.related_object.attachment_count > 0 && "/Attachment"}{comment.related_object.attachment_count > 1 && "s"}</Link>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                                :
                                                <div className="convo-message convo-respondent" id={"comment-" + comment.hash_id}>
                                                    <img className="flex-img-avatar hidden-print" src="/images/avatar-white-red.svg"/>
                                                    <div className="convo-quote">
                                                        <h3>
                                                            {comment.from && comment.from.name}
                                                            <em>
                                                                <Moment fromNowDuring={86400*2000} date={comment.created_at} format="MM/DD/YYYY [at] hh:mm A" />
                                                            </em>
                                                        </h3>

                                                        <p style={{whiteSpace: "pre-wrap"}}>{comment.body}</p>

                                                        {comment.sub_type == "announcement" && comment.related_object &&
                                                            <div className="hidden-print" style={{marginTop: "20px"}}>
                                                                <Link to={insightRoutes.announcementShow(currentUser, comment.related_object.hash_id)}>View Announcement{comment.related_object.attachment_count > 0 && "/Attachment"}{comment.related_object.attachment_count > 1 && "s"}</Link>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>)
                                        }

                                    </React.Fragment>
                                })}

                                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                {!hideReply && !trashedOnly && type != "system_email" && currentUser.communications_edit && <div className="form-row form-reply">
                                    <FormItem label={addLabel || "Add a Reply"} name="body" optional={true} formItemClass="hidden-print">
                                        <Field component="textarea" rows={4} name="body" className="form-textarea form-input-white" placeholder=""/>
                                    </FormItem>
                                    <div className="form-nav hidden-print">
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Submit" : "Submitting..."}</span>
                                        </button>
                                    </div>
                                </div>}
                            </div>
                        </Form>
                    )}
                </Formik>
            }

            {deletingComment &&
                <Modal closeModal={() => setDeletingComment(null)}>
                    {
                        deletingComment.trashed_at ?
                            <>
                                <h2>Delete Message?</h2>
                                <p className="text-center">Are you sure you want to delete this message? This cannot be undone.</p>

                                <div className="form-nav">
                                    <div onClick={() => setDeletingComment(null)} className="btn btn-gray"><span>Cancel</span></div>
                                    <div onClick={() => handleDeleteMessage()} className="btn btn-red"><span>Delete Message</span></div>
                                </div>
                            </> :
                            <>
                                <h2>Move Message to Trash?</h2>
                                <p className="text-center">Are you sure you want to move this message to the trash?</p>

                                <div className="form-nav">
                                    <div onClick={() => setDeletingComment(null)} className="btn btn-gray"><span>Cancel</span></div>
                                    <div onClick={() => handleTrashMessage()} className="btn btn-red"><span>Delete Message</span></div>
                                </div>
                            </>
                    }
                </Modal>
            }

            {editingComment &&
            <Modal closeModal={() => setEditingComment(null)}>
                <h2>Edit Your Message</h2>

                <Formik
                    initialValues={editingComment}
                    onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
                        setBaseErrorMessage("")

                        try {
                            const results = await store.dispatch(saveCommunication({communication: values})).unwrap()
                            const response = results.data

                            console.log(response)
                            setSubmitting(false);

                            if (response.success) {
                                handleTriggerReloadComments()
                                setEditingComment(null)
                            } else if (response.errors) {
                                setErrors(response.errors)

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base.join(", "))
                                }

                                insightUtils.scrollTo('errors')
                            }
                        }
                        catch(e) {
                            console.log(e)
                            setBaseErrorMessage("Cannot send message")
                        }
                        finally {
                            setSubmitting(false)
                        }
                    }}
                >
                    {({ isSubmitting, values }) => (
                        <Form style={{width: "100%"}}>
                            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                            <div className="form new-resident-form">
                                <FormItem label="" name="body" optional={true}>
                                    <Field component="textarea" rows={4} name="body" className="form-textarea form-input-white" placeholder=""/>
                                </FormItem>

                                <div className="form-nav">
                                    <div onClick={() => setEditingComment(null)} className="btn btn-gray"><span>Cancel</span></div>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </Modal>
            }
        </>

    )}

export default CommentsView;

