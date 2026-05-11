# Thiết kế Cơ sở dữ liệu (Database Schema) cho Shop Truyện (Comic/Manga Store)

Dựa trên yêu cầu chuyên biệt cho một website bán truyện (Manga, Comic, Tiểu thuyết), kết hợp thương mại điện tử chuyên nghiệp và mạng xã hội thu nhỏ cộng đồng, dưới đây là lược đồ CSDL MySQL hoàn chỉnh, tích hợp đầy đủ tính năng phân quyền, quản lý kho, giao dịch, và chăm sóc khách hàng.

---

## 1. Người dùng & Bảo mật (Users & Security)

### Bảng `users`
- `id` (INT, PK, Auto Increment)
- `username` (VARCHAR 50, Unique, Not Null)
- `email` (VARCHAR 100, Unique, Not Null)
- `password_hash` (VARCHAR 255, Not Null)
- `full_name` (VARCHAR 100)
- `phone` (VARCHAR 20)
- `avatar_url` (VARCHAR 255)
- `status` (ENUM: 'ACTIVE', 'INACTIVE', 'BANNED') - Mặc định: 'ACTIVE'
- `email_verified_at` (DATETIME, Nullable)
- `last_login_at` (DATETIME, Nullable)
- `last_login_ip` (VARCHAR 45, Nullable)
- `failed_login_attempts` (INT, Default 0)
- `locked_until` (DATETIME, Nullable)
- `remember_token` (VARCHAR 255, Nullable)
- `created_at`, `updated_at` (TIMESTAMP)

### Bảng `user_addresses`
- `id` (INT, PK)
- `user_id` (INT, FK -> users)
- `receiver_name` (VARCHAR 100)
- `receiver_phone` (VARCHAR 20)
- `address_line` (VARCHAR 255)
- `ward` (VARCHAR 100)
- `district` (VARCHAR 100)
- `city` (VARCHAR 100)
- `country` (VARCHAR 100, Default 'Vietnam')
- `postal_code` (VARCHAR 20)
- `address_type` (ENUM: 'HOME', 'OFFICE', 'OTHER') - Mặc định: 'HOME'
- `is_default` (BOOLEAN, Default FALSE)
- `created_at`, `updated_at`

### Bảng `password_reset_tokens`
- `id` (INT, PK)
- `user_id` (INT, FK -> users)
- `token_hash` (VARCHAR 255, Not Null)
- `expires_at` (DATETIME, Not Null)
- `used_at` (DATETIME, Nullable)
- `created_at` (TIMESTAMP)

### Bảng `user_sessions`
- `id` (INT, PK)
- `user_id` (INT, FK -> users)
- `refresh_token_hash` (VARCHAR 255, Not Null)
- `device_name` (VARCHAR 255)
- `ip_address` (VARCHAR 45)
- `user_agent` (TEXT)
- `expires_at` (DATETIME, Not Null)
- `revoked_at` (DATETIME, Nullable)
- `created_at` (TIMESTAMP)

### Phân quyền (RBAC)
- Khởi tạo các bảng `roles`, `permissions`, `role_permissions`, `user_roles` cho Admin Panel chuyên nghiệp.

---

## 2. Quản lý Sách Truyện & Liên quan (Books & Catalog)

### Bảng Phân loại Tác Giả & Nhà Xuất Bản
- **`authors`**: `id`, `name`, `slug`, `bio`, `avatar_url`, `country`, `created_at`, `updated_at`
- **`publishers`**: `id`, `name`, `slug`, `description`, `logo_url`, `website`, `created_at`, `updated_at`
- **`book_series`** (Bộ truyện): `id`, `name`, `slug`, `description`, `cover_url`, `total_volumes`, `status` (ONGOING, COMPLETED, HIATUS), `created_at`, `updated_at`
- **`categories`** (Danh mục chính): `id`, `parent_id`, `name`, `slug`, `description`, `image_url`, `sort_order`, `status`, `created_at`, `updated_at`

### Bảng `products` (Sản phẩm truyện chính)
Bổ sung các trường đặc thù cho sách truyện.
- `id` (INT, PK)
- `category_id` (INT, FK -> categories) - Thể loại chính
- `author_id` (INT, FK -> authors, Nullable)
- `publisher_id` (INT, FK -> publishers, Nullable)
- `series_id` (INT, FK -> book_series, Nullable)
- `name` (VARCHAR 255), `slug` (VARCHAR 255, Unique)
- `translator` (VARCHAR 255)
- `isbn` (VARCHAR 30, Unique)
- `book_format` (ENUM: 'PAPERBACK', 'HARDCOVER', 'BOXSET', 'EBOOK')
- `language` (VARCHAR 50, Default 'vi')
- `page_count` (INT)
- `publication_date` (DATE)
- `volume_number` (INT) - Ký hiệu tập truyện
- `age_rating` (ENUM: 'ALL', '13+', '16+', '18+')
- `weight_gram` (INT)
- `dimensions` (VARCHAR 100)
- `description` (LONGTEXT)
- `original_price` (DECIMAL 12,2, Nullable) - Gia goc truoc khi giam.
- `discount_percent` (DECIMAL 5,2, Default 0) - Phan tram giam gia admin nhap, hop le 0-95.
- `price` (DECIMAL 12,2) - Gia ban thuc te sau khi backend tu tinh tu `original_price` va `discount_percent`.
- `discount_price` (DECIMAL 12,2, Nullable) - Truong tuong thich response cu, bang `price` khi co giam gia.
- `stock_quantity` (INT)
- `sku` (VARCHAR 50, Unique)
- `status` (ENUM: 'ACTIVE', 'DRAFT', 'OUT_OF_STOCK')
- `sold_count`, `view_count`, `average_rating`, `review_count`
- `external_rating`, `external_rating_count`, `external_rating_source` - Diem tham khao tu nguon ngoai nhu MyAnimeList; UI tach biet voi rating review noi bo.
- `meta_title`, `meta_description`
- `created_at`, `updated_at`

### Bảng `product_categories` (Nhiều Thể loại phụ)
- `product_id`, `category_id` (PK)

### Bảng `product_variants` (Phiên bản đặc biệt, boxset)
- `id`, `product_id`, `variant_name`, `sku` (Unique), `price`, `discount_price`, `stock_quantity`, `format` (ENUM: STANDARD, SPECIAL_EDITION, LIMITED, BOXSET, SIGNED), `attributes` (JSON), `status`, `created_at`, `updated_at`

### Bảng `product_images`
- `id`, `product_id`, `image_url`, `is_primary`, `sort_order`, `alt_text`

### Bảng `product_tags` & `product_tag_map` (Từ khóa SEO)
- Lưu trữ tag tìm kiếm nhanh.

---

## 3. Quản lý Kho Hàng (Inventory)

### Bảng `inventory_transactions`
Ghi log nhập, xuất, điều chỉnh kho chuyên nghiệp.
- `id` (INT, PK)
- `product_id`, `variant_id` (Nullable)
- `type` (ENUM: 'IMPORT', 'EXPORT', 'ORDER', 'RETURN', 'ADJUSTMENT', 'CANCEL_ORDER')
- `quantity`
- `before_quantity`, `after_quantity`
- `note` (TEXT)
- `created_by` (INT, FK -> users)
- `created_at` (TIMESTAMP)

---

## 4. Mua sắm (Cart, Orders, Payments, Shipping, Returns)

### Giỏ hàng & Yêu thích
- **`carts`**: Mở rộng composite key `(user_id, product_id, variant_id)`
- **`wishlists`**: Composite key `(user_id, product_id, variant_id)`

### Bảng `orders`
Lưu snapshot chặt chẽ kèm quản lý dòng tiền chi tiết.
- `id` (INT, PK)
- `user_id` (INT, FK)
- `order_code` (VARCHAR 50, Unique)
- `receiver_name`, `receiver_phone`, `shipping_address_line`, `shipping_ward`, `shipping_district`, `shipping_city` (Snapshot)
- `shipping_address_id` (INT, FK, Nullable)
- `coupon_id` (INT, FK, Nullable)
- `total_amount` (DECIMAL 12,2)
- `subtotal_amount` (DECIMAL 12,2)
- `shipping_fee`, `tax_amount`, `discount_amount`, `final_amount`
- `shipping_method`, `shipping_provider`, `tracking_code`
- `status` (ENUM: 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')
- `payment_status` (ENUM: 'UNPAID', 'PAID', 'REFUNDED')
- `shipped_at`, `delivered_at`, `cancelled_at`, `cancel_reason`, `notes`
- `created_at`, `updated_at`

### Bảng `order_items`
Snapshot các chi tiết phòng trường hợp sản phẩm hoặc giá cả thay đổi về sau.
- `id` (INT, PK)
- `order_id`, `product_id`, `variant_id`
- `product_name`, `product_sku`, `product_image` (Snapshot)
- `price`, `discount_amount`, `final_price`, `quantity`, `subtotal`

### Bảng `order_status_histories`
Theo dõi tiến trình đơn hàng (timeline).
- `id`, `order_id`, `old_status`, `new_status`, `note`, `changed_by`, `created_at`

### Bảng `payments` (Quản lý Giao dịch đa kênh)
- `id`, `order_id`, `payment_method` (ENUM: COD, MOMO, VNPAY, ZALOPAY, BANK_TRANSFER, CREDIT_CARD), `provider_transaction_id`, `amount`, `status` (PENDING, SUCCESS, FAILED, CANCELLED, REFUNDED), `paid_at`, `raw_response` (JSON), `created_at`, `updated_at`

### Bảng `shipping_methods`
Cấu hình đơn vị giao hàng.
- `id`, `name`, `code`, `description`, `base_fee`, `free_shipping_min_amount`, `estimated_days`, `status`, `created_at`, `updated_at`

### Quy trình Mã Giảm Giá (Coupons)
- **`coupons`**: Bổ sung `applies_to` (ALL, CATEGORY, PRODUCT, USER), `user_usage_limit`.
- Bảng phụ: **`coupon_usages`**, **`coupon_products`**, **`coupon_categories`**.

### Xử lý Đổi trả (Returns & Refunds)
- **`return_requests`**: `id`, `order_id`, `user_id`, `reason`, `description`, `status` (PENDING, APPROVED, REJECTED, REFUNDED, COMPLETED), `refund_amount`, `admin_note`
- **`return_items`**: `id`, `return_request_id`, `order_item_id`, `quantity`, `reason`

---

## 5. Tương tác Cộng đồng (Reviews, Feed & Moderation)

### Bảng `reviews` & `review_images`
- `status` (PENDING, APPROVED, REJECTED)
- `admin_reply`, `replied_at`
- Constraint CHECK rating BETWEEN 1 AND 5
- Unique: `(user_id, product_id, order_id)` (chỉ được phép review qua hóa đơn đã đối soát).

### Feed & Nhóm (Cộng đồng)
- **`posts`**: `status` (ACTIVE, HIDDEN, DELETED), `like_count`, `comment_count`.
- **`post_images`**: `id`, `post_id`, `image_url`, `sort_order`
- **`post_comments`**: Thêm tính năng phản hồi lồng nhau (`parent_id`) và kiểm duyệt (`status`).
- **`post_likes`**: `user_id`, `post_id`

### Bảng `reports` (Hệ thống báo cáo xấu)
- `id`, `reporter_id`, `target_type` (POST, COMMENT, REVIEW, USER), `target_id`, `reason`, `description`, `status` (PENDING, RESOLVED, REJECTED), `handled_by`, `handled_at`, `created_at`

---

## 6. Nội dung, Cấu hình & Log (CMS / Platform)

### Bảng `articles` (Blog / Tin tức)
Tăng SEO với các bài review phim/truyện.
- `id`, `author_id`, `title`, `slug`, `summary`, `content`, `thumbnail_url`, `status` (DRAFT, PUBLISHED, ARCHIVED), `view_count`, `meta_title`, `meta_description`, `published_at`, `created_at`, `updated_at`

### Bảng `banners` & `settings`
- **`banners`**: Quản lý quảng cáo, màn hình chính (Sliders).
- **`settings`**: Cấu hình phí ship, điện thoại hỗ trợ kiểu `(key, value)`.

### Bảng `notifications`
Thông báo chuyển trạng thái đơn hàng hoặc nhắc nhở giỏ hàng.
- `id`, `user_id`, `type`, `title`, `message`, `data` (JSON), `read_at`, `created_at`

### Bảng `search_logs`
Phục vụ tính năng gợi ý và đo lường "Trending Keyword": `id`, `user_id`, `keyword`, `result_count`, `ip_address`, `created_at`.

### Bảng `admin_activity_logs` (Audit Log)
Theo dõi các chỉnh sửa từ Backend của nhân sự:
- `id`, `admin_id`, `action`, `target_type`, `target_id`, `old_data` (JSON), `new_data` (JSON), `ip_address`, `user_agent`, `created_at`

---

## 7. Các Chỉ Mục Cải Thiện Hiệu Năng MySQL (Performance Indexes)
Tạo phân mảnh Index cho các cột thường xuyên phải query:
- `products`: `slug`, `status`, `price`, `series_id`, `author_id`, `publisher_id`.
- `orders`: `user_id`, `status`, `created_at`, `order_code`.
- `reviews`: `product_id`, `user_id`.
- `posts`: `user_id`, `created_at`.
- `notifications`: `(user_id, read_at)`.
- Index Cập nhật Fulltext trên `products` (`name`, `description`) phục vụ tìm kiếm Full-Text-Search mượt mà hơn.
