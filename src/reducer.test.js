import {
  describe, expect, it, vi,
} from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => vi.importActual("@openimis/fe-core/helpers/api"));

const { default: reducer, ACTION_TYPE } = await import("./reducer");
const { ERROR, REQUEST, SUCCESS } = await import("./utils/action-types");
const {
  globalId, graphqlErrors, relayPage, serverError,
} = await import("@openimis/fe-core/testing");

const initial = () => reducer(undefined, { type: "@@INIT" });
const dispatch = (state, type, { payload, meta } = {}) => reducer(state, { type, payload, meta });

const EMPTY_SUMMARY = {
  totalClaimsInBatch: null,
  reviewedPercentage: null,
  deductiblePercentage: null,
  validationError: null,
};

describe("claim sampling reducer", () => {
  it("starts with nothing loaded and nothing in flight", () => {
    const state = initial();

    expect(state.submittingMutation).toBe(false);
    expect(state.claimsInSample).toEqual([]);
    expect(state.allClaimsInSample).toEqual([]);
    expect(state.samplingSummary).toEqual({ fetching: false, fetched: false, ...EMPTY_SUMMARY });
  });

  it("returns the same state object for an unrelated action", () => {
    const state = initial();

    expect(reducer(state, { type: "SOMETHING_ELSE" })).toBe(state);
  });

  describe.each([
    ["sampled claims", ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING, "ClaimsInSample", "claimsInSample"],
    ["all claims of the batch", ACTION_TYPE.GET_ALL_CLAIMS_FOR_SAMPLING, "AllClaimsInSample", "allClaimsInSample"],
  ])("%s", (_label, actionType, suffix, field) => {
    it("empties the list and marks it in flight when the request starts", () => {
      const stale = { ...initial(), [field]: [{ id: "stale" }], [`errorFetching${suffix}`]: { code: 500 } };
      const state = dispatch(stale, REQUEST(actionType));

      expect(state[field]).toEqual([]);
      expect(state[`fetching${suffix}`]).toBe(true);
      expect(state[`fetched${suffix}`]).toBe(false);
      expect(state[`errorFetching${suffix}`]).toBeNull();
    });

    it("decodes the claim ids and keeps the page info", () => {
      const state = dispatch(initial(), SUCCESS(actionType), {
        payload: {
          data: {
            samplingBatchClaims: relayPage(
              [{ id: globalId("ClaimGQLType", "11"), code: "C1" }, { id: globalId("ClaimGQLType", "12"), code: "C2" }],
              { totalCount: 7, pageInfo: { hasNextPage: true } },
            ),
          },
        },
      });

      expect(state[field]).toEqual([{ id: "11", code: "C1" }, { id: "12", code: "C2" }]);
      expect(state[`fetched${suffix}PageInfo`]).toMatchObject({ totalCount: 7, hasNextPage: true });
      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`fetched${suffix}`]).toBe(true);
      expect(state[`errorFetching${suffix}`]).toBeNull();
    });

    it("reports GraphQL errors returned alongside the data", () => {
      const state = dispatch(initial(), SUCCESS(actionType), {
        payload: { data: { samplingBatchClaims: null }, ...graphqlErrors("no batch") },
      });

      expect(state[field]).toEqual([]);
      expect(state[`errorFetching${suffix}`]).toMatchObject({ detail: "no batch" });
    });

    it("stops fetching when the request fails", () => {
      const state = dispatch(dispatch(initial(), REQUEST(actionType)), ERROR(actionType), {
        payload: serverError(500, "Internal Server Error", "boom"),
      });

      expect(state[`fetching${suffix}`]).toBe(false);
    });

    // Currently fails: this branch formats a transport failure as a GraphQL one, so the error is null
    it.fails("reports a transport failure of the request", () => {
      const state = dispatch(dispatch(initial(), REQUEST(actionType)), ERROR(actionType), {
        payload: serverError(500, "Internal Server Error", "boom"),
      });

      expect(state[`errorFetching${suffix}`]).toEqual({ code: 500, message: "Internal Server Error", detail: "boom" });
    });
  });

  describe("sampling summary", () => {
    it("resets the summary while it is being fetched", () => {
      const loaded = { ...initial(), samplingSummary: { fetched: true, totalClaimsInBatch: 10 } };

      expect(dispatch(loaded, REQUEST(ACTION_TYPE.GET_SAMPLING_SUMMARY)).samplingSummary)
        .toEqual({ fetching: true, fetched: false, ...EMPTY_SUMMARY });
    });

    it("stores the figures the server returns", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_SAMPLING_SUMMARY), {
        payload: { data: { samplingSummary: { totalClaimsInBatch: 10, reviewedPercentage: 40, deductiblePercentage: 5 } } },
      });

      expect(state.samplingSummary).toEqual({
        totalClaimsInBatch: 10, reviewedPercentage: 40, deductiblePercentage: 5, fetching: false, fetched: true,
      });
    });

    // Currently fails: the reducer calls formatServerError without importing it, so a failed
    // summary request throws a ReferenceError and the summary is left looking busy.
    it.fails("records the error when the summary request fails", () => {
      const state = dispatch(
        dispatch(initial(), REQUEST(ACTION_TYPE.GET_SAMPLING_SUMMARY)),
        ERROR(ACTION_TYPE.GET_SAMPLING_SUMMARY),
        { payload: serverError(500, "Internal Server Error", "boom") },
      );

      expect(state.samplingSummary).toEqual({
        fetching: false,
        fetched: true,
        ...EMPTY_SUMMARY,
        validationError: { code: 500, message: "Internal Server Error", detail: "boom" },
      });
    });

    it("forgets the summary when cleared", () => {
      const loaded = { ...initial(), samplingSummary: { fetched: true, totalClaimsInBatch: 10 } };

      expect(dispatch(loaded, "GET_SAMPLING_SUMMARY_CLEAR").samplingSummary)
        .toEqual({ fetching: false, fetched: false, ...EMPTY_SUMMARY });
    });
  });

  describe("mutations", () => {
    const submitting = () => dispatch(initial(), REQUEST(ACTION_TYPE.MUTATION), {
      meta: { clientMutationId: "cmid-1", clientMutationLabel: "Create sampling batch" },
    });

    it("records the request metadata while a mutation is in flight", () => {
      expect(submitting()).toMatchObject({
        submittingMutation: true,
        mutation: { id: "cmid-1", clientMutationLabel: "Create sampling batch" },
      });
    });

    it.each([
      [ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH, "createClaimSamplingBatch"],
      [ACTION_TYPE.RESOLVE_TASK, "resolveTask"],
    ])("clears the in-flight flag and keeps the internal id of %s", (actionType, service) => {
      const state = dispatch(submitting(), SUCCESS(actionType), {
        payload: { data: { [service]: { internalId: "internal-1" } } },
      });

      expect(state.submittingMutation).toBe(false);
      expect(state.mutation.id).toBe("internal-1");
    });

    it("raises an alert when a mutation fails", () => {
      const state = dispatch(submitting(), ERROR(ACTION_TYPE.MUTATION), { payload: { status: 500 } });

      expect(JSON.parse(state.alert)).toEqual({ status: 500 });
    });

    // Currently fails: fe-core's dispatchMutationErr only sets the alert, so the flag
    // REQUEST(MUTATION) raised is never lowered after a failure.
    it.fails("stops submitting once a mutation has failed", () => {
      const state = dispatch(submitting(), ERROR(ACTION_TYPE.MUTATION), { payload: { status: 500 } });

      expect(state.submittingMutation).toBe(false);
    });
  });
});
