import React, { useState, Fragment } from "react";

import { withTheme, withStyles } from "@material-ui/core/styles";
import { Button, InputAdornment } from "@material-ui/core";
import { useTranslations, useModulesManager, NumberInput, PublishedComponent } from "@openimis/fe-core";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import { createClaimSamplingBatch } from "../actions";

const styles = (theme) => ({
  primaryButton: theme.dialog.primaryButton,
  // primaryButton: {...theme.dialog.primaryButton, margin: theme.spacing(1)},
  secondaryButton: theme.dialog.secondaryButton,
  item: theme.paper.item,
});

const ClaimSamplingButton = ({ classes, filters }) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("ClaimSampling", modulesManager);
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => {
    setIsOpen(false);
  };
  const handleClickOpen = () => {
    setIsOpen(true);
  };

  const [percentage, setPercentage] = useState(0);
  const handlePercentage = (value) => setPercentage(value);
  const [claimAdmin, setClaimAdmin] = useState(null);
  const handleClaimAdmin = (value) => setClaimAdmin(value);

  const handleSave = () => {
    createClaimSamplingBatch(modulesManager, { percentage, claimAdmin, filters });
  };

  const canSave = !(!!percentage && !!claimAdmin);

  return (
    <Fragment>
      <Button variant="contained" color="primary" className={classes.button} onClick={handleClickOpen}>
        {formatMessage("claimSamplingButton")}
      </Button>
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{formatMessage("ClaimSampling.Form.Title")}</DialogTitle>
        <DialogContent>
          <NumberInput
            module="claimSampling"
            label="ClaimSampling.Form.Percentage"
            value={percentage}
            max={100}
            onChange={handlePercentage}
            startAdornment={<InputAdornment position="start">%</InputAdornment>}
            inputProps={{
              step: 1,
              min: 0,
              max: 100,
              type: "number",
            }}
          />
          <PublishedComponent
            pubRef="claim.ClaimAdminPicker"
            value={claimAdmin}
            withNull={false}
            onChange={handleClaimAdmin}
            required={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{formatMessage("ClaimSampling.Form.Cancel")}</Button>
          <Button onClick={handleSave} disabled={canSave}>
            {formatMessage("ClaimSampling.Form.Create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

export default withTheme(withStyles(styles)(ClaimSamplingButton));
