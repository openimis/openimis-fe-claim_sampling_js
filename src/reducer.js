import { dispatchMutationResp } from "@openimis/fe-core";

function reducer(
  state = {
    submittingMutation: false,
    mutation: {},
  },
  action,
) {
  switch (action.type) {
    case "CLAIM_SAMPLING_CREATE_CLAIM_SAMPLING_BATCH":
      return dispatchMutationResp(state, "createClaimSamplingBatch", action);
    default:
      return state;
  }
}

export default reducer;
