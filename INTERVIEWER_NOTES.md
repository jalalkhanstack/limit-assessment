# Interviewer Notes (Private)

## Key Signals

- **Backend data access** – Expect thoughtful serializers, aggregation of related counts, and
  pragmatic query optimizations when populating broker/company/owner data and note/document counts.
- **Filtering implementation** – Look for robust handling of filter params (validation, defaults,
  composability) and how they keep query params in sync with the frontend.
- **Frontend data management** – React Query usage (caching, query keys, optimistic interactions),
  component composition, and whether filters drive URL state.
- **UX/product sense** – Clarity of layout, readability of list rows, informative empty/blank states,
  and accessible filter controls.
- **Performance awareness** – For backend: mindful query shapes for relational data. For frontend:
  avoiding unnecessary re-fetches or re-renders, batching requests, and caching detail data.

## Discussion Prompts

- Ask about tradeoffs they made around pagination and eager loading.
- Explore how they would extend filtering (date range, has documents/notes).
- Probe error handling strategies and how they would productionize auth/permissions.

