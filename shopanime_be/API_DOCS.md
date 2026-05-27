# AkibaCore Backend API

Base URL:

```text
http://localhost:4000/api
```

Most endpoints return JSON wrapped in `data`. Admin endpoints require `Authorization: Bearer <token>`. In local development only, protected endpoints also accept `x-user-id` for quick testing.

## Auth

Login with seeded admin:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaito@example.com","password":"password123"}'
```

Get current user:

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

Register customer:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newfan","email":"newfan@example.com","password":"password123","full_name":"New Fan"}'
```

## Products

List products:

```bash
curl "http://localhost:4000/api/products?page=1&limit=12&search=chainsaw&sort=newest"
```

Filter products:

```bash
curl "http://localhost:4000/api/products?genres=shounen,action&minPrice=5&maxPrice=50&minRating=4&seriesStatus=ONGOING&sort=price_asc"
```

Get product detail by slug:

```bash
curl "http://localhost:4000/api/products/chainsaw-man-vol-1"
```

Create product as admin:

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name":"Berserk Deluxe Volume 1",
    "slug":"berserk-deluxe-volume-1",
    "author_id":1,
    "category_id":2,
    "publisher_id":1,
    "series_id":1,
    "original_price":49.99,
    "discount_percent":24,
    "shipping_fee":5.99,
    "shipping_discount_percent":100,
    "stock_quantity":21,
    "image_url":"https://example.com/berserk.jpg",
    "description":"Premium dark fantasy manga volume.",
    "status":"ACTIVE"
  }'
```

Update product:

```bash
curl -X PUT http://localhost:4000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"stock_quantity":40,"discount_percent":10,"status":"ACTIVE"}'
```

Delete product:

```bash
curl -X DELETE http://localhost:4000/api/products/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Product write validation:

- `author_id`, `category_id`, `publisher_id`, and `series_id` must exist when provided.
- `original_price` must be greater than `0`.
- `discount_percent` must be between `0` and `95`.
- `shipping_discount_percent` must be between `0` and `100`.
- `status` must be `ACTIVE`, `INACTIVE`, `DRAFT`, or `OUT_OF_STOCK`.

## Categories And Authors

List categories:

```bash
curl http://localhost:4000/api/categories
```

Create category:

```bash
curl -X POST http://localhost:4000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"Romance","slug":"romance","parent_id":null,"description":"Romance manga"}'
```

Update category:

```bash
curl -X PUT http://localhost:4000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"description":"Updated category copy","status":"ACTIVE"}'
```

List authors:

```bash
curl http://localhost:4000/api/authors
```

Create author:

```bash
curl -X POST http://localhost:4000/api/authors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"Kentaro Miura","slug":"kentaro-miura","country":"Japan","bio":"Creator of Berserk."}'
```

## Users And Addresses

List users as admin:

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Create user as admin:

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"username":"customer01","email":"customer01@example.com","password":"password123","full_name":"Customer 01","role":"CUSTOMER","status":"ACTIVE"}'
```

Get user addresses:

```bash
curl http://localhost:4000/api/users/1/addresses \
  -H "Authorization: Bearer <TOKEN>"
```

Create address:

```bash
curl -X POST http://localhost:4000/api/users/1/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"receiver_name":"Kaito Tanaka","receiver_phone":"09012345678","address_line":"123 Shibuya","ward":"Shibuya","district":"Shibuya-ku","city":"Tokyo","country":"Japan","is_default":true}'
```

User write validation:

- `role` must be `ADMIN` or `CUSTOMER`.
- `status` must be `ACTIVE`, `INACTIVE`, or `LOCKED`.
- `password`, when creating a user, is hashed by backend and stored as `base64:<Base64 of "scrypt:<salt>:<derived-key>">`.
- Never send an already-hashed password from the frontend. Send the plain password over HTTPS and let the backend hash it.

## Cart And Wishlist

Get cart:

```bash
curl http://localhost:4000/api/cart/1 \
  -H "Authorization: Bearer <TOKEN>"
```

Add to cart:

```bash
curl -X POST http://localhost:4000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"user_id":1,"product_id":2,"quantity":1}'
```

Update cart item:

```bash
curl -X PUT http://localhost:4000/api/cart/1/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"quantity":3}'
```

Get wishlist:

```bash
curl http://localhost:4000/api/wishlist \
  -H "Authorization: Bearer <TOKEN>"
```

Add wishlist item:

```bash
curl -X POST http://localhost:4000/api/wishlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"product_id":3}'
```

Remove wishlist item:

```bash
curl -X DELETE http://localhost:4000/api/wishlist/3 \
  -H "Authorization: Bearer <TOKEN>"
```

## Orders

Checkout from cart:

```bash
curl -X POST http://localhost:4000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"user_id":1,"receiver_name":"Kaito Tanaka","receiver_phone":"09012345678","shipping_address_line":"123 Shibuya","shipping_city":"Tokyo","shipping_method":"STANDARD"}'
```

Buy now checkout:

```bash
curl -X POST http://localhost:4000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"user_id":1,"receiver_name":"Kaito Tanaka","receiver_phone":"09012345678","shipping_address_line":"123 Shibuya","shipping_city":"Tokyo","items":[{"product_id":1,"quantity":1}]}'
```

List all orders as admin:

```bash
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Update order status:

```bash
curl -X PUT http://localhost:4000/api/orders/10234/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"status":"SHIPPED"}'
```

Allowed order statuses: `PENDING`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.

## Community

List posts:

```bash
curl http://localhost:4000/api/posts
```

Create post:

```bash
curl -X POST http://localhost:4000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"user_id":1,"content":"New manga haul arrived."}'
```

Like post:

```bash
curl -X POST http://localhost:4000/api/posts/1/like \
  -H "Authorization: Bearer <TOKEN>"
```

The like endpoint toggles the current user's like and returns the updated state:

```json
{
  "success": true,
  "data": {
    "liked": true,
    "like_count": 12
  }
}
```

Create post comment:

```bash
curl -X POST http://localhost:4000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"content":"Great haul."}'
```

Update own post comment:

```bash
curl -X PUT http://localhost:4000/api/posts/1/comments/7 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"content":"Updated comment."}'
```

Hide a comment as admin:

```bash
curl -X PUT http://localhost:4000/api/posts/1/comments/7/hide \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Delete own post comment:

```bash
curl -X DELETE http://localhost:4000/api/posts/1/comments/7 \
  -H "Authorization: Bearer <TOKEN>"
```

Get reviews:

```bash
curl http://localhost:4000/api/reviews/1
```

Create review:

```bash
curl -X POST http://localhost:4000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"user_id":2,"product_id":1,"order_id":10233,"rating":5,"comment":"Excellent print quality."}'
```

Review validation:

- `user_id` must exist.
- `product_id` must exist.
- `order_id`, when provided, must belong to that user.
- `rating` must be an integer from `1` to `5`.

## Chatbot

Proxy customer chat to n8n:

```bash
curl -X POST http://localhost:4000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"chào em","sessionId":"demo-session","pageUrl":"/"}'
```

Expected successful response:

```json
{
  "data": {
    "reply": "Xin chào, AkibaCore có thể hỗ trợ bạn hôm nay như thế nào?"
  }
}
```

## Admin Product AI

Generate product description:

```bash
curl -X POST http://localhost:4000/api/admin/product-ai/description/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"instruction":"Tạo mô tả cho manga phiêu lưu về công chúa được giải cứu","product":{"name":"Akiba Adventure","category":"Adventure","author":"AkibaCore","price":12.5}}'
```

Revise product description:

```bash
curl -X POST http://localhost:4000/api/admin/product-ai/description/revise \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"description":"Bản mô tả hiện tại cần chỉnh sửa.","instruction":"Làm cảm xúc hơn nhưng vẫn chuẩn SEO","product":{"name":"Akiba Adventure","category":"Adventure","author":"AkibaCore","price":12.5}}'
```

The product AI response shape is:

```json
{
  "data": {
    "description": "Generated description text",
    "source": "gemini"
  }
}
```
