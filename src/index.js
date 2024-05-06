import React from "react";
import messages_en from "./translations/en.json";
import ClaimSamplingButton from "./components/ClaimSamplingButton";
import { FormattedMessage } from '@openimis/fe-core';
import { ClaimSamplingItemFormatters, ClaimSamplingTaskTableHeaders } from "./components/ClaimSamplingTasks";
// import { Keyboard } from "@material-ui/icons";
import VpnLockIcon from '@material-ui/icons/VpnLock';
import { RIGHT_QUERY, RIGHT_APPROVE, RIGHT_CREATE, RIGHT_UPDATE } from "./constants";

const ROUTE_CLAIM_CLAIM_SAMPLING = 'claim/sampling';

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "claimSampling.claimSamplingButton": [ClaimSamplingButton],
  "tasksManagement.tasks": [
    {
      text: "Claim Sample",
      tableHeaders: ClaimSamplingTaskTableHeaders,
      itemFormatters: ClaimSamplingItemFormatters,
      taskSource: ["Claim Sampling"]
    },
    {
      text: "Claim Sample2",
      tableHeaders: ClaimSamplingTaskTableHeaders,
      itemFormatters: ClaimSamplingItemFormatters,
      taskSource: ["Claim Sampling2"],
    },
  ],
  'claim.MainMenu':[
  {
    text: <FormattedMessage module="claimSampling" id="route" />,
    icon: <VpnLockIcon />,
    route: `/${ROUTE_CLAIM_CLAIM_SAMPLING}`,
    // filter: (rights) => [RIGHT_QUERY, RIGHT_APPROVE, RIGHT_CREATE, RIGHT_UPDATE].some((right) => rights.includes(right)),
  },
  ],
  'core.Router': [
    {
      path: ROUTE_CLAIM_CLAIM_SAMPLING,
      component: null,
      requiredRights: [],
    },
  ]
};

export const ClaimSamplingModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
