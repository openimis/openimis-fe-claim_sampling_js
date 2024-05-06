import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';

const ClaimSamplingTaskTableHeaders = () => [
  <FormattedMessage module="ClaimSampling" id="claimSampling.task.individual.id" />,
  <FormattedMessage module="ClaimSampling" id="claimSampling.task.benefitPlan.id" />,
  <FormattedMessage module="ClaimSampling" id="claimSampling.status" />,
];

const ClaimSamplingItemFormatters = () => [];
[
  (claimSample, jsonExt) => jsonExt?.individual_identity,
  (claimSample, jsonExt) => jsonExt?.benefit_plan_string,
  (claimSample) => claimSample?.status,
];

export { ClaimSamplingItemFormatters, ClaimSamplingTaskTableHeaders };