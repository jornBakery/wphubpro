import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { useForumThread, useAddForumPost } from '../domains/forum';
import { useToast } from '../contexts/ToastContext';
import { ROUTE_PATHS } from '../config/routePaths';

const ForumThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = useForumThread(id);
  const addPost = useAddForumPost();
  const [body, setBody] = useState('');

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !body.trim()) return;
    try {
      await addPost.mutateAsync({ threadId: id, body: body.trim() });
      setBody('');
      toast({ title: 'Bericht geplaatst', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon bericht niet plaatsen',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !data) {
    return (
      <SoftBox my={3}>
        <SoftTypography color="text">Laden...</SoftTypography>
      </SoftBox>
    );
  }

  const { thread, posts } = data;

  return (
    <>
      <SoftBox my={3}>
        <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
          <SoftButton size="small" variant="text" onClick={() => navigate(ROUTE_PATHS.FORUM)} startIcon={<Icon>arrow_back</Icon>}>
            Forum
          </SoftButton>
        </SoftBox>

        <Card sx={{ mb: 2 }}>
          <SoftBox p={3}>
            <SoftTypography variant="h5" fontWeight="bold" mb={1}>
              {thread.title}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {thread.postCount} berichten · {new Date(thread.$createdAt).toLocaleDateString('nl-NL')}
            </SoftTypography>
          </SoftBox>
        </Card>

        <SoftTypography variant="h6" fontWeight="bold" mb={1}>
          Berichten
        </SoftTypography>
        <Card sx={{ mb: 2 }}>
          <SoftBox p={2}>
            {posts.map((p) => (
              <SoftBox key={p.$id} mb={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>
                  {new Date(p.$createdAt).toLocaleString('nl-NL')}
                </SoftTypography>
                <SoftTypography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {p.body}
                </SoftTypography>
              </SoftBox>
            ))}
          </SoftBox>
        </Card>

        <Card>
          <SoftBox component="form" onSubmit={handleReply} p={3}>
            <TextField
              label="Reageer"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <SoftButton type="submit" variant="gradient" color="info" disabled={addPost.isPending || !body.trim()}>
              {addPost.isPending ? 'Plaatsen...' : 'Plaats reactie'}
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default ForumThreadPage;
