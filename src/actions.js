import { graphql, formatMutation } from "@openimis/fe-core";
import { REQUEST, ERROR, SUCCESS } from "./utils/action-types";
import { ACTION_TYPE } from "./reducer";

const formatFilters = ({ percentage, claimAdmin, filters }) => {
  const processedFilters = Object.values(filters)
    .map((filterData) => {
      if (Array.isArray(filterData)) {
        return filterData.map((item) => (item.value ? `${item.id}: ${item.value}` : ""));
      } else if (typeof filterData === "object" && filterData !== null && filterData.filter) {
        return filterData.filter;
      }
      return [];
    })
    .flat();

  const formattedPayload = [
    percentage ? `percentage: ${percentage}` : "",
    claimAdmin?.uuid ? `claimAdminUuid: "${claimAdmin?.uuid}"` : "",
    processedFilters ? `filters: {${processedFilters.join(", ")}}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return formattedPayload;
};

export function createClaimSamplingBatch(claimSamplingFilters, clientMutationLabel) {
  const mutation = formatMutation("createClaimSamplingBatch", formatFilters(claimSamplingFilters), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH), ERROR(ACTION_TYPE.MUTATION)],
    {
      actionType: ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH,
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}
