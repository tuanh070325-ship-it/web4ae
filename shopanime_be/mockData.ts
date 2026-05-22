const demoPasswordHash = 'base64:c2NyeXB0OmIyNTk2MWVhMDNhZDZkMmRlNzU1ZjQ4ZmM0ZmMxNTgzOjk2YTA0ZTEzMDRlNzRjYWIyZDJlZGU2YTIxNDEwYjMwMzM5ZDA4ZmNjZGExOTExM2IxODM5ZWI3MzI0NGNkYzhkOTJhYTdhMmFhNWU4ODBhZmFlZTU3OTY0YWMwZDdmYjA2MGU3ZDAxMzM2ODJkZTA5MGNhZGRlMDA4YmJmYjQ3';

const dateFromDay = (day: number) => `2024-05-${String(day).padStart(2, '0')}T00:00:00Z`;
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const firstNames = [
  'Kaito', 'Aya', 'Ren', 'Emi', 'Haruto', 'Yui', 'Sora', 'Mina', 'Daiki', 'Hana',
  'Riku', 'Mei', 'Takumi', 'Nana', 'Itsuki', 'Aoi', 'Shin', 'Rina', 'Kenji', 'Yuna',
  'Toma', 'Saki', 'Naoki', 'Mika', 'Hiro', 'Noa', 'Akira', 'Kanna', 'Rei', 'Mio',
];

const lastNames = [
  'Tanaka', 'Sato', 'Nakamura', 'Suzuki', 'Watanabe', 'Ito', 'Yamamoto', 'Kobayashi', 'Kato', 'Yoshida',
  'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Saito', 'Mori',
  'Abe', 'Ikeda', 'Hashimoto', 'Ishikawa', 'Ogawa', 'Fujita', 'Goto', 'Okada', 'Hasegawa', 'Murakami',
];

const cities = [
  { city: 'Tokyo', ward: 'Shibuya', district: 'Shibuya-ku', postal: '150-0002' },
  { city: 'Tokyo', ward: 'Shinjuku', district: 'Shinjuku-ku', postal: '160-0022' },
  { city: 'Osaka', ward: 'Namba', district: 'Chuo-ku', postal: '542-0076' },
  { city: 'Kyoto', ward: 'Gion', district: 'Higashiyama-ku', postal: '605-0074' },
  { city: 'Yokohama', ward: 'Minato Mirai', district: 'Nishi-ku', postal: '220-0012' },
  { city: 'Nagoya', ward: 'Sakae', district: 'Naka-ku', postal: '460-0008' },
];

const users = Array.from({ length: 60 }, (_, index) => {
  const id = index + 1;
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const fullName = `${firstName} ${lastName}`;
  const status = id % 23 === 0 ? 'LOCKED' : id % 11 === 0 ? 'INACTIVE' : 'ACTIVE';
  const role = id === 1 || id === 12 ? 'ADMIN' : 'CUSTOMER';
  const username = id === 1 ? 'kaitotanaka' : `${firstName}${lastName}${id}`.toLowerCase();
  const email = id === 1 ? 'kaito@example.com' : `${username}@example.com`;

  return {
    id,
    username,
    email,
    password_hash: demoPasswordHash,
    full_name: fullName,
    phone: `+8190${String(10000000 + id * 7919).slice(0, 8)}`,
    avatar_url: `https://i.pravatar.cc/150?u=akibacore-${id}`,
    status,
    role,
    created_at: `2024-01-${String(((id - 1) % 28) + 1).padStart(2, '0')}T00:00:00Z`,
  };
});

const user_addresses = users.map((user, index) => {
  const location = cities[index % cities.length];
  return {
    id: user.id,
    user_id: user.id,
    receiver_name: user.full_name,
    receiver_phone: user.phone,
    address_line: `${100 + user.id} ${location.ward} Street`,
    ward: location.ward,
    district: location.district,
    city: location.city,
    country: 'Japan',
    postal_code: location.postal,
    address_type: index % 5 === 0 ? 'OFFICE' : 'HOME',
    is_default: true,
    created_at: `2024-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    updated_at: `2024-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00Z`,
  };
});

const authors = [
  { id: 1, name: 'Gege Akutami', slug: 'gege-akutami', country: 'Japan', bio: 'Creator of Jujutsu Kaisen.' },
  { id: 2, name: 'Tatsuki Fujimoto', slug: 'tatsuki-fujimoto', country: 'Japan', bio: 'Creator of Chainsaw Man and Fire Punch.' },
  { id: 3, name: 'Koyoharu Gotouge', slug: 'koyoharu-gotouge', country: 'Japan', bio: 'Creator of Demon Slayer.' },
  { id: 4, name: 'Eiichiro Oda', slug: 'eiichiro-oda', country: 'Japan', bio: 'Creator of One Piece.' },
  { id: 5, name: 'Hajime Isayama', slug: 'hajime-isayama', country: 'Japan', bio: 'Creator of Attack on Titan.' },
  { id: 6, name: 'Naoko Takeuchi', slug: 'naoko-takeuchi', country: 'Japan', bio: 'Creator of Sailor Moon.' },
  { id: 7, name: 'CLAMP', slug: 'clamp', country: 'Japan', bio: 'Manga artist group known for fantasy and romance works.' },
  { id: 8, name: 'Inio Asano', slug: 'inio-asano', country: 'Japan', bio: 'Known for emotional slice-of-life manga.' },
  { id: 9, name: 'Junji Ito', slug: 'junji-ito', country: 'Japan', bio: 'Horror manga author.' },
  { id: 10, name: 'Yusuke Murata', slug: 'yusuke-murata', country: 'Japan', bio: 'Illustrator known for dynamic action art.' },
  { id: 11, name: 'Aka Akasaka', slug: 'aka-akasaka', country: 'Japan', bio: 'Creator of sharp romantic comedy manga.' },
  { id: 12, name: 'AkibaCore Studio', slug: 'akibacore-studio', country: 'Japan', bio: 'Original AkibaCore editorial studio.' },
];

const publishers = [
  { id: 1, name: 'Shueisha', slug: 'shueisha', description: "One of Japan's largest manga publishers.", website: 'https://www.shueisha.co.jp/' },
  { id: 2, name: 'Viz Media', slug: 'viz-media', description: 'English manga publisher and distributor.', website: 'https://www.viz.com/' },
  { id: 3, name: 'Kodansha', slug: 'kodansha', description: 'Major Japanese publishing house.', website: 'https://www.kodansha.co.jp/' },
  { id: 4, name: 'Square Enix Manga', slug: 'square-enix-manga', description: 'Publisher of fantasy and game-inspired manga.', website: 'https://magazine.jp.square-enix.com/' },
];

const book_series = [
  { id: 1, name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', status: 'ONGOING', total_volumes: 25 },
  { id: 2, name: 'Chainsaw Man', slug: 'chainsaw-man', status: 'ONGOING', total_volumes: 16 },
  { id: 3, name: 'Demon Slayer', slug: 'demon-slayer', status: 'COMPLETED', total_volumes: 23 },
  { id: 4, name: 'One Piece', slug: 'one-piece', status: 'ONGOING', total_volumes: 108 },
  { id: 5, name: 'Attack on Titan', slug: 'attack-on-titan', status: 'COMPLETED', total_volumes: 34 },
  { id: 6, name: 'Sailor Moon', slug: 'sailor-moon', status: 'COMPLETED', total_volumes: 12 },
  { id: 7, name: 'Cardcaptor Sakura', slug: 'cardcaptor-sakura', status: 'COMPLETED', total_volumes: 12 },
  { id: 8, name: 'Goodnight Punpun', slug: 'goodnight-punpun', status: 'COMPLETED', total_volumes: 13 },
  { id: 9, name: 'Uzumaki', slug: 'uzumaki', status: 'COMPLETED', total_volumes: 3 },
  { id: 10, name: 'One Punch Man', slug: 'one-punch-man', status: 'ONGOING', total_volumes: 30 },
  { id: 11, name: 'Kaguya-sama', slug: 'kaguya-sama', status: 'COMPLETED', total_volumes: 28 },
  { id: 12, name: 'AkibaCore Originals', slug: 'akibacore-originals', status: 'ONGOING', total_volumes: 8 },
];

const categories = [
  { id: 1, parent_id: null, name: 'Shounen', slug: 'shounen', status: 'ACTIVE' },
  { id: 2, parent_id: null, name: 'Seinen', slug: 'seinen', status: 'ACTIVE' },
  { id: 3, parent_id: 1, name: 'Action', slug: 'action', status: 'ACTIVE' },
  { id: 4, parent_id: 1, name: 'Adventure', slug: 'adventure', status: 'ACTIVE' },
  { id: 5, parent_id: 2, name: 'Dark Fantasy', slug: 'dark-fantasy', status: 'ACTIVE' },
  { id: 6, parent_id: null, name: 'Figures', slug: 'figures', status: 'ACTIVE' },
  { id: 7, parent_id: null, name: 'Romance', slug: 'romance', status: 'ACTIVE' },
  { id: 8, parent_id: null, name: 'Horror', slug: 'horror', status: 'ACTIVE' },
  { id: 9, parent_id: null, name: 'Slice of Life', slug: 'slice-of-life', status: 'ACTIVE' },
  { id: 10, parent_id: null, name: 'Light Novel', slug: 'light-novel', status: 'ACTIVE' },
  { id: 11, parent_id: 6, name: 'Collectibles', slug: 'collectibles', status: 'ACTIVE' },
  { id: 12, parent_id: null, name: 'Limited Edition', slug: 'limited-edition', status: 'ACTIVE' },
];

const imageUrls = [
  'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop',
];

const productNames = [
  'Jujutsu Kaisen Vol. 2', 'Chainsaw Man Vol. 1', 'Demon Slayer Box Set', 'One Piece Vol. 100',
  'Attack on Titan Final Volume', 'Sailor Moon Eternal Edition', 'Cardcaptor Sakura Collector Book',
  'Goodnight Punpun Vol. 1', 'Uzumaki Deluxe Edition', 'One Punch Man Vol. 12', 'Kaguya-sama Vol. 5',
  'AkibaCore Original: Red Shrine', 'Tokyo Curse Archive', 'Moonlight Hero Figure', 'Shibuya Battle Artbook',
  'Samurai Dawn Light Novel', 'Crimson Academy Vol. 1', 'Neon Ronin Figure', 'Spirit Garden Vol. 3',
  'Black Lotus Manga Set', 'Mecha Dreams Vol. 7', 'Kyoto Mystery Casebook', 'Star Idol Romance Vol. 2',
  'Dragon Harbor Adventure', 'Akiba Shelf Starter Pack', 'Horror Alley Anthology', 'Cherry Blossom Letters',
  'Cyber Ninja Limited Figure', 'Midnight Ramen Stories', 'Sky Pirates Manga Vol. 4', 'Witch Contract Vol. 1',
  'Hero Training Manual', 'Ocean Kingdom Box Set', 'Shadow Detective Vol. 6', 'Dream Library Novel',
  'Festival Hearts Vol. 8', 'Red Comet Figure', 'Cursed Classroom Vol. 2', 'Silver Fox Adventure',
  'AkibaCore Manga Tote Bundle', 'Battle Chef Shounen Vol. 1', 'Lost Princess Chronicle', 'Robot Cat Memoirs',
  'Vampire Station Deluxe', 'Forest Guardian Vol. 9', 'Galaxy Courier Light Novel', 'Puzzle Mansion Manga',
  'Collector Acrylic Stand Set',
];

const products = productNames.map((name, index) => {
  const id = index + 1;
  const isFigure = name.includes('Figure') || name.includes('Acrylic') || name.includes('Tote');
  const isBoxSet = name.includes('Box Set') || name.includes('Set');
  const series = book_series[index % book_series.length];
  const categoryId = isFigure ? 6 : categories[(index % 10) + 1].id;
  const originalPrice = isFigure ? 32 + (index % 9) * 4 : isBoxSet ? 88 + (index % 7) * 12 : 9.8 + (index % 12) * 1.35;
  const discountPrice = index % 4 === 0 ? roundMoney(originalPrice * 0.85) : index % 7 === 0 ? roundMoney(originalPrice * 0.75) : null;

  return {
    id,
    category_id: categoryId,
    author_id: isFigure ? null : authors[index % authors.length].id,
    publisher_id: isFigure ? null : publishers[index % publishers.length].id,
    series_id: isFigure ? null : series.id,
    name,
    slug: slugify(name),
    isbn: isFigure ? null : `978-4-08-${String(880000 + id).padStart(6, '0')}-${id % 10}`,
    book_format: isFigure ? 'FIGURE' : isBoxSet ? 'BOXSET' : name.includes('Novel') ? 'LIGHT_NOVEL' : 'PAPERBACK',
    price: roundMoney(originalPrice),
    discount_price: discountPrice,
    shipping_fee: isBoxSet ? 12.99 : isFigure ? 8.5 : 4.99 + (index % 3),
    shipping_discount_percent: index % 5 === 0 ? 100 : index % 3 === 0 ? 50 : 0,
    stock_quantity: index % 13 === 0 ? 0 : 12 + ((index * 11) % 96),
    status: index % 13 === 0 ? 'OUT_OF_STOCK' : index % 17 === 0 ? 'DRAFT' : index % 19 === 0 ? 'INACTIVE' : 'ACTIVE',
    image: imageUrls[index % imageUrls.length],
    description: `${name} is curated for AkibaCore readers who want memorable art, strong shelf appeal, and a polished manga shopping experience.`,
    volume_number: isFigure || isBoxSet ? null : (index % 20) + 1,
    created_at: dateFromDay((index % 28) + 1),
  };
});

const product_categories = products.flatMap((product, index) => {
  const secondaryCategory = categories[((index + 3) % categories.length)].id;
  const rows = [{ product_id: product.id, category_id: product.category_id }];
  if (secondaryCategory !== product.category_id) {
    rows.push({ product_id: product.id, category_id: secondaryCategory });
  }
  return rows;
});

const inventory_transactions = products.map((product, index) => ({
  id: index + 1,
  product_id: product.id,
  variant_id: null,
  type: 'IMPORT',
  quantity: product.stock_quantity,
  before_quantity: 0,
  after_quantity: product.stock_quantity,
  note: 'Initial mock stock import',
  created_by: 1,
  created_at: `2024-04-${String((index % 28) + 1).padStart(2, '0')}T00:00:00Z`,
}));

const carts = Array.from({ length: 70 }, (_, index) => {
  const userId = (index % users.length) + 1;
  const productId = ((index * 7) % products.length) + 1;
  return {
    id: index + 1,
    user_id: userId,
    product_id: productId,
    quantity: (index % 3) + 1,
    created_at: dateFromDay((index % 28) + 1),
    updated_at: dateFromDay((index % 28) + 1),
  };
}).filter((item, index, source) => source.findIndex((other) => other.user_id === item.user_id && other.product_id === item.product_id) === index);

const wishlists = Array.from({ length: 90 }, (_, index) => {
  const userId = (index % users.length) + 1;
  const productId = ((index * 5 + 3) % products.length) + 1;
  return {
    id: index + 1,
    user_id: userId,
    product_id: productId,
    created_at: dateFromDay((index % 28) + 1),
  };
}).filter((item, index, source) => source.findIndex((other) => other.user_id === item.user_id && other.product_id === item.product_id) === index);

const orders = Array.from({ length: 90 }, (_, index) => {
  const id = 12000 + index + 1;
  const userId = (index % users.length) + 1;
  const user = users[userId - 1];
  const address = user_addresses[userId - 1];
  const statusCycle = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
  const paymentStatus = index % 5 === 0 ? 'UNPAID' : index % 11 === 0 ? 'REFUNDED' : 'PAID';
  const itemOne = products[(index * 3) % products.length];
  const itemTwo = products[(index * 3 + 9) % products.length];
  const quantityOne = (index % 2) + 1;
  const quantityTwo = index % 3 === 0 ? 2 : 1;
  const subtotal = roundMoney(Number(itemOne.discount_price ?? itemOne.price) * quantityOne + Number(itemTwo.discount_price ?? itemTwo.price) * quantityTwo);
  const shippingFee = roundMoney(Number(itemOne.shipping_fee) * (1 - Number(itemOne.shipping_discount_percent) / 100));
  const finalAmount = roundMoney(subtotal + shippingFee);

  return {
    id,
    user_id: userId,
    order_code: `ORD-${id}`,
    receiver_name: user.full_name,
    shipping_address_line: address.address_line,
    shipping_city: address.city,
    shipping_address_id: address.id,
    subtotal_amount: subtotal,
    shipping_fee: shippingFee,
    total_amount: finalAmount,
    final_amount: finalAmount,
    status: statusCycle[index % statusCycle.length],
    payment_status: paymentStatus,
    shipping_method: index % 4 === 0 ? 'EXPRESS' : 'STANDARD',
    created_at: `2024-05-${String((index % 28) + 1).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:00:00Z`,
  };
});

const order_items = orders.flatMap((order, index) => {
  const productOne = products[(index * 3) % products.length];
  const productTwo = products[(index * 3 + 9) % products.length];
  const quantityOne = (index % 2) + 1;
  const quantityTwo = index % 3 === 0 ? 2 : 1;
  const priceOne = Number(productOne.discount_price ?? productOne.price);
  const priceTwo = Number(productTwo.discount_price ?? productTwo.price);
  const firstId = index * 2 + 1;
  return [
    {
      id: firstId,
      order_id: order.id,
      product_id: productOne.id,
      product_name: productOne.name,
      price: priceOne,
      quantity: quantityOne,
      subtotal: roundMoney(priceOne * quantityOne),
    },
    {
      id: firstId + 1,
      order_id: order.id,
      product_id: productTwo.id,
      product_name: productTwo.name,
      price: priceTwo,
      quantity: quantityTwo,
      subtotal: roundMoney(priceTwo * quantityTwo),
    },
  ];
});

const reviews = orders.slice(0, 70).map((order, index) => {
  const item = order_items[index * 2];
  return {
    id: index + 1,
    user_id: order.user_id,
    product_id: item.product_id,
    order_id: order.id,
    rating: (index % 5) + 1,
    comment: [
      'Clean print, fast delivery, and excellent cover quality.',
      'Packaging was solid and the product matched the photos.',
      'Good value for a collector shelf.',
      'Nice story pacing and attractive artwork.',
      'Arrived safely and feels premium in hand.',
    ][index % 5],
    status: index % 9 === 0 ? 'PENDING' : 'APPROVED',
    created_at: `2024-06-${String((index % 28) + 1).padStart(2, '0')}T10:00:00Z`,
  };
});

const posts = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  user_id: (index % users.length) + 1,
  content: [
    'New manga haul arrived at AkibaCore today.',
    'Which volume should I read first this weekend?',
    'The latest figure detail looks better than expected.',
    'My shelf finally has enough space for a new box set.',
    'Looking for a dark fantasy recommendation.',
  ][index % 5],
  status: index % 14 === 0 ? 'HIDDEN' : 'ACTIVE',
  like_count: (index * 7) % 80,
  comment_count: index % 4,
}));

const post_comments = posts.flatMap((post, index) => {
  const firstId = index * 2 + 1;
  return [
    {
      id: firstId,
      post_id: post.id,
      user_id: ((index + 3) % users.length) + 1,
      parent_id: null,
      content: 'That looks great. I added it to my wishlist.',
      status: 'ACTIVE',
      created_at: `2024-06-${String((index % 28) + 1).padStart(2, '0')}T11:00:00Z`,
    },
    {
      id: firstId + 1,
      post_id: post.id,
      user_id: post.user_id,
      parent_id: firstId,
      content: 'Thanks. The stock is limited this week.',
      status: index % 10 === 0 ? 'HIDDEN' : 'ACTIVE',
      created_at: `2024-06-${String((index % 28) + 1).padStart(2, '0')}T11:05:00Z`,
    },
  ];
});

const banners = [
  {
    id: 1,
    image_url: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=1600&auto=format&fit=crop',
    link_url: '/shop',
    title: 'AkibaCore manga shelf starts here',
    sort_order: 1,
    status: 'ACTIVE',
    created_at: '2024-05-01T00:00:00Z',
  },
  {
    id: 2,
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop',
    link_url: '/shop?genres=action',
    title: 'Action volumes and collector picks',
    sort_order: 2,
    status: 'ACTIVE',
    created_at: '2024-05-02T00:00:00Z',
  },
  {
    id: 3,
    image_url: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1600&auto=format&fit=crop',
    link_url: '/shop?category=figures',
    title: 'Figures for premium display shelves',
    sort_order: 3,
    status: 'ACTIVE',
    created_at: '2024-05-03T00:00:00Z',
  },
];

export const mockData = {
  users,
  user_addresses,
  authors,
  publishers,
  book_series,
  categories,
  products,
  product_categories,
  inventory_transactions,
  carts,
  wishlists,
  orders,
  order_items,
  reviews,
  posts,
  post_comments,
  banners,
};
