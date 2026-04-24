from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from submissions import models


class SubmissionAPITestCase(APITestCase):
    """Targeted API tests for list filters, pagination shape, and detail payload."""

    @classmethod
    def setUpTestData(cls):
        cls.broker_alpha = models.Broker.objects.create(
            name="Alpha Capital",
            primary_contact_email="alpha@example.com",
        )
        cls.broker_beta = models.Broker.objects.create(
            name="Beta Partners",
            primary_contact_email="",
        )
        cls.company_acme = models.Company.objects.create(
            legal_name="Acme Universal Holdings",
            industry="Manufacturing",
            headquarters_city="Chicago",
        )
        cls.company_other = models.Company.objects.create(
            legal_name="Other Co",
            industry="Retail",
            headquarters_city="Boston",
        )
        cls.owner = models.TeamMember.objects.create(
            full_name="Ops Owner",
            email="owner@internal.example",
        )

        past = timezone.now() - timedelta(days=30)
        recent = timezone.now() - timedelta(days=2)

        cls.sub_new = models.Submission.objects.create(
            company=cls.company_acme,
            broker=cls.broker_alpha,
            owner=cls.owner,
            status=models.Submission.Status.NEW,
            priority=models.Submission.Priority.HIGH,
            summary="Strategic fit",
            created_at=past,
        )
        cls.sub_review = models.Submission.objects.create(
            company=cls.company_other,
            broker=cls.broker_beta,
            owner=cls.owner,
            status=models.Submission.Status.IN_REVIEW,
            priority=models.Submission.Priority.LOW,
            summary="Second deal",
            created_at=recent,
        )

        models.Document.objects.create(
            submission=cls.sub_new,
            title="Deck",
            doc_type="Presentation",
            file_url="https://example.com/deck.pdf",
        )
        models.Note.objects.create(
            submission=cls.sub_new,
            author_name="Ops Owner",
            body="Initial triage complete.",
        )

    def test_submissions_list_returns_camel_case_and_counts(self):
        url = reverse("submission-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("count", body)
        self.assertIn("results", body)
        row = next(r for r in body["results"] if r["id"] == self.sub_new.id)
        self.assertEqual(row["status"], models.Submission.Status.NEW)
        self.assertEqual(row["broker"]["name"], "Alpha Capital")
        self.assertEqual(row["company"]["legalName"], "Acme Universal Holdings")
        self.assertEqual(row["documentCount"], 1)
        self.assertEqual(row["noteCount"], 1)
        self.assertIsNotNone(row["latestNote"])
        self.assertIn("bodyPreview", row["latestNote"])

    def test_submissions_filter_status(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"status": models.Submission.Status.IN_REVIEW})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.sub_review.id})

    def test_submissions_filter_broker_id(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"brokerId": self.broker_alpha.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.sub_new.id})

    def test_submissions_filter_company_search(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"companySearch": "acme univ"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.sub_new.id})

    def test_submissions_filter_has_documents(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"hasDocuments": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.sub_new.id})

        response_false = self.client.get(url, {"hasDocuments": "false"})
        ids_false = {r["id"] for r in response_false.json()["results"]}
        self.assertEqual(ids_false, {self.sub_review.id})

    def test_submissions_filter_has_notes(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"hasNotes": "true"})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.sub_new.id})

        response_false = self.client.get(url, {"hasNotes": "false"})
        ids_false = {r["id"] for r in response_false.json()["results"]}
        self.assertEqual(ids_false, {self.sub_review.id})

    def test_submissions_ordering_company_name(self):
        url = reverse("submission-list")
        response = self.client.get(url, {"ordering": "company__legal_name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordered_ids = [r["id"] for r in response.json()["results"]]
        # Acme before Other lexicographically
        self.assertEqual(ordered_ids, [self.sub_new.id, self.sub_review.id])

    def test_submission_detail_includes_nested_relations(self):
        url = reverse("submission-detail", args=[self.sub_new.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["id"], self.sub_new.id)
        self.assertEqual(len(body["contacts"]), 0)
        self.assertEqual(len(body["documents"]), 1)
        self.assertEqual(len(body["notes"]), 1)
        self.assertEqual(body["documents"][0]["title"], "Deck")

    def test_brokers_list_paginated_shape(self):
        url = reverse("broker-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("results", body)
        names = {b["name"] for b in body["results"]}
        self.assertIn("Alpha Capital", names)
        self.assertIn("Beta Partners", names)
