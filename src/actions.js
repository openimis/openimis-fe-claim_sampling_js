import { graphql, formatMutation, decodeId } from "@openimis/fe-core";
import _ from "lodash";
import _uuid from "lodash-uuid";

export function createClaimSamplingBatch(mm, claimSampleFilters) {
  let projections = getClaimsProjections(mm, false);
  let mutation = formatMutation("createClaimSamplingBatch", claimSampleFilters, "Create Claim Batch", null);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELIVER_CLAIMS_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function formatClaimBatchGQL(modulesManager, percentage, claimAdmin) {
  let claimProjections = getClaimsProjections(modulesManager, false);
  return `
    percentage: ${percentage}
    adminId: ${decodeId(claimAdmin.id)}
  `;
}
