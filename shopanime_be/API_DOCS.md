# Shop Anime - Backend API Documentation

Base URL: `http://localhost:4000/api`

Tất cả các API Output đều wrap trong property `data` hoặc `success` dựa trên tính chuẩn hóa JSON.

---

## 1. Auth & Users (Người dùng)

### **📌 Role-Based Access Control (RBAC)**
Hệ thống back-end đã tích hợp phân quyền **Admin** và **Customer**.
Để gửi request giả định là User đăng nhập, **phải truyền Auth Header**: `x-user-id` (hoặc `Authorization: Bearer <user_id>`).
- Cấp quyền **ADMIN**: thêm header `x-user-id: 1`
- Cấp quyền **CUSTOMER** thông thường: thêm header `x-user-id: 2` (hoặc số ID khác).

### 1.1 Lấy danh sách users (Dành cho Admin)
- **Endpoint:** `GET /api/users`
- **Mô tả:** Lấy danh sách người dùng. Bắt buộc quyền Admin.
- **Header:** Cần thêm header (ví dụ: `-H "x-user-id: 1"`)
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/users -H "x-user-id: 1"
  ```
- **Output:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "username": "kaitotanaka",
        "email": "kaito@example.com",
        "full_name": "Kaito Tanaka",
        "avatar_url": "https://i.pravatar.cc/150?u=kaito",
        "phone": null,
        "status": "ACTIVE",
        "created_at": "2026-05-10 12:21:30"
      }
    ]
  }
  ```

### 1.2 Lấy chi tiết user
- **Endpoint:** `GET /api/users/:id`
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/users/1
  ```

### 1.3 Lấy danh sách địa chỉ của User
- **Endpoint:** `GET /api/users/:id/addresses`
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/users/1/addresses
  ```

### 1.4 Thêm địa chỉ mới
- **Endpoint:** `POST /api/users/:id/addresses`
- **Body:**
  ```json
  {
    "receiver_name": "Nguyen Van A",
    "receiver_phone": "0987654321",
    "address_line": "123 Đường B",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP HCM",
    "is_default": true
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:4000/api/users/1/addresses \
  -H "Content-Type: application/json" \
  -d '{"receiver_name":"A","receiver_phone":"0987654321","address_line":"123","ward":"1","district":"1","city":"HCM","is_default":true}'
  ```

### 1.5 Cập nhật thông tin User
- **Endpoint:** `PUT /api/users/:id`
- **Body:** `{"full_name": "New Name", "phone": "0123"}`

### 1.6 Xóa User (Dành cho Admin)
- **Endpoint:** `DELETE /api/users/:id`
- **Header:** Bắt buộc phải là quyền Admin (ví dụ: `x-user-id: 1`)

### 1.7 Cập nhật thông tin địa chỉ
- **Endpoint:** `PUT /api/users/:id/addresses/:addressId`
- **Body:** Có các thông tin như khi tạo

### 1.8 Xóa địa chỉ
- **Endpoint:** `DELETE /api/users/:id/addresses/:addressId`

---

## 2. Catalog (Sách Truyện & Sản phẩm)

### 2.1 Lấy danh sách sản phẩm
- **Endpoint:** `GET /api/products`
- **Query Params:** `page`, `limit`, `search`, `category`, `genres`, `minPrice`, `maxPrice`, `minRating`, `seriesStatus`, `sort`
- **Filter Notes:**
  - `page`: trang hien tai, mac dinh `1`.
  - `limit`: so san pham moi trang, mac dinh `20`, toi da `60`.
  - `search`: tim trong ten san pham, slug, mo ta, tac gia, danh muc, series.
  - `category`: category id hoac slug.
  - `genres`: danh sach category slug, cach nhau bang dau phay. Vi du: `shounen,action`.
  - `minPrice`, `maxPrice`: loc theo gia ban thuc te sau giam (`price`). `original_price` chi dung de hien thi gia goc. Neu truyen ca hai gia tri thi `maxPrice` phai lon hon `minPrice`.
  - `minRating`: gia tri tu `1` den `5`, loc theo `average_rating >= minRating`.
  - `seriesStatus`: `ONGOING`, `COMPLETED`, hoac `HIATUS`.
  - `sort`: `popularity`, `newest`, `price_asc`, `price_desc`, hoac `rating`.
- **cURL:**
  ```bash
  curl "http://localhost:4000/api/products?page=1&limit=15&search=berserk&genres=seinen,action&minPrice=5&maxPrice=50&minRating=4&seriesStatus=ONGOING&sort=price_asc"
  ```
- **Invalid Price Range Response:**
  ```json
  {
    "message": "maxPrice must be greater than minPrice",
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Output:** response gom `data` va `meta` phan trang.
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Berserk",
        "slug": "berserk",
        "original_price": "19.99",
        "discount_percent": "30.00",
        "price": "13.99",
        "discount_price": "13.99",
        "discount_amount": "6.00",
        "has_discount": 1,
        "average_rating": "5.0000",
        "review_count": 1,
        "external_rating": "9.47",
        "external_rating_count": 700000,
        "external_rating_source": "MyAnimeList"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 15,
      "total": 35,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```

### 2.2 Lấy chi tiết sản phẩm
- **Endpoint:** `GET /api/products/:slug`
- **Mota:** Frontend public detail dung slug san pham, khong dung id trong URL. Backend van tam thoi fallback numeric id de tuong thich du lieu/link cu.
- **cURL:**
  ```bash
  curl "http://localhost:4000/api/products/chainsaw-man"
  ```

### 2.3 Thêm sản phẩm (Admin)
- **Endpoint:** `POST /api/products`
- **Header:** Bắt buộc quyền Admin
- **Body Params:** `name`, `slug`, `author_id`, `category_id`, `original_price`, `discount_percent`, `image_url`, `description`, `stock_quantity`, `status`
- **Pricing Rule:** Admin nhap `original_price` va `discount_percent`; backend tu tinh `price = original_price * (1 - discount_percent / 100)`. `discount_percent` hop le tu `0` den `95`. `discount_price` chi giu de tuong thich response cu, client khong can nhap thu cong.
- **Example Body:**
  ```json
  {
    "name": "Berserk Deluxe Volume 1",
    "slug": "berserk-deluxe-volume-1",
    "author_id": 1,
    "category_id": 2,
    "original_price": 49.99,
    "discount_percent": 24,
    "stock_quantity": 21,
    "image_url": "https://example.com/berserk.jpg",
    "description": "Dark fantasy manga volume.",
    "status": "ACTIVE"
  }
  ```

### 2.4 Sửa thông tin sản phẩm (Admin)
- **Endpoint:** `PUT /api/products/:id`
- **Pricing Update:** Gui `original_price` hoac `discount_percent` se lam backend tinh lai `price` va `discount_price`. Neu khong gui hai truong nay thi gia duoc giu nguyen.
- **Header:** Bắt buộc quyền Admin

### 2.5 Xóa sản phẩm (Admin)
- **Endpoint:** `DELETE /api/products/:id`
- **Header:** Bắt buộc quyền Admin

### 2.6 Lấy danh sách danh mục (Categories)
- **Endpoint:** `GET /api/categories`

### 2.7 Thêm danh mục (Admin)
- **Endpoint:** `POST /api/categories`
- **Header:** Bắt buộc quyền Admin
- **Body:** `{"name": "Action", "slug": "action"}`

### 2.8 Sửa danh mục (Admin)
- **Endpoint:** `PUT /api/categories/:id`

### 2.9 Xóa danh mục (Admin)
- **Endpoint:** `DELETE /api/categories/:id`

### 2.10 Lấy danh sách tác giả
- **Endpoint:** `GET /api/authors`

### 2.11 Thêm tác giả (Admin)
- **Endpoint:** `POST /api/authors`

### 2.12 Sửa tác giả (Admin)
- **Endpoint:** `PUT /api/authors/:id`

### 2.13 Xóa tác giả (Admin)
- **Endpoint:** `DELETE /api/authors/:id`

---

## 3. Cart & Orders (Giỏ hàng & Mua sắm)

### 3.1 Xem giỏ hàng của user
- **Endpoint:** `GET /api/cart/:user_id`
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/cart/1
  ```

### 3.2 Thêm sản phẩm vào giỏ (hoặc cập nhật số lượng)
- **Endpoint:** `POST /api/cart`
- **Body:** `{"user_id": 1, "product_id": 2, "quantity": 1}`
- **cURL:**
  ```bash
  curl -X POST http://localhost:4000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "product_id": 2, "quantity": 1}'
  ```

### 3.3 Cập nhật số lượng item
- **Endpoint:** `PUT /api/cart/:user_id/:product_id`
- **Body:** `{"quantity": 3}`

### 3.4 Đặt hàng (Checkout)
- **Endpoint:** `POST /api/orders/checkout`
- **Body:**
  ```json
  {
    "user_id": 1,
    "receiver_name": "A",
    "receiver_phone": "0987654321",
    "shipping_address_line": "123 ABC",
    "shipping_city": "HCM",
    "shipping_method": "STANDARD"
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:4000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"receiver_name":"A","receiver_phone":"098","shipping_address_line":"x","shipping_city":"y"}'
  ```
- **Tính năng Backend Checkout:** Backend sẽ map với Carts của user, kiểm tra và trừ tồn kho (stock_quantity), lưu Transaction Inventory, tính Total tự động và xóa Giỏ Hàng.

### 3.5 Lấy lịch sử đơn hàng của User
- **Endpoint:** `GET /api/orders/user/:userId`
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/orders/user/1
  ```

---

## 4. Community (Mạng xã hội thu nhỏ)

### 4.1 Lấy danh sách Feed/Post
- **Endpoint:** `GET /api/posts`
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/posts
  ```

### 4.2 Thêm bài viết mới
- **Endpoint:** `POST /api/posts`
- **Body:** `{"user_id": 1, "content": "Hello World"}`

### 4.3 Like bài viết
- **Endpoint:** `POST /api/posts/:id/like`
- **cURL:**
  ```bash
  curl -X POST http://localhost:4000/api/posts/1/like
  ```

### 4.4 Lấy đánh giá (Reviews) của Sản phẩm
- **Endpoint:** `GET /api/reviews/:productId`
- **Ghi chu:** Diem sao hien thi tren san pham duoc dong bo tu bang `reviews` qua `average_rating` va `review_count`. Khi review moi duoc tao, backend cap nhat lai hai truong nay tren `products`.
- **cURL:**
  ```bash
  curl -X GET http://localhost:4000/api/reviews/1
  ```

### 4.5 Viết đánh giá sản phẩm
- **Endpoint:** `POST /api/reviews`
- **Body:** `{"user_id": 1, "product_id": 1, "order_id": 10234, "rating": 5, "comment": "Great!"}`
- **Validation:** `rating` phai la so nguyen tu `1` den `5`.
