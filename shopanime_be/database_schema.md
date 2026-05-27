# AkibaCore MySQL Schema

Runtime schema is defined in `src/db/schema.ts`. The backend creates missing objects when `DB_SYNC_SCHEMA=true`.

## Schema Control

| Env | Behavior |
| --- | --- |
| `DB_SYNC_SCHEMA=true` | Creates missing tables, product columns, foreign keys, and indexes without dropping data |
| `DB_REBUILD_SCHEMA=true` | Drops and recreates app tables. Development only |
| `MOCK_DATA=true` | Inserts demo data once, tracked in `app_seed_runs` |
| `DB_SEED_ON_START=true` | Legacy seed switch. Prefer `MOCK_DATA` |

## Tables

| Table | Purpose | Key Constraints |
| --- | --- | --- |
| `app_seed_runs` | Records one-time seed runs | `seed_key` primary key |
| `users` | Customer/admin accounts | Unique `username`, unique `email` |
| `user_addresses` | User shipping addresses | FK `user_id -> users.id` |
| `authors` | Product authors | Primary key `id` |
| `publishers` | Product publishers | Primary key `id` |
| `book_series` | Manga/book series | Primary key `id` |
| `categories` | Product categories | Self FK `parent_id -> categories.id` |
| `products` | Sellable catalog items | FK to `categories`, `authors`, `publishers`, `book_series`; unique `slug`, `isbn`, `sku` |
| `product_categories` | Secondary product categories | Composite PK `(product_id, category_id)` |
| `inventory_transactions` | Stock movement history | FK `product_id -> products.id`, `created_by -> users.id` |
| `carts` | Cart items | Unique `(user_id, product_id)`, FK to `users` and `products` |
| `wishlists` | Wishlist items | Unique `(user_id, product_id)`, FK to `users` and `products` |
| `orders` | Customer orders | FK `user_id -> users.id`, FK `shipping_address_id -> user_addresses.id` |
| `order_items` | Order line items | FK `order_id -> orders.id`, FK `product_id -> products.id` |
| `reviews` | Product reviews | FK `user_id`, `product_id`, `order_id`; rating check `1..5` |
| `posts` | Community posts | FK `user_id -> users.id` |
| `post_comments` | Post comments and replies | FK `post_id`, `user_id`, self FK `parent_id` |
| `post_likes` | Per-user post likes | Unique `(post_id, user_id)`, FK to `posts` and `users` |
| `banners` | Homepage/shop banners | Primary key `id` |

## Seed Data

Mock data lives in `mockData.ts` and intentionally contains only tables that exist in the runtime schema.
The current demo dataset includes 60 users, 48 products, 90 orders, carts, wishlists, reviews, feed posts, comments, and banners with FK-safe ids.

Seed rules:

1. Backend starts and connects to MySQL.
2. If `DB_SYNC_SCHEMA=true`, missing schema objects are created.
3. If `MOCK_DATA=true`, backend checks `app_seed_runs` for `mock_data_v1`.
4. If the marker exists, seed is skipped.
5. If products already exist but the marker does not, backend records the marker and skips seed to avoid polluting real data.
6. If no products exist, backend inserts mock users, catalog data, carts, wishlists, orders, reviews, feed data, banners, then records the marker.

Seeded demo accounts use password `password123`. The first successful login upgrades the legacy demo hash to the current scrypt format.

## Password Storage

Passwords are never stored as plain text.

Current format:

```text
base64:<Base64 of "scrypt:<salt>:<derived-key>">
```

Example:

```text
base64:c2NyeXB0Oj...
```

Important details:

- Base64 is only an encoding layer for cleaner storage/display in tools like phpMyAdmin.
- The security boundary is still `scrypt` with a per-password random salt.
- Existing legacy rows with `scrypt:<salt>:<derived-key>` are automatically migrated to `base64:<...>` on backend startup when `DB_SYNC_SCHEMA=true`.
- Legacy mock rows with `dev-password-hash` are migrated to the Base64-wrapped scrypt hash for `password123` on backend startup.

## Important Admin Write Rules

The service layer validates FK-bound input before writing:

- Product `category_id`, `author_id`, `publisher_id`, and `series_id` must exist when provided.
- Category `parent_id` must exist and cannot point to itself.
- User `role` must be `ADMIN` or `CUSTOMER`.
- User `status` must be `ACTIVE`, `INACTIVE`, or `LOCKED`.
- Order status must be `PENDING`, `PROCESSING`, `SHIPPED`, `COMPLETED`, or `CANCELLED`.
- Reviews require an existing user, existing product, valid rating, and an order owned by that user when `order_id` is provided.

## Indexes

Startup schema sync ensures indexes for common reads:

- Product listing/filtering: status, created time, price, category, author
- Orders: user, status, created time, order code
- Reviews: product, status, order
- Posts/comments/likes: user, status, parent thread, liked user
- Inventory history: product and created time

## Reset Local Development Data

Use only when you intentionally want to drop app tables:

```env
DB_REBUILD_SCHEMA=true
MOCK_DATA=true
```

Start the backend once, then immediately set:

```env
DB_REBUILD_SCHEMA=false
```

If you already seeded an older mock dataset and only want to re-run mock seed in a development database, remove the marker after clearing demo rows:

```sql
DELETE FROM app_seed_runs WHERE seed_key = 'mock_data_v1';
```
