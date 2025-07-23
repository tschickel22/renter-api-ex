import store from "../../../../app/store";
import {
  destroyDocument,
  destroyExternalDocument,
  createTemplate,
  createDocumentForSigningFromDocument,
  createDocumentForSigningFromTemplate,
  sendExternalDocReminders,
} from "../../../../slices/documentsSlice";
import { displayAlertMessage } from "../../../../slices/dashboardSlice";

export async function deleteDocument(document, callback) {
  // @ts-ignore
  await store.dispatch(destroyDocument(document.id)).unwrap();
  callback();
}

export async function deleteExternalDocument(externalDocument, callback) {
  // @ts-ignore
  await store.dispatch(destroyExternalDocument(externalDocument.id)).unwrap();
  callback();
}

export async function sendExternalDocumentReminders(externalDocument, callback) {
  // @ts-ignore
  await store.dispatch(sendExternalDocReminders(externalDocument.id)).unwrap();
  callback();
}

export async function createTemplateFromDocument(document, callback) {
  // @ts-ignore
  const result = await store.dispatch(createTemplate(document)).unwrap();
  const { data } = result;
  if (!data.success) {
    store.dispatch(displayAlertMessage({ message: data.message }));
  }
  callback();
}

export async function createDocumentFromDocument(documentsPayload, formData, callback) {
  try {
    const result = await store
      .dispatch(
        // @ts-ignore
        createDocumentForSigningFromDocument({
          // We create a document based on the group_id from any document in the group
          // id of first document is enough to create the document
          documentId: documentsPayload.documents[0].id,
          recipients: formData.recipients,
          documentName: formData.documentName,
          notes: formData.notes,
        })
      )
      .unwrap();

    callback();

    return result;
  } catch (error) {
    return {
      data: {
        success: false
      }
    }
  }


}

export async function createDocumentFromTemplate(document, formData, callback) {
  await store
    .dispatch(
      // @ts-ignore
      createDocumentForSigningFromTemplate({
        documentId: document.id,
        recipients: formData.recipients,
        documentName: formData.documentName,
      })
    )
    .unwrap();

  callback();
}
