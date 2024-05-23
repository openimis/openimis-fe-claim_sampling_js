import React, { useState, useEffect } from "react";
import { Paper, Fab, Checkbox, FormControlLabel, Divider, Grid, makeStyles, IconButton, Typography } from '@material-ui/core';
import TabIcon from "@material-ui/icons/Tab";
import { Table, TableHead, TableRow, TableCell, SelectDialog, formatMessage, formatMessageWithValues, decodeId, useHistory, useModulesManager, historyPush, FormattedMessage } from "@openimis/fe-core";
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import { useDispatch, useSelector } from "react-redux";
import { fetchSampledClaims, resolveClaimTask, fetchSummaryForSamplingTaskResolution } from '../../actions';
import { TASK_STATUS, APPROVED, FAILED } from "../../constants";

// import { fetchClaimReviews, resolveClaimReview } from '../../actions';
import { useIntl } from "react-intl";

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  title: theme.paper.title,
  button: theme.paper.button,
  fabContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  fabHeaderContainer: {
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  fab: {
    margin: theme.spacing(1),
  },
}));

function ClaimReviewTaskDisplay({ businessData, setAdditionalData, jsonExt }) {
    const {
        pendingBeneficiaries, 
        claimsInSample, 
        fetchingClaimsInSample,
        fetchedClaimsInSample,
        errorFetchingClaimsInSample,
        fetchedClaimsInSamplePageInfo
    } = useSelector((state) => state.claimSampling);

    const intl = useIntl();
      const [pending, setPending] = useState([]);
      const [keys, setKeys] = useState([]);
      const [state, setState] = useState({
        page: 0,
        pageSize: 10,
        afterCursor: null,
        beforeCursor: null,
      })
      
      const isTaskResolved = () => ![TASK_STATUS.RECEIVED, TASK_STATUS.ACCEPTED].includes(task?.status)
      const dispatch = useDispatch()
      const queryPrms = () => {
        return {
        'claimSample_Id': businessData?.data?.id, 
        'individual_Id_Isnull': isTaskResolved()  ? undefined : true, 
        'isDeleted': isTaskResolved()  ? undefined : false,
        'status': "I" 
      }}
    
      const {task} = useSelector((state) => state.tasksManagement)
      const currentUser = useSelector((state) => state.core.user)
      const modulesManager = useModulesManager()
      const history = useHistory()

      const query = () => {
        let prms = queryPrms();
        if (!state.pageSize || !prms) return;
        prms.pageSize = state.pageSize;
        if (!!state.afterCursor) {
          prms.after = state.afterCursor;
        }
        if (!!state.beforeCursor) {
          prms.before = state.beforeCursor;
        }
    
        dispatch(fetchSampledClaims(prms));
      };


    
      const currentPage = () => state.page;
      const currentPageSize = () => state.pageSize;
    
      useEffect(() => {
        query()
      }, []);
    
      useEffect(() => {
        query()
      }, [state]);

      useEffect(() => {
        setPending(claimsInSample)
      }, [claimsInSample]);
    
      const classes = useStyles();

    
    const headers = () => {
        var result = [
          formatMessage(intl, "claim", "claimSummaries.code"),
          formatMessage(intl, "claim", "claimSummaries.healthFacility"),
          formatMessage(intl, "claim", "claimSummaries.insuree"),
          formatMessage(intl, "claim", "claimSummaries.claimedDate"),
          formatMessage(intl, "claim", "claimSummaries.reviewStatus"),
          formatMessage(intl, "claim", "claimSummaries.claimStatus"),
          formatMessage(intl, "claim", "claimSummaries.openNewTab")
        ];
        return result;
      };
    
      const onDoubleClick = (c, newTab = false) => {
        historyPush(modulesManager, history, "claim.route.review", [c.uuid, "tasksManagement.route.task", task.id], newTab);
      };

      const itemFormatters = () => {
        return [
            (pending) => pending.code,
            (pending) => pending.healthFacility.code,
            (pending) => pending.insuree.otherNames + ' ' + pending.insuree.lastName,
            (pending) => pending.dateClaimed,
            (pending) => formatMessage(intl, "claim", "reviewStatus." + pending.reviewStatus),
            (pending) => formatMessage(intl, "claim", "claimStatus." + pending.status),
            (pending) => <IconButton onClick={(e) => onDoubleClick(pending.uuid, true)}>
                {" "}
                <TabIcon />
            </IconButton>
        ];
      }
    
      const onChangeRowsPerPage = (rows) => {
        setState({
            ...state,
            pageSize:rows
        })
      }
      
    
      const onChangePage = (page, nbr) => {
        const next = nbr > state.page
    
        setState(
            {
                page: next ? state.page+1 : state.page-1,
                pageSize: state.pageSize,
                afterCursor: next ? fetchedClaimsInSamplePageInfo.endCursor : null,
                beforeCursor: !next ? fetchedClaimsInSamplePageInfo.startCursor : null,
            }
        )
      }
    
      const isCurrentUserInTaskGroup = () => {
        const taskExecutors = task?.taskGroup?.taskexecutorSet?.edges.map((edge) => decodeId(edge.node.user.id)) ?? [];
        return taskExecutors && taskExecutors.includes(currentUser?.id);
      };
    
      const isRowDisabled = (_) => {
        return !isCurrentUserInTaskGroup() || task?.status !== TASK_STATUS.ACCEPTED
      }
    
      return (
        <>
          <Typography variant="h6">
          </Typography>
          <Table
              module="socialProtection"
              headers={headers()}
              //headerActions={headerActions}
              itemFormatters={(itemFormatters())}
              items={(!!pending && pending) || []}
              fetching={fetchingClaimsInSample}
              error={errorFetchingClaimsInSample}
              withSelection={!isRowDisabled() ? "multiple" : ''}
              //onChangeSelection={onChangeSelection}
              withPagination={true}
              rowsPerPageOptions={[10, 20, 10, 100]}
              defaultPageSize={10}
              page={currentPage()}
              pageSize={currentPageSize()}
              count={ fetchedClaimsInSamplePageInfo.totalCount }
              onChangePage={onChangePage}
              onChangeRowsPerPage={onChangeRowsPerPage}
              rowDisabled={isRowDisabled}
              onDoubleClick={onDoubleClick}
            />
        </>
      );
    }




const ClaimReviewTaskTableHeaders = () =>  {
    return []
};

const ClaimReviewTaskItemFormatters = () => [
    (businessData, jsonExt, formatterIndex, setAdditionalData) => (
        <>
        <ClaimReviewTaskDisplay
          businessData={businessData}
          setAdditionalData={setAdditionalData}
          jsonExt={jsonExt}
        />
        </>
      ),
];

const ClaimSamplingConfirmationPanel = ({defaultAction, defaultDisabled}) => {
    
    const intl = useIntl();
    const classes = useStyles();
    const {task} = useSelector((state) => state.tasksManagement)
    const currentUser = useSelector((state) => state.core.user)
    const {
        samplingSummary
    } = useSelector((state) => state.claimSampling);

    const [disabled, setDisable] = useState(defaultDisabled)

    const [openModal, setOpenModal] = useState(null);
    const [approveOrFail, setApproveOrFail] = useState('');
    const [confirmed, setConfirmed] = useState('')

    const onConfirm = () => {
        setOpenModal(false);
        setConfirmed(true);
      }
    
      const onClose = () => {
        setOpenModal(false);
        setConfirmed(false);
      }

    const isCurrentUserInTaskGroup = () => {
        const taskExecutors = task?.taskGroup?.taskexecutorSet?.edges.map((edge) => decodeId(edge.node.user.id)) ?? [];
        return taskExecutors && taskExecutors.includes(currentUser?.id);
      };
    
    const isRowDisabled = (_) => {
        return !isCurrentUserInTaskGroup() || task?.status !== TASK_STATUS.ACCEPTED
    }

    const clear = () => {
        setOpenModal(null);
        setApproveOrFail('');
        setConfirmed('');
    }


    const handleButtonClick = (choiceString) => {
        // () => defaultAction(APPROVED)
        if (task?.id && currentUser?.id) {
          setApproveOrFail(choiceString);
          setOpenModal(true);
        }
    };

    const dispatch = useDispatch()

    useEffect(() => {
        if (openModal === true) {
            dispatch(fetchSummaryForSamplingTaskResolution(
                { taskId: task?.id}
            ));
        }
    }, [openModal]);

    useEffect(() => {
        if (task?.id && currentUser?.id) {
          if (confirmed) {
            setDisable(true);
            dispatch(resolveClaimTask(
              task,
              formatMessage(intl, 'tasksManagement', 'task.resolve.mutationLabel'),
              currentUser,
              approveOrFail
            ));
          }
        }
        return () => confirmed && clear();
      }, [confirmed]);
    

    const formatConfirmMessage = () => {
        let msg = <>
            <div className="bold-large">
              {formatMessage(intl, "ClaimSampling", "samplingSummaryTemplate.summary")}
            </div>
            <Divider/>
            <Divider/>
            {formatMessageWithValues(intl, "ClaimSampling", "samplingSummaryTemplate.total", samplingSummary)}
            <Divider/>
            {formatMessageWithValues(intl, "ClaimSampling", "samplingSummaryTemplate.reviewed", samplingSummary)}
            <Divider/>
            {formatMessageWithValues(intl, "ClaimSampling", "samplingSummaryTemplate.deductibles", samplingSummary)}
            <Divider/>
        </>
        return msg 
    }

    return (<>
            <SelectDialog
            confirmState={openModal}
            onConfirm={onConfirm}
            onClose={onClose}
            module="ClaimSampling"
            confirmTitle={ approveOrFail === APPROVED ? "approveSampling" :  "rejectSampling" }
            confirmMessageComponent={formatConfirmMessage()}
            confirmationButton="dialogActions.continue"
            rejectionButton="dialogActions.goBack"
        />
        <Paper className={classes.paper}>
    <div className={classes.fabHeaderContainer}>
    </div>
    <div className={classes.fabContainer}>
        <div className={classes.fab}>
                <Fab
            color="primary"
            disabled={disabled || isRowDisabled()}
            onClick={() => handleButtonClick(APPROVED)}
          >
            <CheckIcon />
          </Fab>
        {formatMessage(intl, 'ClaimSampling', 'approveSampling' )}

        </div>
        <div className={classes.fab}>
          <Fab
            color="primary"
            disabled={disabled || task?.status === TASK_STATUS.RECEIVED || isRowDisabled()}
            onClick={() => handleButtonClick(FAILED)}
          >
            <ClearIcon />
          </Fab>
        {formatMessage(intl, "ClaimSampling", "rejectSampling")}
        </div>
        </div>
    </Paper>
    </>
    )
}

export { ClaimReviewTaskTableHeaders, ClaimReviewTaskItemFormatters, ClaimSamplingConfirmationPanel };
