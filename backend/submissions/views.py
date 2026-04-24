from django.db.models import Count, OuterRef, Prefetch, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from submissions import models, serializers
from submissions.filters.submission import SubmissionFilterSet


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Submission.objects.select_related("company", "broker", "owner")
    filterset_class = SubmissionFilterSet
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["created_at", "updated_at", "company__legal_name", "status", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action == "list":
            latest_note = (
                models.Note.objects.filter(submission_id=OuterRef("pk"))
                .order_by("-created_at")
            )
            queryset = queryset.annotate(
                document_count=Count("documents", distinct=True),
                note_count=Count("notes", distinct=True),
                latest_note_author=Subquery(latest_note.values("author_name")[:1]),
                latest_note_body=Subquery(latest_note.values("body")[:1]),
                latest_note_created_at=Subquery(latest_note.values("created_at")[:1]),
            )

        elif self.action == "retrieve":

            queryset = queryset.prefetch_related(
                "contacts",
                Prefetch(
                    "documents",
                    queryset=models.Document.objects.order_by("-uploaded_at"),
                ),
                Prefetch(
                    "notes",
                    queryset=models.Note.objects.order_by("-created_at"),
                ),
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.SubmissionListSerializer
        return serializers.SubmissionDetailSerializer


class BrokerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Broker.objects.all().order_by("name")
    serializer_class = serializers.BrokerSerializer
