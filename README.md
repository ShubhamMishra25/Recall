# Recall — Senior Engineering Interview Prep Guide

This README is a mock interview study guide based on the actual implementation in this repository. The questions and answers below are grounded in the current codebase rather than in aspirational product claims.

---

## 1. Architecture

### Question
How would you describe the architecture of Recall to a senior engineer?

### Answer
Recall is a monorepo with a React frontend in apps/web and an Express/TypeScript backend in apps/api. The frontend uses React Router for routing and an auth context to manage session state. The backend is split into domain modules such as auth, atoms, review, search, upload, and serendipity. Shared concerns such as database access, authentication, and error handling live in middleware and lib folders. Background work is handled by BullMQ and Redis so AI enrichment and serendipity generation do not block the request path.

### Follow-up questions
- What are the biggest architectural boundaries in this system?
- Which parts are synchronous and which are asynchronous?
- How would you evolve this architecture for higher scale?
- Where is the current coupling most obvious?

---

## 2. React Frontend Design

### Question
How is the React frontend structured, and why is that structure reasonable?

### Answer
The frontend is a Vite + React + TypeScript app. It uses feature-oriented folders like dashboard, review, library, and capture, which makes it easy to localize domain logic. The auth flow is centralized through an AuthProvider, and the API layer is shared so fetch logic, refresh logic, and auth failures are handled consistently. The review experience is implemented as a stateful UI component that handles card flipping, keyboard navigation, and progress updates.

### Follow-up questions
- Why might a context-based auth layer be appropriate here?
- What would you improve for maintainability and testability?
- How would you restructure the capture experience if it were to become a first-class feature?
- What are the trade-offs of using localStorage for tokens in this app?

---

## 3. Backend Service Design

### Question
How is the backend organized, and what is the benefit of the current module structure?

### Answer
The backend uses Express with route modules and service-layer functions. Each domain module has its own route and service file, which makes the code easier to reason about and keeps representations of business capabilities separate. Shared responsibilities such as auth middleware, Prisma access, and error normalization are isolated from feature logic. That separation makes it easier to evolve the review engine or AI pipeline without entangling unrelated concerns.

### Follow-up questions
- Where would you draw the boundary between controller and service logic?
- What would you change if one module became too large?
- How would you test the modules independently?
- What is the biggest weakness of the current structure?

---

## 4. Database Modeling

### Question
How does the Prisma schema model the domain, and what are the key relationships?

### Answer
The schema models users, atoms, tags, review states, review logs, collections, collection members, links, and sessions. Atoms belong to a user and can have multiple tags, review states, review logs, and links. ReviewState and ReviewLog are separate from Atom because the spaced repetition engine needs persistent scheduling history. Collections and collection membership support the sharing concept. The model is normalized and relational, which fits a multi-user knowledge system with review history.

### Follow-up questions
- Why is review state modeled separately from the atom entity?
- How would you handle concurrent updates to review data?
- Which relationships would likely become performance bottlenecks?
- What would change if the product became more graph-heavy?

---

## 5. API Design

### Question
How would you describe the API design in this project?

### Answer
The API uses versioned REST endpoints under /api/v1. Auth routes handle login, verification, refresh, and profile access. Atom routes support creating notes from different sources, including article, PDF, voice, and image inputs. Review routes expose the daily review queue and grading action. Upload routes generate SAS-based Azure Blob URLs so the client can upload files directly. Search exposes a vector similarity endpoint using embeddings. The design is simple and resource-oriented, which is appropriate for the current stage of the product.

### Follow-up questions
- What would you change if the frontend needed more optimistic UI behavior?
- How would the API evolve as the product grows?
- What are the downsides of uploading directly to Azure Blob Storage from the client?
- Where would pagination or filtering be needed if the dataset became large?

---

## 6. Authentication Flow

### Question
Walk me through the authentication flow in this codebase.

### Answer
The flow starts when the client posts an email to /auth/login. The backend creates or finds the user and sends a magic link using Resend. When the user clicks the verification link, the server verifies the JWT, creates an access token and refresh token, and saves a session record. The client stores these tokens in localStorage and uses the access token in the Authorization header. If a request returns 401, the client attempts to refresh the session and reissue a token.

### Follow-up questions
- What are the security concerns with storing tokens in localStorage?
- How would you improve the flow for production readiness?
- Why is refresh-token rotation useful here?
- What would you add for OAuth or passkey support later?

---

## 7. Security

### Question
What security controls are present today, and what are the biggest gaps?

### Answer
The application uses Helmet, CORS, and authentication middleware. Uploads are scoped through Azure Blob SAS URLs, which limits the permissions the client has. Error responses are normalized and centralized. The biggest gaps are that refresh tokens are stored as plain values in the session table and the auth flow is fairly minimal. There is also limited validation around token claims, rate limiting, and abuse protections for login and upload endpoints.

### Follow-up questions
- How would you harden token storage and rotation?
- What additional validation would you add for uploads?
- How would you protect the login endpoint from abuse?
- How would you manage secrets in a production deployment?

---

## 8. Scalability

### Question
How would you reason about scalability for this system?

### Answer
The API is stateless apart from database and Redis dependencies, so it should be horizontally scalable. Heavy AI work is offloaded to BullMQ workers, which avoids blocking the request path. Redis is used as both a broker and a cache. The review system is query-driven instead of fully materialized in memory, which helps it scale better. For larger scale, I would focus on database indexing, queue backpressure, connection pooling, and isolating AI workloads from user-facing requests.

### Follow-up questions
- Where is the system most likely to bottleneck first?
- How would you handle bursts of atom creation and processing?
- What would you change if vector search became a hot path?
- How would you keep review scheduling safe under concurrency?

---

## 9. Performance

### Question
What are the main performance considerations in the current implementation?

### Answer
The most performance-sensitive areas are review retrieval, vector similarity search, and AI processing. Review retrieval uses a query against due review items and sorts by due time. Semantic search relies on vector comparisons against atom embeddings. AI processing is intentionally asynchronous to keep the API responsive. The frontend is lightweight and avoids unnecessary state complexity. The main opportunity is to optimize the vector and review queries as dataset size grows.

### Follow-up questions
- Which query would you optimize first for a large user base?
- What would you cache and what would you avoid caching?
- How would you profile slow endpoints in this stack?
- How would you reduce latency in the daily review experience?

---

## 10. Design Decisions

### Question
What design decisions stand out in this codebase, and why were they likely made?

### Answer
The project uses Prisma because it gives type-safe database access and migrations. It uses BullMQ and Redis to decouple expensive AI jobs from HTTP requests. It uses Azure Blob Storage with SAS URLs so the API does not become the file upload bottleneck. It also uses the FSRS library for spaced repetition rather than rebuilding the scheduler from scratch. These are pragmatic choices for a product that wants to move quickly without re-implementing infrastructure primitives.

### Follow-up questions
- Which of these decisions would you challenge if the team had more time?
- Why might a team prefer raw SQL for vector work?
- How would you justify background workers to a skeptical stakeholder?
- What would you replace if long-term maintainability were the priority?

---

## 11. Error Handling

### Question
How does the application handle errors today?

### Answer
The backend uses a centralized error middleware that translates known errors into stable JSON responses with status codes and error codes. The frontend uses a shared API helper that distinguishes network failures from auth failures and can recover using refresh logic. This is a good foundation, but the current implementation still relies on fairly generic error handling and would benefit from more structured observability around background jobs and external services.

### Follow-up questions
- Which error cases are still too generic?
- How would you improve observability for queue failures?
- What would you change if multiple clients consumed the API?
- How would you avoid exposing too much implementation detail in error responses?

---

## 12. Edge Cases

### Question
What edge cases does this codebase explicitly handle or not handle well?

### Answer
The implementation explicitly handles invalid upload URLs, empty transcriptions, article parsing failures, invalid review grades, and missing review state. It also has fallbacks in the serendipity feature when there is no recent review history or no similar atoms. However, it still has gaps around token storage, external-service failure modes, and malformed or unexpected file content. Those are the edge cases I would target next.

### Follow-up questions
- What would you do if Azure OpenAI or Azure Storage became temporarily unavailable?
- How would you make the background jobs idempotent?
- How would you handle malformed or corrupted files?
- What would you do if the review queue were empty or stale?

---

## 13. Trade-offs

### Question
What trade-offs are visible in the current implementation, and how would you defend them?

### Answer
The main trade-off is simplicity over architectural complexity. The team chose modular services and a straightforward REST API instead of a heavier framework or a more elaborate event-driven architecture. The app also uses localStorage for tokens, which is simpler but less secure than HttpOnly cookies. The use of Prisma plus targeted raw SQL for vector work is pragmatic and keeps the project moving, but it introduces some model inconsistency. Background processing improves responsiveness but adds operational complexity.

### Follow-up questions
- Which trade-off would you revisit first if you had one sprint to harden the system?
- How would you justify using Prisma and raw SQL together?
- What is the main risk of the current auth strategy?
- How would you explain the value of background processing to a product manager?

---

## 14. Design for Reliability

### Question
How would you make this system more reliable in production?

### Answer
I would tighten the operational story around authentication, external services, and background jobs. That means hashing refresh tokens, adding retries and idempotency for queue jobs, validating uploads more strictly, and adding structured logging and metrics. I would also add tests around the review engine, auth flows, and API modules so regressions are caught early. Reliability work is especially important here because the system depends on external services like Azure OpenAI and Azure Blob Storage.

### Follow-up questions
- Which reliability improvements would you ship first?
- How would you test the AI pipeline without depending on external services?
- What observability would you add for queue health and API latency?
- How would you handle partial failures during atom creation?

---

## 15. Product Maturity and Engineering Judgment

### Question
Based on this codebase, how mature is the product from an engineering perspective?

### Answer
The repository shows a credible foundation for a real product. The core loop of capturing content, creating atoms, scheduling reviews, and enriching content with AI is already fairly coherent. The codebase is structured enough to support iteration, and the backend/frontend split is sensible. However, several areas still feel early-stage: the capture UI is still a placeholder, some parts of the security story are underdeveloped, and the product claims in the high-level README are ahead of the implemented scope. From a senior-engineering perspective, I would describe it as promising but still in an early-to-mid implementation stage that needs stronger testing, hardening, and operational polish.

### Follow-up questions
- What would you prioritize first if you inherited this codebase tomorrow?
- Which areas are technical debt versus missing product features?
- How would you approach testing for this system in a realistic delivery cycle?
- What evidence suggests the product is still evolving rather than complete?

---

## 16. Bonus Interview Question

### Question
If you were asked to improve this codebase in one sprint, what would you focus on first?

### Answer
I would focus on trust and reliability. That means hardening authentication, making uploads and background jobs more resilient, adding meaningful tests, and improving observability. If I had to choose one thing, I would start with authentication and token handling because it affects every authenticated workflow and is a common source of production issues. After that, I would strengthen the AI pipeline and queue behavior so the system degrades gracefully when external services fail.

### Follow-up questions
- Why would you prioritize security before features?
- How would you convince stakeholders to invest in reliability work?
- What would a good production-readiness checklist look like for this project?
- How would you measure success after those changes?
