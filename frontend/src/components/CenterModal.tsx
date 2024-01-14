
import { Box, Modal } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';

type CenterModalProps = {
  lt850px: boolean,
  text?: string,
  modalOpen: boolean,
  onClose: Function,
  children: any
}

export const CenterModal = (props: CenterModalProps) => {
  const { lt850px } = props
  return (
    <Modal sx={{ backgroundColor: 'rgba(0,0,0,0.1)' }} open={props.modalOpen} onClose={() => props.onClose({ warning: true })}>
      <div>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: lt850px ? '100vw' : '70vw',
          height: lt850px ? '100vh' : '90vh',
          bgcolor: 'rgba(238,238,238,1)',
          borderRadius: '12px',
          // overflow: 'hidden', makes MUI fuzzy
          borderWidth: '0px',
          boxShadow: 24,
          p: 0
        }}>
          <div style={{ ...(lt850px ? { padding: '30px' } : { padding: '30px 50px 50px 50px' }), overflowY: 'scroll', height: '100%' }}>
            {
              props.children
            }
          </div>
          <div style={{ height: '50px', width: '50px', padding: '16px 16px 16px 16px', position: 'fixed', top: 0, left: 0 }}>
            <a onClick={() => props.onClose({ warning: false })} style={{ cursor: 'pointer' }}>
              <CloseIcon sx={{ fontSize: "30px" }} /></a>
          </div>
        </Box>
      </div>
    </Modal>)
}
