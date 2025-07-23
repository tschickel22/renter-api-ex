import React, { useState, useEffect, useRef } from "react";
import { Form, Formik, Field, useFormikContext } from "formik";
import { v4 as uuidv4 } from "uuid";
import FormItem from "../../../shared/FormItem";
import { useSelector } from "react-redux";
import BasicDropdown from "../../../shared/BasicDropdown";
import MultiDropdown from "../../../shared/MultiDropdown";
import {
  loadLeasesForDocuments,
  loadResidents as loadLeaseResidents,
} from "../../../../slices/leaseSlice";
import { loadResidents as loadPropertyResidents } from "../../../../slices/propertySlice";

import store from "../../../../app/store";
import { MenuItem } from "@mui/material";
import ToolTip from "../../../shared/ToolTip";
import insightUtils from "../../../../app/insightUtils";

const FormStateUpdater = ({ setFormData }) => {
  const { values } = useFormikContext();

  useEffect(() => {
    setFormData(values);
  }, [values, setFormData]);

  return null;
};

const RecipientsForm = ({
  documentPayload,
  formData,
  setFormData,
  baseErrorMessage,
  setFormIsValid,
}) => {
  // @ts-ignore
  const { constants, properties } = useSelector((state) => state.company);
  const [currentLeases, setCurrentLeases] = useState([]);
  const currentProperties = _processProperties(properties);
  const [allRecipients, setAllRecipients] = useState([]);
  const [propertyId, setPropertyId] = useState(documentPayload.property_id);
  const [leaseId, setLeaseId] = useState(documentPayload.lease_id);
  const { currentUser } = useSelector((state) => state.user);
  const [formErrors, setFormErrors] = useState({});
  const formikRef = useRef(null);

  useEffect(() => {
    if (documentPayload && documentPayload?.documents[0]?.property_id) {
      setPropertyId(documentPayload?.documents[0]?.property_id);
    }

    if (documentPayload?.documents[0]?.lease_id) {
      setLeaseId(documentPayload?.documents[0]?.lease_id);
      loadLeaseData();
    }
  }, [documentPayload]);

  useEffect(() => {
    if (propertyId) {
      console.log("load property data", 1);
      loadPropertyData();
    } else {
      console.log("nothing  property data", 2);
    }

  }, [propertyId]);

  useEffect(() => {
    // reset recipients when lease changes
    setAllRecipients([]);
    if (leaseId) {
      console.log("lease data", 1);
      loadLeaseData();
    } else if (propertyId) {
      console.log("property data", 2);
      loadPropertyData();
    }
  }, [leaseId]);

  async function handlePropertySelected(event) {
    setPropertyId(event.target.value);
    setLeaseId(null);
    setCurrentLeases([]);
    setAllRecipients([]);
    formikRef.current.setValues({
      ...formData,
      leaseId: null,
      recipients: [],
    });
  }

  async function loadPropertyData() {
    const results = await store
      // @ts-ignore
      .dispatch(loadLeasesForDocuments({ propertyId: propertyId }))
      .unwrap();
    setCurrentLeases(_processLeaseResponse(results.data.leases));

    if (!leaseId) {
      const residentResults = await store
        // @ts-ignore
        .dispatch(loadPropertyResidents({ propertyId: propertyId }))
        .unwrap();

      setAllRecipients(residentResults.data.users);
    }
  }

  async function handleLeaseSelected(event) {
    setAllRecipients([]);
    setLeaseId(event.target.value);
    formikRef.current.setValues({
      ...formData,
      recipients: [],
    });
  }

  async function loadLeaseData(lId = null) {
    const residentResults = await store
      // @ts-ignore
      .dispatch(loadLeaseResidents({ leaseId: leaseId }))
      .unwrap();

    setAllRecipients(
      _processResidents(residentResults.data.users, residentResults.data.users)
    );
  }

  function _processLeaseResponse(leases = []) {
    return leases.map((l) => ({
      id: l.id,
      name: `${l.unit.full_address} - ${
        l.primary_resident.resident.name
      } - ${insightUtils.getLabel(l.status, constants.lease_statuses)}`,
    }));
  }

  function _processProperties(properties = []) {
    if (properties) {
      return properties.map((p) => ({ id: p.id, name: p.name }));
    }
  }

  function _processResidents(users = []) {
    return users;
  }

  // Set Recipients from dropdown
  const setRecipients = (recipients = []) => {
    // update dropdown recipient to include form data if it exists
    formikRef.current.setValues({
      ...formData,
      recipients: recipients,
    });

    recipients.forEach((recipient, index) => {
      if (recipient.name) {
        formikRef.current.setFieldTouched(`${index}_recipient_name`, true);
      }
      if (recipient.email) {
        formikRef.current.setFieldTouched(`${index}_recipient_email`, true);
      }
      if (recipient.phone) {
        formikRef.current.setFieldTouched(`${index}_recipient_phone`, true);
      }
    });

    validateRecipiens(recipients);
  };

  // Add Me or Add New
  const addRecipient = (recipient = {}) => {
    let newFormRecipient;
    // don't add duplicates

    if (recipient.id) {
      newFormRecipient = allRecipients.find((r) => r.id === recipient.id);
    }

    if (!newFormRecipient) {
      // Add recipient to dropdown recipients
      newFormRecipient = {
        id: recipient.id ?? uuidv4(),
        email: recipient.email ?? "",
        name: recipient.name ?? "",
        phone: recipient.phone_number ?? "",
        role: "New",
      };

      // Add recipient to dropdown recipients
      const newAllRecipients = [...allRecipients, newFormRecipient];
      setAllRecipients(newAllRecipients);
    }

    // Add recipient to formData recipients
    const foundFormDataRecipient = formikRef.current.values.recipients.find(
      (r) => r.id === newFormRecipient.id
    );

    console.log("foundFormDataRecipient", foundFormDataRecipient);
    if (!foundFormDataRecipient) {
      const newFormRecipients = [...formData.recipients, newFormRecipient];
      formikRef.current.setValues({
        ...formData,
        recipients: newFormRecipients,
      });

      newFormRecipients.forEach((recipient, index) => {
        if (recipient.id === newFormRecipient.id) {
          if (recipient.email) {
            formikRef.current.setFieldTouched(`${index}_recipient_email`, true);
          } else {
            formikRef.current.setFieldTouched(
              `${index}_recipient_email`,
              false
            );
          }

          if (recipient.phone) {
            formikRef.current.setFieldTouched(`${index}_recipient_phone`, true);
          } else {
            formikRef.current.setFieldTouched(
              `${index}_recipient_phone`,
              false
            );
          }

          if (recipient.name) {
            formikRef.current.setFieldTouched(`${index}_recipient_name`, true);
          } else {
            formikRef.current.setFieldTouched(`${index}_recipient_name`, false);
          }
        }
      });

      validateRecipiens(newFormRecipients);
    }
  };

  const updateRecipient = (recipient, field, value) => {
    // Update recipient in dropdown recipients
    const newAllRecipients = allRecipients.map((r) =>
      r.id === recipient.id ? { ...r, [field]: value } : r
    );
    setAllRecipients(newAllRecipients);

    // Update recipient in formData recipients
    const newRecipients = formData.recipients.map((r) =>
      r.id === recipient.id ? { ...r, [field]: value } : r
    );
    formikRef.current.setValues({
      ...formData,
      recipients: newRecipients,
    });
    validateRecipiens(newRecipients);
  };

  // Remove
  const removeRecipient = (recipient) => {
    // remove recipient from allRecipients
    const newAllRecipients = allRecipients.filter((r) => {
      return r.id != recipient.id;
    });
    setAllRecipients(newAllRecipients);

    // remove recipient from formData recipients
    const newRecipients = formData.recipients.filter((r) => {
      return r.id != recipient.id;
    });
    formikRef.current.setValues({
      ...formData,
      recipients: newRecipients,
    });
    validateRecipiens(newRecipients);
  };

  const validateRecipiens = (recipients = []) => {
    let errors = {};
    setFormErrors({});

    recipients.forEach((recipient, index) => {
      errors = validateEmail(
        `${index}_recipient_email`,
        recipient.email,
        errors
      );

      errors = validatePhoneNumber(
        `${index}_recipient_phone`,
        recipient.phone,
        errors
      );
      if (!recipient.phone && !recipient.email) {
        errors[`${index}_recipient_phone_email`] =
          "Email and phone number cannot both be empty";
      }

      errors = validateName(`${index}_recipient_name`, recipient.name, errors);
    });

    setFormErrors(errors);

    setFormIsValid(formValid(errors, recipients));
  };

  const validatePhoneNumber = (field, value, errors) => {
    1;
    let error;

    if (value) {
      const digitsOnly = value.replace(/\D/g, "");

      if (digitsOnly.length != 10) {
        error = "Phone number is not valid";
      }
    }

    errors = {
      ...errors,
      [field]: error,
    };

    return errors;
  };

  const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (field, value, errors) => {
    let error;
    if (value && !emailRegExp.test(value)) {
      error = "Email is not valid";
    }

    errors = {
      ...errors,
      [field]: error,
    };

    return errors;
  };

  const validateName = (field, value, errors) => {
    let error;
    if (!value) {
      error = "Name is required";
    }

    errors = {
      ...errors,
      [field]: error,
    };

    return errors;
  };

  const formValid = (errors, recipients) => {
    return (
      Object.values(errors).every((error) => error === undefined) &&
      formData.documentName &&
      recipients.length
    );
  };

  return (
    <>
      <div className="section">
        {baseErrorMessage && (
          <div className="text-error">{baseErrorMessage}</div>
        )}
        <Formik initialValues={formData} innerRef={formikRef}>
          {({ setFieldValue, values, touched }) => (
            <>
              <FormStateUpdater setFormData={setFormData} />
              <div className="add-property-wrap">
                <div className="form-row">
                  <div className="st-col-100 st-col-md-100">
                    <div className="st-col-50 st-col-md-100">
                      {!document.from_upload && (
                        <FormItem
                          formItemClass="form-item-100"
                          name="documentName"
                          label="Document Name"
                        >
                          <Field
                            type="text"
                            name="documentName"
                            className="form-input form-input-white"
                            placeholder="Document Name"
                          />
                        </FormItem>
                      )}
                    </div>
                    <div className="st-col-50 st-col-md-100">
                      <FormItem
                        optional
                        label="Property"
                        name="propertyId"
                        formItemClass="form-item-100"
                      >
                        <BasicDropdown
                          blankText="No Property"
                          name="propertyId"
                          onChange={(e) => {
                            handlePropertySelected(e);
                            setFieldValue("propertyId", e.target.value);
                          }}
                          options={currentProperties}
                          extraClass="form-select-wide"
                        />
                      </FormItem>
                      {propertyId && (
                        <FormItem
                          optional
                          label="Lease"
                          name="leaseId"
                          formItemClass="form-item-100"
                        >
                          <BasicDropdown
                            blankText="No Lease"
                            name="leaseId"
                            onChange={(e) => {
                              handleLeaseSelected(e);
                              setFieldValue("leaseId", e.target.value);
                            }}
                            options={currentLeases}
                            extraClass="form-select-wide"
                          />
                        </FormItem>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="st-col-100 st-col-md-100">
                    <div className="form-row">
                      <div className="st-col-50 st-col-md-100">
                        <FormItem
                          label="Recipients"
                          name="recipients"
                          formItemClass="form-item-100"
                        >
                          <MultiDropdown
                            name="recipients"
                            groupBy="role"
                            handleChange={(e) => setRecipients(e)}
                            options={allRecipients}
                          />
                          {formData.recipients.length === 0 && (
                            <div className="text-error">
                              As at least one recipient is required
                            </div>
                          )}
                        </FormItem>
                      </div>
                      <div className="st-col-10 st-col-md-100">
                        <button
                          type="button"
                          className="btn btn-red mt-29"
                          onClick={() => {
                            addRecipient(currentUser);
                          }}
                        >
                          Add Me
                        </button>
                      </div>
                      <div className="st-col-10 st-col-md-100">
                        <button
                          type="button"
                          className="btn btn-red mt-29 ml-10"
                          onClick={() => addRecipient({})}
                        >
                          Add New
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-row mb-10">
                  {formData.recipients.length > 0 && (
                    <div className="st-col-100 st-col-md-100">
                      {values.recipients.map((recipient, index) => {
                        return (
                          <div
                            className="form-row mb-10"
                            key={`recipient-${recipient.id}-${index}`}
                          >
                            <div className="st-col-33 st-col-md-100">
                              {index === 0 ? (
                                <FormItem
                                  formItemClass="form-item-100"
                                  name={`${index}_recipient_email`}
                                  label="Email"
                                >
                                  <Field
                                    type="text"
                                    name={`${index}_recipient_email`}
                                    className="form-input form-input-white"
                                    placeholder="Recipient Email"
                                    defaultValue={recipient.email}
                                    onChange={(e) =>
                                      updateRecipient(
                                        recipient,
                                        "email",
                                        e.target.value
                                      )
                                    }
                                  />
                                </FormItem>
                              ) : (
                                <Field
                                  type="text"
                                  name={`${index}_recipient_email`}
                                  className="form-input form-input-white"
                                  placeholder="Recipient Email"
                                  defaultValue={recipient.email}
                                  onChange={(e) =>
                                    updateRecipient(
                                      recipient,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                              {(touched[`${index}_recipient_email`] ||
                                touched[`${index}_recipient_phone`]) &&
                              formErrors[`${index}_recipient_phone_email`] ? (
                                <div className="text-error">
                                  {formErrors[`${index}_recipient_phone_email`]}
                                </div>
                              ) : (
                                touched[`${index}_recipient_email`] &&
                                formErrors[`${index}_recipient_email`] && (
                                  <div className="text-error">
                                    {formErrors[`${index}_recipient_email`]}
                                  </div>
                                )
                              )}
                            </div>
                            <div className="st-col-33 st-col-md-100">
                              {index === 0 ? (
                                <FormItem
                                  formItemClass="form-item-100"
                                  name={`${index}_recipient_name`}
                                  label="Name"
                                >
                                  <Field
                                    type="text"
                                    name={`${index}_recipient_name`}
                                    className="form-input form-input-white"
                                    placeholder="Recipient Name"
                                    defaultValue={recipient.name}
                                    onChange={(e) =>
                                      updateRecipient(
                                        recipient,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                  />
                                </FormItem>
                              ) : (
                                <Field
                                  type="text"
                                  name={`${index}_recipient_name`}
                                  className="form-input form-input-white"
                                  placeholder="Recipient Name"
                                  defaultValue={recipient.name}
                                  onChange={(e) =>
                                    updateRecipient(
                                      recipient,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                              {touched[`${index}_recipient_name`] &&
                                formErrors[`${index}_recipient_name`] && (
                                  <div className="text-error">
                                    {formErrors[`${index}_recipient_name`]}
                                  </div>
                                )}
                            </div>
                            <div className="st-col-25 st-col-md-100">
                              {index === 0 ? (
                                <FormItem
                                  formItemClass="form-item-100"
                                  name={`${index}_recipient_phone`}
                                  label={
                                    <>
                                      Phone
                                      <ToolTip
                                        icon={
                                          <i className="far fa-question-circle"></i>
                                        }
                                        explanation={
                                          "SMS sign link sent with valid cell phone #"
                                        }
                                      />
                                    </>
                                  }
                                  optional
                                >
                                  <Field
                                    type="text"
                                    name={`${index}_recipient_phone`}
                                    className="form-input form-input-white"
                                    placeholder="Phone"
                                    defaultValue={recipient.phone}
                                    onChange={(e) =>
                                      updateRecipient(
                                        recipient,
                                        "phone",
                                        e.target.value
                                      )
                                    }
                                  />
                                </FormItem>
                              ) : (
                                <Field
                                  type="text"
                                  name={`${index}_recipient_phone`}
                                  className="form-input form-input-white"
                                  placeholder="Phone"
                                  defaultValue={recipient.phone}
                                  onChange={(e) =>
                                    updateRecipient(
                                      recipient,
                                      "phone",
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                              {touched[`${index}_recipient_phone`] &&
                                !formErrors[`${index}_recipient_phone_email`] &&
                                formErrors[`${index}_recipient_phone`] && (
                                  <div className="text-error">
                                    {formErrors[`${index}_recipient_phone`]}
                                  </div>
                                )}
                            </div>
                            <div className="st-col-25 st-col-md-100">
                              <button
                                type="button"
                                className={`btn btn-red ${
                                  index === 0 ? "mt-29" : ""
                                }`}
                                onClick={() => removeRecipient(recipient)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="st-col-100 st-col-md-100">
                    <div className="st-col-50 st-col-md-100">
                      <div className="form-row">
                        <FormItem label="Notes" name="notes" optional={true}>
                          <Field
                            defaultValue=""
                            component="textarea"
                            rows={4}
                            name="notes"
                            className="form-input form-input-white"
                            placeholder=""
                          />
                        </FormItem>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Formik>
      </div>
    </>
  );
};

export default RecipientsForm;
