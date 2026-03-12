# ABox Product Requirements Document

## Product Summary

ABox is an AI creator publishing platform for image-first AI content.

The goal is to help creators publish, share, remix, and discover AI-generated works.

Core loop:
- creation (창작)
- sharing (공유)
- remix (재창작)
- monetization (수익화)
- community (커뮤니티)

---

## Problem

AI creators have powerful generation tools, but no strong native platform focused on publishing and remix relationships.

Today, creators often use external tools to generate content, then publish on generic platforms that do not preserve prompt, model, seed, or remix lineage.

---

## Product Vision

ABox should become a creator-native platform where AI-generated content can be:
- published cleanly
- attributed properly
- remixed easily
- discovered through relationships, not only feeds

---

## Target Users

Initial target users:
- AI image creators
- Midjourney users
- Stable Diffusion users
- ComfyUI users

---

## MVP Goals

The MVP should prove that creators are willing to:
- upload their works
- attach metadata
- view other creators’ works
- remix existing works
- build a profile identity on the platform

---

## MVP Features

### 1. Authentication
Users can sign up, sign in, and access authenticated product features.

### 2. Content Upload
Users can upload image-based AI content with metadata:
- title
- prompt
- model
- seed
- image file

### 3. Public Feed
Users can browse recently published content.

### 4. Content Detail Page
Each content item should have its own detail page with:
- image
- title
- creator
- prompt
- model
- seed
- remix action

### 5. Creator Profile
Each user should have a profile page showing:
- username
- avatar
- bio
- created works

### 6. Remix Flow
Users should be able to remix an existing work.
The remix flow should:
- prefill prompt/model/seed from the source work
- let the user modify metadata
- save a new content item
- preserve the parent-child relationship

---

## Non-Goals for MVP

Do not build these yet:
- AI generation inside the platform
- payments
- subscriptions
- recommendation engine
- comments
- notifications
- advanced moderation
- internal messaging

---

## Product Principles

- Keep the experience simple
- Start with image-first scope
- Preserve future remix lineage support
- Optimize for real creator usage, not feature quantity
- Build for clarity and future extensibility

---

## Success Criteria

Initial success signals:
- first 50 creators sign up
- creators upload at least 3 pieces of content on average
- at least some users use remix
- users revisit profile and feed pages