import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";

import { makeStyles } from "@material-ui/styles";
import {
  Button,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
} from "@material-ui/core";

import { useTranslations, useModulesManager, NumberInput, PublishedComponent } from "@openimis/fe-core";
import { createClaimSamplingBatch } from "../actions";
import { MODULE_NAME } from "../constants";

const useStyles = makeStyles((theme) => ({
  primaryButton: theme.dialog.primaryButton,
  item: theme.paper.item,
}));

const ClaimSamplingButton = ({ filters }) => {
  const dispatch = useDispatch();
  const classes = useStyles();
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
        <Button onClick={onClose} className={classes.button}>
          {formatMessage('ClaimSampling.dialogActions.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
    );
  } 

  return (
    <Fragment>
      <Grid className={classes.item} container xs={3} alignItems="center" justifyContent="flex-end">
        <Button variant="contained" color="primary" className={classes.button} onClick={() => setIsOpen(true)}>
          {formatMessage("claimSamplingButton")}
        </Button>
        <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
          <DialogTitle>{formatMessage("ClaimSampling.Form.Title")}</DialogTitle>
          <Divider />
          <DialogContent>
            <Grid className={classes.item}>
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
            </Grid>
            <Grid className={classes.item}>
              <PublishedComponent
                pubRef="tasksManagement.taskGroupPicker"
                value={taskGroup}
                withNull={false}
                onChange={(taskGroup) => setTaskGroup(taskGroup)}
                required={true}
              />
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsOpen(false)}>{formatMessage("ClaimSampling.Form.Cancel")}</Button>
            <Button onClick={onBatchConfirm} disabled={canSave}>
              {formatMessage("ClaimSampling.Form.Create")}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Fragment>
  );
};

export default ClaimSamplingButton;
