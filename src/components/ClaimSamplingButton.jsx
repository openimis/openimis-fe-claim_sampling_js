import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";

import { useTheme, styled } from "@mui/material/styles";
import {
  Button,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
} from "@mui/material";

import { useTranslations, useModulesManager, NumberInput, PublishedComponent } from "@openimis/fe-core";
import { createClaimSamplingBatch } from "../actions";
import { MODULE_NAME, CLAIM_SAMPLING_TASK_SOURCE } from "../constants";

const StyledButton = styled(Button)(({ theme }) => ({
  ...theme.dialog.primaryButton,
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  ...theme.paper.item,
}));

const ClaimSamplingButton = ({ filters }) => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const [isOpen, setIsOpen] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [taskGroup, setTaskGroup] = useState(null);

  const onBatchConfirm = () => {
    dispatch(createClaimSamplingBatch({ percentage, taskGroup, filters }, formatMessage("ClaimSampling.create.mutationLabel")));
    setWasSent(true);
  };

  useEffect(() => {
    if (wasSent === true) {
      setIsOpen(false)
      setPercentage(0)
      setTaskGroup(null)
    }
  }, [wasSent]);

  const onClose = () => setWasSent(false)
  const canSave = !(percentage && taskGroup && percentage > 0 && percentage < 101);

  if (wasSent === true) {
    return (
      <Dialog open={wasSent} onClose={onClose}>
      <DialogTitle>{formatMessage('ClaimSampling.dialogActions.confirmationTitle')}</DialogTitle>
      <DialogContent>
        { formatMessage('ClaimSampling.dialogActions.confirmationContent') }
      </DialogContent>
      <DialogActions>
        <StyledButton onClick={onClose} className="button">
          {formatMessage('ClaimSampling.dialogActions.confirm')}
        </StyledButton>
      </DialogActions>
    </Dialog>
    );
  } 

  return (
    <Fragment>
      <StyledGrid className="item" container xs={3} alignItems="center" justifyContent="flex-end">
        <StyledButton variant="contained" color="primary" className="button" onClick={() => setIsOpen(true)}>
          {formatMessage("claimSamplingButton")}
        </StyledButton>
        <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
          <DialogTitle>{formatMessage("ClaimSampling.Form.Title")}</DialogTitle>
          <Divider />
          <DialogContent>
            <StyledGrid className="item">
              <NumberInput
                module="claimSampling"
                label="ClaimSampling.Form.Percentage"
                value={percentage}
                required={true}
                max={100}
                onChange={(percentage) => setPercentage(percentage)}
                startAdornment={<InputAdornment position="start">%</InputAdornment>}
                inputProps={{
                  step: 1,
                  min: 0,
                  max: 100,
                  type: "number",
                }}
              />
            </StyledGrid>
            <StyledGrid className="item">
              <PublishedComponent
                pubRef="tasksManagement.taskGroupPicker"
                value={taskGroup}
                withNull={false}
                source={CLAIM_SAMPLING_TASK_SOURCE}
                onChange={(taskGroup) => setTaskGroup(taskGroup)}
                required={true}
              />
            </StyledGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsOpen(false)}>{formatMessage("ClaimSampling.Form.Cancel")}</Button>
            <Button onClick={onBatchConfirm} disabled={canSave}>
              {formatMessage("ClaimSampling.Form.Create")}
            </Button>
          </DialogActions>
        </Dialog>
      </StyledGrid>
    </Fragment>
  );
};

export default ClaimSamplingButton;
