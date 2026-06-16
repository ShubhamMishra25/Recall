## 1. Core Entities

### USER
Stores account & profile information.  
**Primary Key:** `id` (UUID)
- `email` (unique)
- `name`
- `settings` (JSON) – notification prefs, AI toggles
- `created_at`
- `updated_at`

### ATOM
The central unit – a single “nugget” of knowledge.  
**Primary Key:** `id` (UUID)
- `user_id` (FK → User)
- `content_text`
- `content_html`
- `source_url`
- `source_type` (enum: `article`, `note`, `pdf`, `voice`, `image`)
- `embedding` (vector(1536), optional)
- `flashcard_front` (nullable text)
- `flashcard_back` (nullable text)
- `created_at`
- `updated_at`

> *We embed flashcard attributes directly in Atom (1:1), no separate Flashcard entity.*

### TAG
Labels for organising atoms; each tag belongs to one user.  
**Primary Key:** `id` (UUID)
- `name`
- `user_id` (FK → User)

### ATOM_TAG (Associative)
Links atoms to tags (many‑to‑many).  
**Primary Key:** (`atom_id`, `tag_id`)
- `atom_id` (FK → Atom)
- `tag_id` (FK → Tag)

### REVIEW_STATE
FSRS memory parameters for one atom and one user.  
**Primary Key:** (`atom_id`, `user_id`)
- `atom_id` (FK → Atom)
- `user_id` (FK → User)
- `stability` (real)
- `difficulty` (real)
- `elapsed_days` (integer)
- `scheduled_for` (date)
- `last_reviewed` (timestamp)
- `reps` (integer)
- `lapses` (integer)

### COLLECTION
A named group of atoms, owned by a user.  
**Primary Key:** `id` (UUID)
- `name`
- `owner_id` (FK → User)
- `created_at`

### COLLECTION_ATOM (Associative)
Connects atoms to collections.  
**Primary Key:** (`collection_id`, `atom_id`)
- `collection_id` (FK → Collection)
- `atom_id` (FK → Atom)
- `added_by` (FK → User)

### COLLECTION_MEMBER (Associative)
Membership with role.  
**Primary Key:** (`collection_id`, `user_id`)
- `collection_id` (FK → Collection)
- `user_id` (FK → User)
- `role` (enum: `owner`, `editor`, `commenter`, `viewer`)

### LINK
Bidirectional connections between atoms.  
**Primary Key:** (`source_atom_id`, `target_atom_id`) or surrogate `id`
- `source_atom_id` (FK → Atom)
- `target_atom_id` (FK → Atom)
- `user_id` (FK → User, who created the link)
- `link_type` (`manual`, `ai_generated`)

### SESSION
Active login sessions for auth auditing.  
**Primary Key:** `id` (UUID)
- `user_id` (FK → User)
- `refresh_token_hash`
- `device_info`
- `ip_address`
- `created_at`
- `expires_at`
- `revoked` (boolean)

---

## 2. Relationships (Cardinality)

| Entity 1 | Relationship | Entity 2 | Type |
|----------|--------------|----------|------|
| User | *captures* | Atom | One‑to‑many (1:N). A user creates many atoms; each atom belongs to exactly one user. |
| User | *owns* | Tag | One‑to‑many (1:N). A user creates their own tags. |
| Atom | *tagged with* | Tag | Many‑to‑many (M:N) via **ATOM_TAG**. |
| Atom | *has review state* | ReviewState | One‑to‑one (1:1) per user. Each atom has exactly one ReviewState for the atom owner. (In a multi‑user scenario, a user reviewing a shared atom could have a ReviewState, but for initial design we keep it 1:1 per atom.) |
| User | *performs review* | ReviewState | One‑to‑many (1:N). A user has many review states (one per atom). |
| User | *owns* | Collection | One‑to‑many (1:N). A user creates many collections. |
| Collection | *contains* | Atom | Many‑to‑many (M:N) via **COLLECTION_ATOM**. |
| User | *member of* | Collection | Many‑to‑many (M:N) via **COLLECTION_MEMBER** (with role). |
| Atom | *linked to* | Atom | Many‑to‑many self‑referential via **LINK**. Each atom can have many related atoms. |
| User | *creates* | Link | One‑to‑many (1:N). A user can create many links. |
| User | *has* | Session | One‑to‑many (1:N). A user can have multiple active sessions. |

---

## 3. ER Diagram Summary (Textual)

```
┌──────────┐       ┌────────────┐       ┌──────────┐
│   User   │───1:N───│   Atom     │───1:1───│ReviewState│
└──────────┘       └────────────┘       └──────────┘
     │                   │ (M:N)              │
     │ 1:N              ┌─┴───┐              N:1
     │                   │ AtomTag (M:N)      User
┌────┴──────┐           ┌─┴───┐
│   Tag     │           │ Tag  │
└───────────┘           └──────┘

┌──────────┐       ┌────────────────┐
│   User   │───1:N───│  Collection    │
└──────────┘       └────────────────┘
     │                  │ (M:N) via CollectionAtom
     │                  │
     │ M:N via          │
     │ CollectionMember │
     │ (with role)      │
     └──────────────────┘

┌──────────┐        ┌────────────────┐
│   Atom   │────M:N──│     Atom       │ (self-referential)
└──────────┘        └────────────────┘
     │                      │
     └──────────Link─────────┘
                 │
                 N:1
                 User

┌──────────┐
│ Session  │──N:1── User
└──────────┘
```

---
