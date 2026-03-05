import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import SoftInput from 'components/SoftInput';
import Icon from '@mui/material/Icon';
import { useUpdateSite } from '../../hooks/useSites';

interface SiteForEdit {
  $id: string;
  siteName?: string;
  site_name?: string;
  siteUrl?: string;
  site_url?: string;
}

interface EditSiteModalProps {
  open: boolean;
  onClose: () => void;
  site: SiteForEdit | null;
}

const EditSiteModal: React.FC<EditSiteModalProps> = ({ open, onClose, site }) => {
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const updateSiteMutation = useUpdateSite();

  useEffect(() => {
    if (site) {
      setSiteName((site.siteName ?? site.site_name ?? '').toString());
      setSiteUrl((site.siteUrl ?? site.site_url ?? '').toString());
    }
  }, [site]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site?.$id) return;
    updateSiteMutation.mutate(
      { siteId: site.$id, siteName, siteUrl },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    if (!updateSiteMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" gap={1}>
          <Icon color="info">edit</Icon>
          <SoftTypography variant="h6" fontWeight="medium">Site bewerken</SoftTypography>
        </SoftBox>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {updateSiteMutation.isError && (
            <SoftBox mb={2} p={2} borderRadius="md" bgColor="error" color="white" sx={{ opacity: 0.9 }}>
              <SoftBox display="flex" alignItems="center" gap={1}>
                <Icon sx={{ fontSize: 20, color: "white" }}>error</Icon>
                <SoftTypography variant="caption" color="white">{updateSiteMutation.error?.message}</SoftTypography>
              </SoftBox>
            </SoftBox>
          )}
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="medium" color="text" mb={0.5} display="block">Site naam</SoftTypography>
            <SoftInput placeholder="Mijn WordPress Site" value={siteName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)} fullWidth />
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" fontWeight="medium" color="text" mb={0.5} display="block">Site URL</SoftTypography>
            <SoftInput type="url" placeholder="https://example.com" value={siteUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteUrl(e.target.value)} fullWidth />
          </SoftBox>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SoftButton variant="outlined" color="secondary" onClick={handleClose} disabled={updateSiteMutation.isPending}>Annuleren</SoftButton>
          <SoftButton type="submit" variant="gradient" color="info" disabled={updateSiteMutation.isPending || !site?.$id}>{updateSiteMutation.isPending ? 'Bezig...' : 'Opslaan'}</SoftButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditSiteModal;
