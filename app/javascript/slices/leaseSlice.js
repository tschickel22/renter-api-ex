import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { client } from "../app/client";

const initialState = {};

export const loadLease = createAsyncThunk(
  "results/loadLease",
  // @ts-ignore
  async ({ leaseId }) => {
    const response = await client.get("/api/internal/leases/" + leaseId);
    return { data: response };
  }
);

export const loadCurrentLeases = createAsyncThunk(
  "results/loadCurrentLeases",
  // @ts-ignore
  async ({ propertyId }) => {
    const response = await client.post("/api/internal/leases/current", {
      property_id: propertyId,
    });
    return { data: response };
  }
);

export const loadLeasesForDocuments = createAsyncThunk(
  "results/loadLeasesForDocuments",
  // @ts-ignore
  async ({ propertyId }) => {
    const response = await client.post("/api/internal/leases/for_documents", {
      property_id: propertyId,
    });
    return { data: response };
  }
);

export const determineCheckPrintingEligibility = createAsyncThunk(
  "results/determineCheckPrintingEligibility",
  // @ts-ignore
  async ({ leaseId }) => {
    const response = await client.get(
      "/api/internal/leases/" +
        leaseId +
        "/determine_check_printing_eligibility"
    );
    return { data: response };
  }
);

export const createLease = createAsyncThunk(
  "results/createLease",
  // @ts-ignore
  async ({ propertyId, unitId }) => {
    const response = await client.post("/api/internal/leases", {
      property_id: propertyId,
      unit_id: unitId,
    });
    return { data: response };
  }
);

export const createExistingLease = createAsyncThunk(
  "results/createExistingLease",
  async (lease) => {
    const response = await client.post("/api/internal/leases/create_existing", {
      lease: lease,
    });
    return { data: response };
  }
);

export const saveLease = createAsyncThunk(
  "results/saveLease",
  // @ts-ignore
  async ({ lease }) => {
    let url = "/api/internal/leases";
    let method = "POST";

    if (lease.hash_id) {
      url += "/" + lease.hash_id;
      method = "PUT";
    }

    const response = await client.call(method, url, { lease: lease });
    return { data: response };
  }
);

export const searchForLeases = createAsyncThunk(
  "results/searchForLeases",
  // @ts-ignore
  async ({ propertyId, searchText, mode, status, daysFrom, daysTo }) => {
    const response = await client.post("/api/internal/leases/search", {
      property_id: propertyId,
      search_text: searchText,
      mode: mode,
      status: status,
      days_from: daysFrom,
      days_to: daysTo,
    });
    return { data: response };
  }
);

export const cancelMoveIn = createAsyncThunk(
  "results/cancelMoveIn",
  // @ts-ignore
  async ({ leaseId, paymentsToRefund }) => {
    const response = await client.post(
      "/api/internal/leases/" + leaseId + "/cancel_move_in",
      { payments_to_refund: paymentsToRefund }
    );
    return { data: response };
  }
);

export const getLeaseDocuments = createAsyncThunk(
  "results/getLeaseDocuments",
  // @ts-ignore
  async ({ leaseId }) => {
    const response = await client.get(
      "/api/internal/leases/" + leaseId + "/lease_documents"
    );
    return { data: response };
  }
);

export const getMoveOutDocuments = createAsyncThunk(
  "results/getMoveOutDocuments",
  // @ts-ignore
  async ({ leaseId }) => {
    const response = await client.get(
      "/api/internal/leases/" + leaseId + "/move_out_documents"
    );
    return { data: response };
  }
);

export const loadResidents = createAsyncThunk(
  "results/loadResidents",
  // @ts-ignore
  async ({ leaseId }) => {
    let url = "/api/internal/leases/" + leaseId + "/residents";
    let response = await client.get(url, {});
    return { data: response };
  }
);

const leaseSlice = createSlice({
  name: "lease",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = leaseSlice.actions;

export default leaseSlice.reducer;
