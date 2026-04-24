'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import { useSubmissionDetail } from '@/lib/hooks/useSubmissions';
import { type Contact, type Document, type NoteDetail } from '@/lib/types';
import PriorityChip from '@/components/PriorityChip';
import StatusChip from '@/components/StatusChip';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      {count !== undefined && (
        <Chip label={count} size="small" variant="outlined" sx={{ height: 20, fontSize: 12 }} />
      )}
    </Box>
  );
}

function SkeletonCard({ height = 100 }: { height?: number }) {
  return <Skeleton variant="rounded" height={height} />;
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'primary.main' }}>
            {initials(contact.name)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
              {contact.name}
            </Typography>
            {contact.role && (
              <Typography variant="caption" color="text.secondary">
                {contact.role}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack spacing={0.75}>
          {contact.email && (
            <MuiLink href={`mailto:${contact.email}`} variant="caption" color="text.secondary">
              {contact.email}
            </MuiLink>
          )}
          {contact.phone && (
            <Typography variant="caption" color="text.secondary">
              {contact.phone}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DocumentRow({ doc, isLast }: { doc: Document; isLast: boolean }) {
  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1.5}
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {doc.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doc.docType} &middot; Uploaded {formatDate(doc.uploadedAt)}
          </Typography>
        </Box>

        {doc.fileUrl && (
          <MuiLink
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{ whiteSpace: 'nowrap', ml: 2 }}
          >
            View &rarr;
          </MuiLink>
        )}
      </Box>
      {!isLast && <Divider />}
    </>
  );
}

function NoteCard({ note }: { note: NoteDetail }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'secondary.main' }}>
              {initials(note.authorName)}
            </Avatar>
            <Typography variant="body2" fontWeight={700}>
              {note.authorName}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {formatDate(note.createdAt)}
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {note.body}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const submissionId = params?.id ?? '';

  const { data, isLoading, isError } = useSubmissionDetail(submissionId);

  const backLink = (
    <MuiLink
      component={Link}
      href="/submissions"
      underline="hover"
      color="text.secondary"
      display="flex"
      alignItems="center"
      gap={0.5}
      width="fit-content"
      sx={{ fontSize: 14 }}
    >
      &larr;&nbsp;Back to submissions
    </MuiLink>
  );

  if (!isLoading && isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {backLink}
          <Alert severity="error" variant="outlined">
            Could not load this submission. It may not exist or the server may be unavailable.
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {backLink}

        {isLoading ? (
          <Box>
            <Skeleton variant="text" width={280} height={44} />
            <Skeleton variant="text" width={200} height={24} sx={{ mt: 0.5 }} />
          </Box>
        ) : (
          <Box>
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700} lineHeight={1.2}>
                  {data!.company.legalName}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {[data!.company.industry, data!.company.headquartersCity]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexShrink={0} mt={0.5}>
                <StatusChip status={data!.status} />
                <PriorityChip priority={data!.priority} />
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Created {formatDate(data!.createdAt)} &middot; Updated {formatDate(data!.updatedAt)}
            </Typography>
          </Box>
        )}

        <Card variant="outlined">
          <CardContent>
            <SectionHeading title="Overview" />

            {isLoading ? (
              <Stack spacing={1.5}>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
              </Stack>
            ) : (
              <Stack spacing={2}>
                {data!.summary && (
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap' }}
                  >
                    {data!.summary}
                  </Typography>
                )}

                <Divider />

                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                  gap={2}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                      Broker
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data!.broker.name}
                    </Typography>
                    {data!.broker.primaryContactEmail && (
                      <MuiLink
                        href={`mailto:${data!.broker.primaryContactEmail}`}
                        variant="caption"
                        color="text.secondary"
                      >
                        {data!.broker.primaryContactEmail}
                      </MuiLink>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                      Owner
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data!.owner.fullName}
                    </Typography>
                    <MuiLink
                      href={`mailto:${data!.owner.email}`}
                      variant="caption"
                      color="text.secondary"
                    >
                      {data!.owner.email}
                    </MuiLink>
                  </Box>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Box>
          <SectionHeading title="Contacts" count={isLoading ? undefined : data!.contacts.length} />

          {isLoading ? (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
              <SkeletonCard />
              <SkeletonCard />
            </Box>
          ) : data!.contacts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No contacts on record.
            </Typography>
          ) : (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
              {data!.contacts.map((contact: Contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </Box>
          )}
        </Box>

        <Box>
          <SectionHeading title="Documents" count={isLoading ? undefined : data!.documents.length} />

          {isLoading ? (
            <Stack spacing={1}>
              <SkeletonCard height={56} />
              <SkeletonCard height={56} />
              <SkeletonCard height={56} />
            </Stack>
          ) : data!.documents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No documents attached.
            </Typography>
          ) : (
            <Paper variant="outlined">
              {data!.documents.map((doc: Document, idx: number) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isLast={idx === data!.documents.length - 1}
                />
              ))}
            </Paper>
          )}
        </Box>

        <Box>
          <SectionHeading title="Notes" count={isLoading ? undefined : data!.notes.length} />

          {isLoading ? (
            <Stack spacing={2}>
              <SkeletonCard height={90} />
              <SkeletonCard height={90} />
              <SkeletonCard height={90} />
            </Stack>
          ) : data!.notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No notes yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {data!.notes.map((note: NoteDetail) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </Stack>
          )}
        </Box>

      </Stack>
    </Container>
  );
}
