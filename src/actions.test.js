import {
  describe, expect, it, vi,
} from "vitest";

// Only fe-core's two dispatchers are stubbed; the formatters and prepareMutation are
// real, imported from their defining modules because fe-core's barrel imports itself.
const core = vi.hoisted(() => ({
  graphql: vi.fn((payload, type, meta) => ({ payload, type, meta })),
  graphqlWithVariables: vi.fn((operation, variables, type, meta) => ({
    operation, variables, type, meta,
  })),
}));

vi.mock("@openimis/fe-core", async () => ({
  ...(await vi.importActual("@openimis/fe-core/helpers/api")),
  ...(await vi.importActual("@openimis/fe-core/actions")),
  ...core,
}));

const actions = await import("./actions");
const { ACTION_TYPE } = await import("./reducer");
const { ERROR, REQUEST, SUCCESS } = await import("./utils/action-types");
const { globalId } = await import("@openimis/fe-core/testing");

const query = (result) => result.payload.replace(/\s+/g, " ");
const operation = (result) => result.operation.replace(/\s+/g, " ");
const sentFilters = (result) => JSON.parse(result.payload.match(/filters: "(.*)"$/m)[1].replaceAll('\\"', '"'));

const TASK_GROUP = { id: globalId("TaskGroupGQLType", "group-uuid") };

describe("claim sampling actions", () => {
  describe("creating a sampling batch", () => {
    const create = (filters, extra = {}) => actions.createClaimSamplingBatch(
      { percentage: 20, taskGroup: TASK_GROUP, filters, ...extra },
      "Create batch",
    );

    it("raises the mutation triad with its own success type", () => {
      const result = create({});

      expect(result.type).toEqual([
        REQUEST(ACTION_TYPE.MUTATION),
        SUCCESS(ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH),
        ERROR(ACTION_TYPE.MUTATION),
      ]);
      expect(result.meta).toMatchObject({
        actionType: ACTION_TYPE.CREATE_CLAIM_SAMPLING_BATCH,
        clientMutationLabel: "Create batch",
      });
    });

    it("sends the client mutation id it reports", () => {
      const result = create({});

      expect(query(result)).toContain(`clientMutationId: "${result.meta.clientMutationId}"`);
    });

    it("sends the percentage and the decoded task group", () => {
      const result = create({});

      expect(query(result)).toContain("createClaimSamplingBatch( input: {");
      expect(query(result)).toContain("percentage: 20");
      expect(query(result)).toContain('taskGroupUuid: "group-uuid"');
    });

    it("turns the active claim search filters into a JSON object", () => {
      const result = create({
        status: { filter: "status: 4" },
        code: { filter: 'code_Icontains: "C-1"' },
        healthFacility: { filter: 'healthFacility_Uuid: "hf-uuid"' },
        cleared: { filter: null },
      });

      expect(sentFilters(result)).toEqual({ status: 4, code_Icontains: "C-1", healthFacility_Uuid: "hf-uuid" });
    });

    // Currently fails: each filter string is split on every ": ", so a value that itself
    // contains one is cut short and JSON.parse throws before anything is dispatched.
    it.fails("keeps a filter value that contains a colon", () => {
      const result = create({ code: { filter: 'code_Icontains: "C: 1"' } });

      expect(sentFilters(result)).toEqual({ code_Icontains: "C: 1" });
    });
  });

  describe("fetching sampled claims", () => {
    it("asks for the claims of the sample, filtered by review status", () => {
      const variables = { claimSample_Id: "sample-1", pageSize: 10, status: "ASSIGNED" };
      const result = actions.fetchSampledClaims(variables);

      expect(result.type).toBe(ACTION_TYPE.GET_CLAIMS_FOR_SAMPLING);
      expect(result.variables).toBe(variables);
      expect(operation(result)).toContain("samplingBatchClaims( claimSamplingId: $claimSample_Id");
      expect(operation(result)).toContain(",first:$pageSize");
      expect(operation(result)).toContain(",assignmentStatus:$status");
      expect(operation(result)).toContain(", $status: String");
    });

    it("pages backwards from a cursor", () => {
      const result = actions.fetchSampledClaims({ claimSample_Id: "sample-1", pageSize: 10, before: "cursor" });

      expect(operation(result)).toContain(",before:$before, last:$pageSize");
      expect(operation(result)).not.toContain("first:$pageSize");
      expect(operation(result)).not.toContain("$status");
    });

    it("asks for every claim of the batch without a status filter", () => {
      const result = actions.fetchAllSampledClaims({ claimSample_Id: "sample-1", pageSize: 10, after: "cursor" });

      expect(result.type).toBe(ACTION_TYPE.GET_ALL_CLAIMS_FOR_SAMPLING);
      expect(operation(result)).toContain(",first:$pageSize");
      expect(operation(result)).toContain(",after:$after");
      expect(operation(result)).not.toContain("assignmentStatus");
    });

    it("asks for the sampling summary of a task", () => {
      const result = actions.fetchSummaryForSamplingTaskResolution({ taskId: "task-1" });

      expect(result.type).toBe(ACTION_TYPE.GET_SAMPLING_SUMMARY);
      expect(result.variables).toEqual({ taskId: "task-1" });
      expect(operation(result)).toContain("samplingSummary(taskId: $taskId)");
    });
  });

  describe("resolving a task", () => {
    const task = { id: "task-1" };
    const resolve = (...args) => actions.resolveClaimTask(task, "Resolve task", { id: "user-1" }, ...args);

    it("raises the task management triad, not this module's own mutation types", () => {
      expect(resolve("APPROVED").type)
        .toEqual(["TASK_MANAGEMENT_MUTATION_REQ", "TASK_MANAGEMENT_MUTATION_RESP", "TASK_MANAGEMENT_MUTATION_ERR"]);
    });

    it.each(["APPROVED", "FAILED"])("records a %s decision against the deciding user", (decision) => {
      const result = resolve(decision);

      expect(result.variables.id).toBe("task-1");
      expect(JSON.parse(result.variables.businessStatus)).toEqual({ "user-1": decision });
      expect(result.variables.additionalData).toBeUndefined();
    });

    it.each(["ACCEPT", "REJECT"])("nests the extra data under a %s decision", (decision) => {
      const result = resolve(decision, { comment: "looks right" });

      expect(JSON.parse(result.variables.businessStatus))
        .toEqual({ "user-1": { [decision]: { comment: "looks right" } } });
      expect(operation(result)).toContain("additionalData: $additionalData");
    });

    it("rejects a decision it does not recognise", () => {
      expect(() => resolve("MAYBE")).toThrow("Invalid approveOrFail value");
    });

    // Currently fails: the id reported in the metadata comes from a formatMutation call
    // whose payload is discarded, while the mutation sent carries the one prepareMutation
    // generated.
    it.fails("sends the client mutation id it reports", () => {
      const result = resolve("APPROVED");

      expect(result.variables.clientMutationId).toBe(result.meta.clientMutationId);
    });

    // Currently fails: the operation declares $clientMutationLabel but no such variable is
    // ever passed, so the audit label is dropped.
    it.fails("sends the label its operation declares", () => {
      expect(resolve("APPROVED").variables.clientMutationLabel).toBe("Resolve task");
    });

    // Currently fails: the generated mutation id is written onto the user object passed in,
    // which is the current user held in the store.
    it.fails("leaves the user it was given alone", () => {
      const user = { id: "user-1" };
      actions.resolveClaimTask(task, "Resolve task", user, "APPROVED");

      expect(user).toEqual({ id: "user-1" });
    });
  });
});
