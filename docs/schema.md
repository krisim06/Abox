# ABox Database Schema

Database: Supabase PostgreSQL

## Notes

This is the initial schema for the MVP.
It should support:
- users
- content publishing
- remix relationships
- future feed growth

---

## users

Represents creator profiles.

Fields:
- id (uuid, primary key)
- username (text, unique, required)
- bio (text, nullable)
- avatar_url (text, nullable)
- created_at (timestamp, required)

---

## contents

Represents published AI-generated content.

Fields:
- id (uuid, primary key)
- user_id (uuid, foreign key to users.id, required)
- title (text, required)
- image_url (text, required)
- prompt (text, required)
- model (text, required)
- seed (text, nullable)
- parent_content_id (uuid, foreign key to contents.id, nullable)
- created_at (timestamp, required)

Notes:
- parent_content_id is nullable for original content
- parent_content_id is set when a content item is a remix

---

## likes

Represents a user liking a content item.

Fields:
- id (uuid, primary key)
- user_id (uuid, foreign key to users.id, required)
- content_id (uuid, foreign key to contents.id, required)
- created_at (timestamp, required)

Constraint:
- unique(user_id, content_id)

---

## follows

Represents one user following another.

Fields:
- id (uuid, primary key)
- follower_id (uuid, foreign key to users.id, required)
- following_id (uuid, foreign key to users.id, required)
- created_at (timestamp, required)

Constraint:
- unique(follower_id, following_id)

---

## Suggested Future Indexes

Consider indexes for:
- contents.created_at
- contents.user_id
- contents.parent_content_id
- likes.content_id
- follows.follower_id
- follows.following_id

---

## Row-Level Security Considerations

Later, policies should ensure:
- only authenticated users can upload
- only content owners can edit/delete their own content
- public content can be read by everyone
- private/internal routes do not leak unauthorized data