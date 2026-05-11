export const mockData = {
  users: [
    {
      id: 1,
      username: "kaitotanaka",
      email: "kaito@example.com",
      full_name: "Kaito Tanaka",
      phone: "+819012345678",
      avatar_url: "https://i.pravatar.cc/150?u=kaito",
      status: "ACTIVE",
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 2,
      username: "ayasato",
      email: "aya@example.com",
      full_name: "Aya Sato",
      phone: "+819087654321",
      avatar_url: "https://i.pravatar.cc/150?u=aya",
      status: "ACTIVE",
      created_at: "2024-01-02T00:00:00Z"
    }
  ],
  user_addresses: [
    {
      id: 1,
      user_id: 1,
      receiver_name: "Kaito Tanaka",
      receiver_phone: "+819012345678",
      address_line: "123 Shibuya St",
      ward: "Shibuya",
      district: "Shibuya-ku",
      city: "Tokyo",
      country: "Japan",
      postal_code: "150-0002",
      address_type: "HOME",
      is_default: true,
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-05T00:00:00Z"
    }
  ],
  password_reset_tokens: [],
  user_sessions: [],
  roles: [
    { id: 1, name: "Admin", slug: "admin" },
    { id: 2, name: "Customer", slug: "customer" }
  ],
  authors: [
    { id: 1, name: "Gege Akutami", slug: "gege-akutami", country: "Japan", bio: "Creator of Jujutsu Kaisen." },
    { id: 2, name: "Tatsuki Fujimoto", slug: "tatsuki-fujimoto", country: "Japan", bio: "Creator of Chainsaw Man and Fire Punch." },
    { id: 3, name: "Koyoharu Gotouge", slug: "koyoharu-gotouge", country: "Japan", bio: "Creator of Demon Slayer." },
    { id: 4, name: "Eiichiro Oda", slug: "eiichiro-oda", country: "Japan", bio: "Creator of One Piece." }
  ],
  publishers: [
    { id: 1, name: "Shueisha", slug: "shueisha", description: "One of Japan's largest publishers.", website: "https://www.shueisha.co.jp/" },
    { id: 2, name: "Viz Media", slug: "viz-media", description: "American manga publisher.", website: "https://www.viz.com/" }
  ],
  book_series: [
    { id: 1, name: "Jujutsu Kaisen", slug: "jujutsu-kaisen", status: "ONGOING", total_volumes: 25 },
    { id: 2, name: "Chainsaw Man", slug: "chainsaw-man", status: "ONGOING", total_volumes: 15 },
    { id: 3, name: "Demon Slayer", slug: "demon-slayer", status: "COMPLETED", total_volumes: 23 },
    { id: 4, name: "One Piece", slug: "one-piece", status: "ONGOING", total_volumes: 108 }
  ],
  categories: [
    { id: 1, parent_id: null, name: "Shounen", slug: "shounen", status: "ACTIVE" },
    { id: 2, parent_id: null, name: "Seinen", slug: "seinen", status: "ACTIVE" },
    { id: 3, parent_id: 1, name: "Action", slug: "action", status: "ACTIVE" },
    { id: 4, parent_id: 1, name: "Adventure", slug: "adventure", status: "ACTIVE" },
    { id: 5, parent_id: 2, name: "Dark Fantasy", slug: "dark-fantasy", status: "ACTIVE" }
  ],
  products: [
    {
      id: 1,
      category_id: 1,
      author_id: 1,
      publisher_id: 1,
      series_id: 1,
      name: "Chú Thuật Hồi Chiến - Phần 2",
      slug: "chu-thuat-hoi-chien-phan-2",
      isbn: "978-4-08-881516-9",
      book_format: "PAPERBACK",
      price: 11.99,
      discount_price: 9.99,
      stock_quantity: 45,
      status: "ACTIVE",
      image: "https://animehay.mx/wp-content/uploads/2025/10/chu-thuat-hoi-chien-phan-2-anime-vietsub.jpg",
      description: "Yuji Itadori is a boy with tremendous physical strength...",
      volume_number: 2,
      created_at: "2024-05-01T00:00:00Z"
    },
    {
      id: 2,
      category_id: 2,
      author_id: 2,
      publisher_id: 1,
      series_id: 2,
      name: "Chainsaw Man",
      slug: "chainsaw-man",
      isbn: "978-4-08-881780-4",
      book_format: "PAPERBACK",
      price: 11.99,
      discount_price: null,
      stock_quantity: 120,
      status: "ACTIVE",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIsY99S8M66PxFGA2qyleaL_Kuq8Gkl0hPag&s",
      description: "Denji's a poor young man who'll do anything for money...",
      volume_number: 1,
      created_at: "2024-05-02T00:00:00Z"
    },
    {
      id: 3,
      category_id: 1,
      author_id: 3,
      publisher_id: 2,
      series_id: 3,
      name: "Demon Slayer Box Set",
      slug: "demon-slayer-box-set",
      isbn: "978-1-9747-2595-3",
      book_format: "BOXSET",
      price: 150.00,
      discount_price: 135.00,
      stock_quantity: 10,
      status: "ACTIVE",
      image: "https://animehay.mx/wp-content/uploads/2025/10/chu-thuat-hoi-chien-phan-2-anime-vietsub.jpg",
      description: "Tanjiro sets out on the path of the Demon Slayer to save his sister...",
      volume_number: null,
      created_at: "2024-05-03T00:00:00Z"
    },
    {
      id: 4,
      category_id: 2,
      author_id: 2,
      publisher_id: 2,
      series_id: 2,
      name: "Chainsaw Man, Vol. 1",
      slug: "chainsaw-man-vol-1",
      isbn: "978-1-9747-0993-9",
      book_format: "PAPERBACK",
      price: 11.99,
      discount_price: 8.99,
      stock_quantity: 50,
      status: "ACTIVE",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIsY99S8M66PxFGA2qyleaL_Kuq8Gkl0hPag&s",
      description: "Broke and in debt, Denji...",
      volume_number: 1,
      created_at: "2024-05-04T00:00:00Z"
    }
  ],
  product_categories: [
    { product_id: 1, category_id: 1 },
    { product_id: 1, category_id: 3 }
  ],
  product_variants: [],
  product_images: [],
  inventory_transactions: [
    {
      id: 1,
      product_id: 1,
      variant_id: null,
      type: "IMPORT",
      quantity: 50,
      before_quantity: 0,
      after_quantity: 50,
      note: "Initial stock",
      created_by: 1,
      created_at: "2024-04-01T00:00:00Z"
    }
  ],
  carts: [
    { user_id: 1, product_id: 2, variant_id: null, quantity: 1 }
  ],
  wishlists: [
    { user_id: 1, product_id: 1, variant_id: null }
  ],
  orders: [
    {
      id: 10234,
      user_id: 1,
      order_code: "10234",
      receiver_name: "Kaito Tanaka",
      shipping_address_line: "123 Shibuya St",
      shipping_city: "Tokyo",
      total_amount: 125.90,
      status: "PENDING",
      payment_status: "UNPAID",
      created_at: "2024-05-15T12:00:00Z",
      items: [
        { id: 1, order_id: 10234, product_id: 3, quantity: 1, price: 125.90, product_name: "Demon Slayer Box Set" }
      ]
    },
    {
      id: 10233,
      user_id: 2,
      order_code: "10233",
      receiver_name: "Aya Sato",
      shipping_address_line: "456 Shinjuku St",
      shipping_city: "Tokyo",
      total_amount: 45.50,
      status: "SHIPPED",
      payment_status: "PAID",
      created_at: "2024-05-14T15:30:00Z",
      items: [
        { id: 2, order_id: 10233, product_id: 1, quantity: 2, price: 11.99, product_name: "Chú Thuật Hồi Chiến - Phần 2" },
        { id: 3, order_id: 10233, product_id: 2, quantity: 2, price: 10.76, product_name: "Chainsaw Man" }
      ]
    },
    {
      id: 10222,
      user_id: 3,
      order_code: "10222",
      receiver_name: "Ren Nakamura",
      shipping_address_line: "Akihabara",
      shipping_city: "Tokyo",
      total_amount: 89.50,
      status: "SHIPPED",
      payment_status: "PAID",
      created_at: "2024-05-14T10:00:00Z",
      items: []
    },
    {
      id: 10231,
      user_id: 4,
      order_code: "10231",
      receiver_name: "Emi Suzuki",
      shipping_address_line: "Osaka",
      shipping_city: "Osaka",
      total_amount: 60.25,
      status: "COMPLETED",
      payment_status: "PAID",
      created_at: "2024-05-13T10:00:00Z",
      items: []
    },
    {
      id: 10232,
      user_id: 4,
      order_code: "10232",
      receiver_name: "Emi Suzuki",
      shipping_address_line: "Osaka",
      shipping_city: "Osaka",
      total_amount: 60.25,
      status: "COMPLETED",
      payment_status: "PAID",
      created_at: "2024-05-13T11:00:00Z",
      items: []
    },
    {
      id: 10221,
      user_id: 4,
      order_code: "10221",
      receiver_name: "Emi Suzuki",
      shipping_address_line: "Osaka",
      shipping_city: "Osaka",
      total_amount: 89.50,
      status: "COMPLETED",
      payment_status: "PAID",
      created_at: "2024-05-13T12:00:00Z",
      items: []
    },
    {
      id: 10235,
      user_id: 4,
      order_code: "10235",
      receiver_name: "Emi Suzuki",
      shipping_address_line: "Osaka",
      shipping_city: "Osaka",
      total_amount: 60.25,
      status: "CANCELLED",
      payment_status: "UNPAID",
      created_at: "2024-05-13T14:00:00Z",
      items: []
    }
  ],
  order_items: [
    { id: 1, order_id: 10234, product_id: 3, product_name: "Demon Slayer Box Set", price: 125.90, quantity: 1, subtotal: 125.90 },
    { id: 2, order_id: 10233, product_id: 1, product_name: "Chú Thuật Hồi Chiến - Phần 2", price: 11.99, quantity: 2, subtotal: 23.98 },
    { id: 3, order_id: 10233, product_id: 2, product_name: "Chainsaw Man", price: 10.76, quantity: 2, subtotal: 21.52 }
  ],
  order_status_histories: [
    { id: 1, order_id: 10233, old_status: "PENDING", new_status: "PROCESSING", created_at: "2024-05-14T16:00:00Z" },
    { id: 2, order_id: 10233, old_status: "PROCESSING", new_status: "SHIPPED", created_at: "2024-05-15T09:00:00Z" }
  ],
  payments: [
    { id: 1, order_id: 10233, payment_method: "CREDIT_CARD", amount: 45.50, status: "SUCCESS", paid_at: "2024-05-14T15:35:00Z" }
  ],
  shipping_methods: [
    { id: 1, name: "Standard Shipping", code: "STD", base_fee: 5.00, estimated_days: "3-5" },
    { id: 2, name: "Express Shipping", code: "EXP", base_fee: 15.00, estimated_days: "1-2" }
  ],
  coupons: [
    { id: 1, code: "WELCOME10", discount_amount: 10.00, applies_to: "ALL", user_usage_limit: 1 }
  ],
  reviews: [
    { id: 1, user_id: 1, product_id: 1, order_id: 10233, rating: 5, comment: "Amazing quality!", status: "APPROVED", created_at: "2024-05-16T10:00:00Z" }
  ],
  posts: [
    { id: 1, user_id: 1, content: "Just got my new manga haul!", status: "ACTIVE", like_count: 5, comment_count: 1 }
  ],
  post_comments: [
    { id: 1, post_id: 1, user_id: 2, content: "Looks great! What did you get?", status: "ACTIVE" }
  ],
  articles: [
    { id: 1, title: "Top 10 Manga to read this Spring", slug: "top-10-manga-spring-2024", summary: "A quick look at the best new releases.", status: "PUBLISHED", view_count: 150 }
  ],
  banners: [
    { id: 1, image_url: "https://images.unsplash.com/photo-1614595225026-6b2ad60e86b0?q=80&w=1471&auto=format&fit=crop", link: "/shop", sort_order: 1 }
  ],
  notifications: [
    { id: 1, user_id: 2, type: "ORDER_UPDATE", title: "Order Shipped", message: "Your order #10233 has been shipped.", read_at: null, created_at: "2024-05-15T09:05:00Z" }
  ]
};
