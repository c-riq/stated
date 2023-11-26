import React from 'react'
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Tooltip } from '@mui/material';
import { deleteStatement } from '../api';

type props = {
    statementHash: string,
    open: boolean
}

export const ConfirmActionWithApiKey = (props: props) => {
    const [open, setOpen] = React.useState(props.open);
    const [apiKey, setApiKey] = React.useState('');
    const [error, setError] = React.useState('');

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const confirmDelete = () => {
        deleteStatement(props.statementHash, {api_key: apiKey}, (res) => {
            setOpen(false);
        }, (err) => {
            setError(JSON.stringify(err));
        })
    };
    return (
        <React.Fragment>
            <Tooltip title="Delete statement">
                <IconButton aria-label="delete" onClick={handleClickOpen}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Delete statement</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To delete the statement {props.statementHash} from {window.location.hostname}, please enter your API key below.
                        This will not necessarily delete the statement from other instances in the network.
                        It may be more appropriate to submit a new statement and reference this one in the superseded statement field.
                        Superseding statement publications will propagate throughout the network, deletions may not.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="API key"
                        label="API key"
                        fullWidth
                        placeholder='3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp'
                        variant="standard"
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <div style={{color: 'red', display: error ? 'block' : 'none'}}>Error :{error}</div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button color="error" disabled={!apiKey} onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}
