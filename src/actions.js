import {
  baseApiUrl,
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  decodeId,
  openBlob,
  graphqlWithVariables,
  formatJsonField,
  formatGQLString,
} from "@openimis/fe-core";
import {
  getClaimsProjections
}
from "@openimis/fe-claim"
import _ from "lodash";
import _uuid from "lodash-uuid";



export function createClaimSamplingBatch(mm, claimSampleFilters) {
  // console.log("123123");
  let projections = getClaimsProjections(mm, false)
  // console.log(projections);
  // console.log("1231222222223");
  let mutation = formatMutation("createClaimSamplingBatch", claimSampleFilters, "Create Claim Batch", null);
  // console.log("eeeeeee");
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["CLAIM_MUTATION_REQ", "CLAIM_DELIVER_CLAIMS_REVIEW_RESP", "CLAIM_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    clientMutationDetails: !!clientMutationDetails ? JSON.stringify(clientMutationDetails) : null,
    requestedDateTime,
  });
}

export function formatClaimBatchGQL(modulesManager, percentage, claimAdmin) {
  let claimProjections = getClaimsProjections(modulesManager, false)
  return `
    percentage: ${percentage}
    adminId: ${decodeId(claimAdmin.id)}
  `;
}