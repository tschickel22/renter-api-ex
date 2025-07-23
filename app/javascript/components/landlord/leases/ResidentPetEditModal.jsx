import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";
import Modal from "../../shared/Modal";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {deleteResidentPet, loadResidentPet, saveResidentPet} from "../../../slices/residentPetSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";

const ResidentPetEditModal = ({}) => {
    let params = useParams()
    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    const [residentPet, setResidentPet] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        /*
           Load ResidentPet
         */
        if (!residentPet) {
            if (params.residentId) {
                setResidentPet(Object.assign(insightUtils.emptyResidentPet(), {resident_id: params.residentId}))
            }
            else {
                const results = await store.dispatch(loadResidentPet({residentPetId: params.residentPetId})).unwrap()
                setResidentPet(results.data.resident_pet)
            }
        }
    }, []);

    async function confirmDeletion() {
        if (confirm('Are you sure you want to delete this pet record?')) {
            await store.dispatch(deleteResidentPet({residentPet: residentPet})).unwrap()
            closeModal()
        }
    }

    function closeModal() {
        navigate(-1)
    }

    return (
        <>
        {residentPet &&
        <Modal extraClassName="overlay-box-small" closeModal={closeModal}>

            <h2>{residentPet.id ? <>Edit info for {residentPet.name}</> : <>Add Pet</>}</h2>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={residentPet}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    try {
                        const result = await store.dispatch(saveResidentPet({residentPet: values})).unwrap()
                        const response = result.data

                        console.log(response)

                        setSubmitting(false);

                        if (response.success) {
                            closeModal()
                        }
                        else if (response.errors) {
                            setErrors(response.errors)

                            if (response.errors.base) {
                                setBaseErrorMessage(response.errors.base)
                            }

                            insightUtils.scrollTo('errors')
                        }
                    }
                    catch(err) {
                        console.log("UH-OH", err)
                        setBaseErrorMessage("Unable to save resident pet")
                        setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="add-property-wrap">

                            <div className="form-row">
                                <FormItem label="Pet Name" name="name" />
                            </div>

                            <div className="form-row">
                                <FormItem label="Pet type" name="pet_type">
                                    <BasicDropdown name="pet_type" options={constants.pet_types} />
                                </FormItem>
                                <FormItem label="Weight" optional={true} name="weight" />
                            </div>

                            <div className="form-row">
                                <FormItem label="Breed" optional={true} name="breed" />
                                <FormItem label="Color" optional={true} name="color" />
                            </div>

                            <div className="form-row">
                                &nbsp;
                            </div>

                            <div className="form-nav">
                                <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                {residentPet.id && <a onClick={confirmDeletion} className="btn btn-gray"><span>Delete</span></a>}
                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
        }
        </>
    )}

export default ResidentPetEditModal;

