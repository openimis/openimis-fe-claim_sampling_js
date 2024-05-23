import { REQUEST, ERROR, SUCCESS } from "./utils/action-types";
import {
  parseData,
  pageInfo,
  formatGraphQLError,
  dispatchMutationResp,
  dispatchMutationErr,
  dispatchMutationReq,
  decodeId
} from "@openimis/fe-core";

export const ACTION_TYPE = {
  MUTATION: "CLAIM_SAMPLING_MUTATION",
  CREATE_CLAIM_SAMPLING_BATCH: "CLAIM_SAMPLING_BATCH_CREATE",
  GET_CLAIMS_FOR_SAMPLING: "GET_CLAIMS_FOR_SAMPLING",
  RESOLVE_TASK: 'TASK_MANAGEMENT_RESOLVE_TASK',
  GET_SAMPLING_SUMMARY: 'GET_SAMPLING_SUMMARY'
};

function reducer(
  state = {
    submittingMutation: false,
    claimsInSample: [],
    fetchingClaimsInSample: false, 
    fetchedClaimsInSample: true,
    errorFetchingClaimsInSample: null,
    fetchedClaimsInSamplePageInfo: {},
    samplingSummary: {
      fetching: false,
      fetched: false,
      totalClaimsInBatch: null,
      reviewedPercentage: null,
      deductiblePercentage: null,
      validationError: null,
    },
    mutation: {},
  },
  action,
) {
  switch (action.type) {
    case REQUEST(ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return dispatchMutationErr(state, action);
    case SUCCESS(ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH):
      return dispatchMutationResp(state, "createClaimSamplingBatch", action);
    case REQUEST(ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING):
      return {
        ...state,
        claimsInSample: [],
        fetchingClaimsInSample: true,
        fetchedClaimsInSample: false,
        errorFetchingClaimsInSample: null,
      };
    case SUCCESS(ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING):
      return {
        ...state,
        claimsInSample:  parseData(action.payload.data.samplingBatchClaims)?.map((i) => ({
          ...i,
          id: decodeId(i.id),
        })),
        fetchedClaimsInSamplePageInfo: pageInfo(action.payload.data.samplingBatchClaims),
        fetchingClaimsInSample: false,
        fetchedClaimsInSample: true,
        errorFetchingClaimsInSample: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING):
      return {
        ...state,
        fetchingClaimsInSample: false,
        errorFetchingClaimsInSample: formatGraphQLError(action.payload),
      };
    case SUCCESS(ACTION_TYPE.RESOLVE_TASK):
      return dispatchMutationResp(state, 'resolveTask', action);
    case "GET_SAMPLING_SUMMARY_REQ":
      return {
        ...state,
        samplingSummary: {
          fetching: true,
          fetched: false,
          totalClaimsInBatch: null,
          reviewedPercentage: null,
          deductiblePercentage: null,
          validationError: null,
        },
      };
    case "GET_SAMPLING_SUMMARY_RESP":
      console.log("NEW PAYLOAD: ", action.payload?.data)
      return {
        ...state,
        samplingSummary: {
          ...action.payload?.data.samplingSummary,
          fetching: false,
          fetched: true,
        },
      };
    case "GET_SAMPLING_SUMMARY_ERR":
      return {
        ...state,
        samplingSummary: {
          fetching: false,
          fetched: true,
          totalClaimsInBatch: null,
          reviewedPercentage: null,
          deductiblePercentage: null,
          validationError: formatServerError(action.payload),
        },
      };
    case "GET_SAMPLING_SUMMARY_CLEAR":
      return {
        ...state,
        samplingSummary: {
          fetching: false,
          fetched: false,
          totalClaimsInBatch: null,
          reviewedPercentage: null,
          deductiblePercentage: null,
          validationError: null,
        }
      };
    default:
      return state;
  }
}

export default reducer;
