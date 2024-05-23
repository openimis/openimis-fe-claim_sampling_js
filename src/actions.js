import { REQUEST, ERROR, SUCCESS } from "./utils/action-types";
import { ACTION_TYPE } from "./reducer";
import {
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  formatGQLString,
  graphqlWithVariables,
  prepareMutation,
} from '@openimis/fe-core';

import {
  decodeId,
} from "@openimis/fe-core";

const formatFilters = ({ percentage, taskGroup, filters }) => {
  const processedFilters = Object.fromEntries(
    Object.keys(filters)
      .filter((f) => !!filters[f]["filter"])
      .map((f) => filters[f]["filter"].split(": "))
      .map((f) => {
        const key = f[0];
        let value = JSON.parse(f[1]);
  
        // Decode base64 if it's an encoded UUID
        if (typeof value === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
          value = decodeId(value);
        }
        return [key, value];
      }),
  );

  const formattedPayload = [
    percentage ? `percentage: ${percentage}` : "",
    taskGroup?.id ? `taskGroupUuid: "${decodeId(taskGroup?.id)}"` : "",
    processedFilters ? `filters: "${JSON.stringify(processedFilters).replaceAll('\\"', "").replaceAll('"', '\\"')}"` : "",
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


export function fetchSampledClaims(variables) {
  return graphqlWithVariables(
    `
      query (
        $claimSample_Id: UUID!,
        ${variables.after ? ',$after: String' : ''} 
        ${variables.before ? ',$before: String' : ''}
        ${variables.pageSize ? ',$pageSize: Int' : ''}
        ${variables.status ? ', $status: String' : ''}
         ) {
        samplingBatchClaims(
          claimSamplingId: $claimSample_Id, 
          ${variables.before ? ',before:$before, last:$pageSize' : ''}
          ${!variables.before ? ',first:$pageSize' : ''}
          ${variables.after ? ',after:$after' : ''}
          ${variables.status ? ',assignmentStatus:$status' : ''}
        )
        {
          totalCount
          pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
          edges
          {
            node
            {
              id, uuid, jsonExt, code, insuree { otherNames, lastName }, healthFacility { code }, dateClaimed, admin { otherNames, lastName }, status, reviewStatus
            }
          }
        }
      }
    `,
    variables,
    ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING,
  );
}


export function fetchSummaryForSamplingTaskResolution(variables) {
  return graphqlWithVariables(
    `
    query ($taskId: String!) {
      samplingSummary: samplingSummary(taskId: $taskId) {
        totalClaimsInBatch
        reviewedPercentage
        deductiblePercentage
      }
    }
    `,
    variables,
    ACTION_TYPE.GET_SAMPLING_SUMMARY,
  );
}



// formatTaskResolveGQL and  resolveTask are exact copy of one from tasksManagement.
// However, import from other @openimis/fe-{modue} than fe-core is not possible.
export const formatTaskResolveGQL = (task, user, approveOrFail, additionalData) => `
  ${task?.id ? `id: "${task.id}"` : ''}
  ${user && approveOrFail ? `businessStatus: "{\\"${user.id}\\": \\"${approveOrFail}\\"}"` : ''}
  ${additionalData ? `additionalData: "${JSON.stringify(additionalData)}"` : ''}
  `;

export function resolveClaimTask(task, clientMutationLabel, user, approveOrFail, additionalData = null) {
  const mutationType = 'resolveTask'; // 'resolveTask'
  const mutationInput = formatTaskResolveGQL(task, user, approveOrFail, additionalData);
  const ACTION = ACTION_TYPE.RESOLVE_TASK;
  const mutation = formatMutation(mutationType, mutationInput, clientMutationLabel);
  const requestedDateTime = new Date();

  const userId = user?.id;

  const mutation2 = prepareMutation(
    `mutation ($clientMutationLabel:String, $clientMutationId: String, $id:UUID!, 
      $businessStatus: JSONString!, ${additionalData ? '$additionalData: JSONString!' : ''}
    ) {
      resolveTask(
      input: {
        clientMutationId: $clientMutationId
        clientMutationLabel: $clientMutationLabel
  
        id: $id
        businessStatus: $businessStatus
        ${additionalData ? 'additionalData: $additionalData' : ''}
              }
            ) {
              clientMutationId
              internalId
            }
          }`,
    {
      id: task?.id,
      businessStatus: (() => {
        if (!userId) return undefined;

        switch (approveOrFail) {
          case 'APPROVED':
          case 'FAILED':
            return JSON.stringify({ [userId]: approveOrFail });
          case 'ACCEPT':
          case 'REJECT':
            return JSON.stringify({ [userId]: { [approveOrFail]: additionalData } });
          default:
            throw new Error('Invalid approveOrFail value');
        }
      })(),
      additionalData: additionalData ? JSON.stringify({ entries: additionalData, decision: additionalData }) : undefined,
    },
    {
      id: task?.id,
      businessStatus: (() => {
        if (!userId) return undefined;

        switch (approveOrFail) {
          case 'APPROVED':
          case 'FAILED':
            return JSON.stringify({ [userId]: approveOrFail });
          case 'ACCEPT':
          case 'REJECT':
            return JSON.stringify({ [userId]: { [approveOrFail]: additionalData } });
          default:
            throw new Error('Invalid approveOrFail value');
        }
      })(),
      additionalData: additionalData ? JSON.stringify({ entries: additionalData, decision: additionalData }) : undefined,
    },
  );

  user.clientMutationId = mutation.clientMutationId;

  return graphqlWithVariables(
    mutation2.operation,
    {
      ...mutation2.variables.input,
    },
    ['TASK_MANAGEMENT_MUTATION_REQ', 'TASK_MANAGEMENT_MUTATION_RESP', 'TASK_MANAGEMENT_MUTATION_ERR'],
    {
      requestedDateTime, clientMutationId: mutation.clientMutationId, clientMutationLabel, userId: user.id,
    },
  );
}
