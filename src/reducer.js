import { dispatchMutationErr, dispatchMutationReq, dispatchMutationResp } from "@openimis/fe-core";
import { REQUEST, ERROR, SUCCESS } from "./utils/action-types";

export const ACTION_TYPE = {
  MUTATION: "CLAIM_SAMPLING_MUTATION",
  CREATE_CLAIM_SAMPLING_BATCH: "CLAIM_SAMPLING_BATCH_CREATE",
};

function reducer(
  state = {
    submittingMutation: false,
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
    default:
      return state;
  }
}

export default reducer;
