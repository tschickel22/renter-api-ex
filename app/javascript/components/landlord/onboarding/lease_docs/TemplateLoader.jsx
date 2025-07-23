import React, { useEffect } from "react"
import store from "../../../../app/store";
import {
  getTemplate
} from "../../../../slices/documentsSlice";

const TemplateUpdater = ({ templateId, setTemplate }) => {

  useEffect(async () => {
    if (templateId) {
      await loadTemplate(templateId);
    }
  }, [templateId]);

  async function loadTemplate(templateId) {
    const result = await store
      .dispatch(getTemplate(templateId))
      .unwrap();
      setTemplate(result.data.template)
  }

  return null;
};

export default TemplateUpdater;