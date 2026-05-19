export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export interface ApiMutationResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export type ApiNumber = number | string;

export interface Product {
  id: number;
  category_id: number | null;
  author_id?: number | null;
  publisher_id?: number | null;
  series_id?: number | null;
  name: string;
  slug?: string;
  isbn?: string | null;
  sku?: string | null;
  book_format?: string | null;
  original_price?: ApiNumber | null;
  discount_percent?: ApiNumber | null;
  price: ApiNumber;
  discount_price?: ApiNumber | null;
  discount_amount?: ApiNumber | null;
  has_discount?: boolean | 0 | 1 | null;
  shipping_fee?: ApiNumber | null;
  shipping_discount_percent?: ApiNumber | null;
  shipping_final_fee?: ApiNumber | null;
  stock_quantity: number;
  status?: string;
  image?: string | null;
  image_url?: string | null;
  description?: string | null;
  volume_number?: number | null;
  author?: string | null;
  author_name?: string | null;
  publisher_name?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  series_name?: string | null;
  series_slug?: string | null;
  series_status?: string | null;
  average_rating?: ApiNumber | null;
  review_count?: number | null;
  external_rating?: ApiNumber | null;
  external_rating_count?: number | null;
  external_rating_source?: string | null;
  sold_count?: number | null;
  view_count?: number | null;
  created_at?: string | null;
}

export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Author {
  id: number;
  name: string;
  slug?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  country?: string | null;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface Order {
  id: number;
  user_id?: number;
  order_code?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  customer?: string | null;
  shipping_address_line?: string | null;
  shipping_ward?: string | null;
  shipping_district?: string | null;
  shipping_city?: string | null;
  shipping_method?: string | null;
  notes?: string | null;
  created_at?: string | null;
  date?: string | null;
  subtotal_amount?: ApiNumber | null;
  shipping_fee?: ApiNumber | null;
  final_amount?: ApiNumber | null;
  total_amount?: ApiNumber | null;
  total?: ApiNumber | null;
  status: OrderStatus;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  product_image?: string | null;
  price: ApiNumber;
  quantity: number;
  subtotal: ApiNumber;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  status: string;
  role: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface CartItem extends Product {
  cart_item_id: number;
  quantity: number;
}

export interface WishlistItem extends Product {
  wishlist_item_id: number;
  added_at?: string | null;
}

export interface Address {
  id: number;
  user_id: number;
  receiver_name: string | null;
  receiver_phone: string | null;
  address_line: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  address_type: string | null;
  is_default: 0 | 1 | boolean;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  content: string;
  status: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number | null;
  username: string;
  avatar_url: string | null;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
}
