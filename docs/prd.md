# Product Requirements Document (PRD)

## Document status
- Owner: ABox
- Stage: MVP definition
- Version: Revised for AI-native direction

## 1. Product summary

ABox is an AI creation and sharing platform where users can turn prompts into creative assets, starting with images and expanding later to video and audio. The product should feel closer to an intelligent creative workspace than a simple prompt box or image upload feed.

The MVP focus is not full autonomy. It is a clean, reliable first system for:

1. accepting a prompt
2. creating a generation job
3. producing a result
4. saving and displaying that result
5. establishing the foundation for retrieval, evaluation, and personalization

## 2. Problem

Most AI creation products fall into one of two weak patterns:

- **toy generators** with no durable system design
- **heavy creative suites** that are too broad for early-stage focus

ABox should solve a narrower and more useful problem:

> Help users generate creative work with better structure, memory, and product quality than a raw prompt-to-image demo.

The product should support future differentiation through:
- reusable style knowledge
- policy-aware generation
- user taste memory
- evaluation and iteration
- content discovery/sharing

## 3. Vision

ABox becomes a creative AI platform that:
- understands what a user is trying to make
- can retrieve helpful context before generating
- produces assets that are saved, organized, and shareable
- gradually learns user taste over time

## 4. Target users

### Primary
**Creative explorers**
- want fast generation from prompts
- care about vibe, style, and presentation
- want results they can save/share

### Secondary
**Power users / creative builders**
- care about prompt quality
- want repeatable style outcomes
- want history, structure, and eventually personalization

### Tertiary
**Early adopters who treat the product as a creative lab**
- willing to try new generation modes
- give useful product feedback
- stress-test the workflow

## 5. Jobs to be done

### Functional jobs
- Generate a creative asset from a text prompt
- View the resulting asset with metadata
- Revisit previously generated content
- Discover or reuse styles/templates over time

### Emotional jobs
- Feel creatively assisted, not blocked
- Feel the system “gets” the intended vibe
- Feel work is worth saving and sharing

## 6. MVP goals

The MVP must deliver:

1. **Prompt-to-generation flow**
   - Authenticated user submits a prompt
   - System creates async generation job
   - Result is stored and shown on a content page

2. **Job lifecycle**
   - queued
   - running
   - completed
   - failed

3. **Generation metadata**
   - prompt
   - revised/generated plan prompt if available
   - model name
   - status
   - timestamps

4. **Foundations for future AI quality**
   - retrieval-ready knowledge layer
   - evaluation-ready architecture
   - clean separation of orchestration and persistence

5. **Startup-speed maintainability**
   - no big-bang rewrite
   - no fragile demo architecture
   - minimal but scalable interfaces

## 7. MVP non-goals

Not required for MVP launch:
- full multi-agent orchestration
- fully automated prompt refinement loops
- advanced personalization
- video/audio generation in production
- marketplace/payment features
- large moderation backend beyond sensible MVP safeguards
- broad collaborative features

## 8. Core user flows

### Flow A: Prompt-based creation
1. User signs in
2. User enters prompt on create screen
3. User submits request
4. System validates request and creates job
5. User sees job state
6. Result becomes available on content page

### Flow B: View result
1. User opens generated content
2. User sees asset, prompt, metadata, status
3. User can revisit/share later

### Flow C: Future retrieval-enhanced generation
1. User enters prompt
2. System retrieves relevant style/policy/template context
3. System builds a cleaner generation plan
4. Job runs against that plan

## 9. Functional requirements

### Required now
- Authenticated create flow
- Async job record creation
- Content placeholder or pending content record
- Generation result persistence
- Content detail view
- Basic error handling
- Basic validation
- Clear status model

### Required soon after
- RAG document storage
- Knowledge chunk retrieval
- Retrieval hook in generation planning
- Simple evaluation and retry policy

## 10. Non-functional requirements

- Maintainable TypeScript codebase
- Thin route handlers
- Explicit service boundaries
- Clear DB ownership and RLS posture
- Reasonable response time for job creation
- Safe failure states
- Easy migration path from current upload-oriented foundation

## 11. Success metrics

### MVP health metrics
- Job creation success rate
- Percentage of jobs that reach terminal state correctly
- Time from prompt submit to visible job state
- Time from job start to result availability
- Content detail page load success

### Product quality metrics
- Share of generated results users keep/view again
- Manual rating of result quality on seed prompts
- Retrieval usefulness on controlled test set
- Failure rate by category

## 12. Risks

- Overbuilding agents too early
- Rewriting working auth/storage unnecessarily
- Mixing AI orchestration into UI layer
- Weak status handling causing broken UX
- Retrieval built without permissions discipline
- Low-quality results with no evaluation plan

## 13. Open questions

- What generation provider/model path is used first?
- Should prompt templates be system-owned only in MVP?
- What exact content moderation level is required pre-launch?
- When should user taste memory become active?

## 14. Product principle

> ABox should feel like a serious creative product with startup speed, not a fragile AI demo.
