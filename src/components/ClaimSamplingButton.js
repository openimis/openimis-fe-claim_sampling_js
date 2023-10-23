import React, { useState, Fragment } from "react";

import { makeStyles } from "@material-ui/styles";
import {
  Button,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
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
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const [isOpen, setIsOpen] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [claimAdmin, setClaimAdmin] = useState(null);

  const onBatchConfirm = () => {
    createClaimSamplingBatch({ percentage, claimAdmin, filters }, formatMessage("ClaimSampling.create.mutationLabel"));
  };

  const canSave = !(percentage && claimAdmin);

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
                pubRef="claim.ClaimAdminPicker"
                value={claimAdmin}
                withNull={false}
                onChange={(claimAdmin) => setClaimAdmin(claimAdmin)}
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
