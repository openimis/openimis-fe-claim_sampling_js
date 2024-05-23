import React from 'react';
import messages_en from "./translations/en.json";
import ClaimSamplingButton from "./components/ClaimSamplingButton";
import { ClaimReviewTaskTableHeaders, ClaimReviewTaskItemFormatters, ClaimSamplingConfirmationPanel } from './components/tasks/ClaimReviewTasks';
import reducer from './reducer';
import { FormattedMessage } from '@openimis/fe-core';

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  reducers: [{ key: 'claimSampling', reducer }],
  "claimSampling.claimSamplingButton": [ClaimSamplingButton],
  "tasksManagement.tasks": [{
    text: <FormattedMessage module="ClaimSampling" id="tasks.title" />,
    tableHeaders: ClaimReviewTaskTableHeaders,
    itemFormatters: ClaimReviewTaskItemFormatters,
    taskSource: ['claim_sampling'],
    confirmationPanel: ClaimSamplingConfirmationPanel
  }]
};

export const ClaimSamplingModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
