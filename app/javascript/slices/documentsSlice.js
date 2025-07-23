import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { client } from "../app/client";

const initialState = {
  constants: {},
  settingsConfig: {},
  settings: null,
  baseUrl: null,
  currentCompany: null,
  properties: null,
  vendors: null,
  items: null,
  floorPlanNames: null,
  chargeTypes: null,
  accountCategories: null,
  leadSources: null,
};

export const getDocuments = createAsyncThunk(
  "results/getCompanyDocuments",
  async ({ searchText = "", documentFor = "company"}) => {
    const response = await client.post("/api/internal/documents/search", {
      search_text: searchText,
      document_for: documentFor,
      document_type: "document",
    });

    return { data: response };
  }
);

export const getExternalDocuments = createAsyncThunk(
  "results/getCompanyExternalDocuments",
  async ({ searchText = "", documentFor = "company", documentType = "template", status = null }) => {
    const response = await client.post("/api/internal/documents/searchExternal", {
      search_text: searchText,
      document_for: documentFor,
      document_type: documentType,
      ...(status ? {status: status} : {})
    });

    return { data: response };
  }
);

export const destroyDocument = createAsyncThunk(
  "results/destroyDocument",
  async (documentId) => {
    const response = await client.post(
      "/api/internal/documents/destroy_document",
      { id: documentId }
    );
    return { data: response };
  }
);

export const destroyExternalDocument = createAsyncThunk(
  "results/destroyExternalDocument",
  async (documentId) => {
    const response = await client.post(
      "/api/internal/documents/destroy_external_document",
      { id: documentId }
    );
    return { data: response };
  }
);

export const sendDocumentForSignature = createAsyncThunk(
  "results/sendDocumentForSignature",
  async (documentId) => {
    console.log("START sendDocumentForSignature", { id: documentId });
    const response = await client.post(
      "/api/internal/documents/send_document_for_sign",
      { id: documentId }
    );
    console.log("END sendDocumentForSignature response", response);
    return { data: response };
  }
);

export const createDocumentForSigningFromDocument = createAsyncThunk(
  "results/createDocumentForSigningFromDocument",
  async ({ documentId, recipients, documentName, notes }) => {
    console.log("START createDocumentForSigningFromDocument", {
      id: documentId,
      recipientIds: recipients,
      documentName: documentName,
    });
    const response = await client.post(
      "/api/internal/documents/create_document",
      { id: documentId, recipients: recipients, document_name: documentName, notes: notes }
    );
    console.log("END createDocumentForSigningFromDocument");
    return { data: response };
  }
);

export const createDocumentForSigningFromTemplate = createAsyncThunk(
  "results/createDocumentForSigningFromTemplate",
  async ({ documentId, recipients, documentName }) => {
    console.log("START createDocumentForSigningFromTemplate", {
      id: documentId,
      recipients: recipients,
      documentName: documentName,
    });
    const response = await client.post(
      "/api/internal/documents/create_document_from_template",
      { id: documentId, recipients: recipients, document_name: documentName }
    );
    console.log("END createDocumentForSigningFromTemplate");
    return { data: response };
  }
);

export const createTemplate = createAsyncThunk(
  "results/createTemplate",
  async (document) => {
    console.log("START createTemplate", { id: document.id });
    const response = await client.post(
      "/api/internal/documents/create_template",
      { id: document.id, document_name: document.document_name }
    );
    console.log("END createTemplate");
    return { data: response };
  }
);

export const getTemplate = createAsyncThunk(
  "results/getTemplate",
  async (templateId) => {
    console.log("START getTemplate", { id: templateId });
    const response = await client.post("/api/internal/documents/get_template", {
      id: templateId,
    });
    console.log("END getTemplate");
    return { data: response };
  }
);

export const getSigningIframeDetails = createAsyncThunk(
  "results/getSigningIframeDetails",
  async (externalDocumentId) => {
    console.log("START getSigningIframeDetails", { id: externalDocumentId });
    const response = await client.get(
      `/api/internal/documents/external_document/${externalDocumentId}/get_signing_iframe_details`
    );
    console.log("END getSigningIframeDetails");
    return { data: response };
  }
);

export const getLeaseDocuments = createAsyncThunk(
  "results/getLeaseDocuments",
  async (leaseId) => {
    console.log("START getLeaseDocuments", leaseId);
    const response = await client.get(
      `/api/internal/documents/lease/${leaseId}`
    );
    console.log("END getLeaseDocuments");
    return { data: response };
  }
);

export const sendExternalDocReminders = createAsyncThunk(
  "results/sendExternalDocReminders",
  async (documentId) => {
    const response = await client.post(
      "/api/internal/documents/send_document_reminders",
      { id: documentId }
    );
    return { data: response };
  }
);

const documentsSignSlice = createSlice({
  name: "zohoSign",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});


export const {} = documentsSignSlice.actions;

export default documentsSignSlice.reducer;
