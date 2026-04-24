import django_filters
from django.db.models import Exists, OuterRef

from submissions import models


class SubmissionFilterSet(django_filters.FilterSet):
    """
    Filter set for GET /api/submissions/.

    Field names use camelCase so they match the query params the frontend
    sends (e.g. ?brokerId=3&companySearch=acme).  The camel-case renderer
    only converts JSON bodies, not query strings, so we own the mapping here.
    """

    # Core filters
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    priority = django_filters.CharFilter(field_name="priority", lookup_expr="iexact")

    # Relation filters
    brokerId = django_filters.NumberFilter(field_name="broker__id")
    companySearch = django_filters.CharFilter(
        field_name="company__legal_name", lookup_expr="icontains"
    )

    # Date-range filters (accept ISO date strings, e.g. 2024-01-15)
    createdFrom = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    createdTo = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    # Existence filters — use Exists subqueries to avoid annotation conflicts
    hasDocuments = django_filters.BooleanFilter(method="filter_has_documents")
    hasNotes = django_filters.BooleanFilter(method="filter_has_notes")

    class Meta:
        model = models.Submission
        fields = ["status", "priority"]

    def filter_has_documents(self, queryset, name, value):
        has_doc = Exists(models.Document.objects.filter(submission=OuterRef("pk")))
        return queryset.filter(has_doc) if value else queryset.exclude(has_doc)

    def filter_has_notes(self, queryset, name, value):
        has_note = Exists(models.Note.objects.filter(submission=OuterRef("pk")))
        return queryset.filter(has_note) if value else queryset.exclude(has_note)
