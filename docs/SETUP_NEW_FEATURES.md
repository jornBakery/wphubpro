# Setup: Notifications, Tickets, Forum

Create these Appwrite collections in `platform_db` before using the new features.

## 1. notifications

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| user_id | string | yes | 255 |
| type | string | yes | 50 |
| title | string | yes | 500 |
| body | string | yes | 5000 |
| read | boolean | yes | - |
| meta | string | no | 2000 |

**Indexes:** user_id, read, $createdAt (desc)

**Permissions:** create(users), read(users), update(users), create(team:admin)

---

## 2. tickets

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| user_id | string | yes | 255 |
| subject | string | yes | 500 |
| status | string | yes | 50 |
| priority | string | yes | 50 |
| category | string | no | 100 |
| site_id | string | no | 255 |

**Indexes:** user_id, status

**Permissions:** create(users), read(users), update(users), read(team:admin), update(team:admin)

---

## 3. ticket_messages

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| ticket_id | string | yes | 255 |
| user_id | string | yes | 255 |
| body | string | yes | 10000 |
| is_staff | boolean | yes | - |

**Indexes:** ticket_id

**Permissions:** create(users), read(users), read(team:admin), create(team:admin)

---

## 4. forum_categories

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| key | string | yes | 100 |
| name | string | yes | 255 |
| description | string | no | 500 |
| order | integer | yes | - |

**Indexes:** key (unique), order

**Permissions:** read(any), create(team:admin), update(team:admin)

---

## 5. forum_threads

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| category_id | string | yes | 255 |
| user_id | string | yes | 255 |
| title | string | yes | 500 |
| post_count | integer | yes | - |
| last_post_at | string | no | 64 |

**Indexes:** category_id, last_post_at (desc)

**Permissions:** create(users), read(any), update(users)

---

## 6. forum_posts

| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| thread_id | string | yes | 255 |
| user_id | string | yes | 255 |
| body | string | yes | 20000 |

**Indexes:** thread_id

**Permissions:** create(users), read(any)

---

## Deploy functions

```bash
appwrite deploy function
# or deploy individually:
appwrite functions create --function-id notifications --name notifications --runtime node-18.0 ...
```

Or use your existing deployment workflow.
