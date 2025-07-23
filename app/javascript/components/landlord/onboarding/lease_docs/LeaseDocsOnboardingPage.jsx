import React, { useState } from "react";
import { useSelector } from "react-redux";
import LeaseDocsOnboardingLandingView from "./LeaseDocsOnboardingLandingView";
import LeaseDocsPageView from "./LeaseDocsPageView";

const LeaseDocsOnboardingPage = ({}) => {
  const { currentCompany } = useSelector((state) => state.company);

  return (
    <>
      {currentCompany && !currentCompany.document_management_active ? (
        <>
          <LeaseDocsOnboardingLandingView />
        </>
      ) : (
        <>
          <LeaseDocsPageView />
        </>
      )}
    </>
  );
};

export default LeaseDocsOnboardingPage;
