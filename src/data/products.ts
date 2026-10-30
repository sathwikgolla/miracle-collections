import type { Product, Review } from "@/lib/types";

const reviewer = (name: string, title: string, body?: string, rating = 5): Review => ({
  id: "rev_" + Math.random().toString(36).slice(2, 9),
  author: name,
  rating,
  title,
  body:
    body ||
    "Excellent quality material, perfect drape and timely delivery from Miracle Collections. Truly authentic!",
  date: "1 week ago",
  verified: true,
});

export const products: Product[] = [
  // =========================================================================
  // 1. D. NO. 1584 SERIES (With Matching Blouse Piece)
  // =========================================================================

  // Royal Purple Banarasi Zari Checkered Saree (D.No 1584)
  {
    id: "mc_saree_1584",
    slug: "royal-banarasi-zari-checkered-saree-d-no-1584",
    name: "Royal Banarasi Zari Checkered Saree (D.No 1584) With Blouse Piece",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Authentic Miracle Collections Design No. 1584 (Catalog D.No. 7745). An opulent Royal Purple festive drape styled with metallic gold zari micro checks, a traditional woven gold zari floral temple border, and matching unstitched blouse piece. Complete with model wear catalog reference and brand label.",
    price: 1899,
    mrp: 3999,
    costPrice: 950,
    rating: 4.9,
    reviews: 36,
    images: [
      "/images/products/saree-1584-purple-model.jpg",
      "/images/products/saree-1584-purple-checks-1.jpg",
      "/images/products/saree-1584-purple-checks-2.jpg",
    ],
    colors: ["Purple"],
    sizes: ["Free Size"],
    badges: ["Trending", "With Blouse Piece", "Design No. 1584"],
    specifications: [
      { label: "Design Number", value: "D. NO. 1584" },
      { label: "Catalog Reference", value: "D.NO. 7745" },
      { label: "Fabric", value: "Art Silk / Festive Silk Blend" },
      { label: "Pattern", value: "Metallic Gold Micro Checks" },
      { label: "Border", value: "Traditional Woven Gold Zari Floral Border" },
      { label: "Blouse Piece", value: "Included (Unstitched Matching Piece)" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Blouse Length", value: "0.8 Metres" },
      { label: "Occasion", value: "Festivals, Weddings, Ceremonial Wear" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_1584_v1",
        sku: "MC-SAR-1584-PUR-FS",
        size: "Free Size",
        color: "Purple",
        stock: 35,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Kavitha R.", "Stunning saree and exact like model photo", "The saree looks identical to the catalog wear card. The checks and border shine beautifully under lights.", 5),
      reviewer("Deepika S.", "Authentic Miracle Collections quality", "Beautiful checks and elegant gold border. Very soft and comfortable to drape for long hours.", 5),
    ],
    stock: 35,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Emerald Green Banarasi Zari Checkered Saree (D.No 1584)
  {
    id: "mc_saree_1584_green",
    slug: "emerald-green-banarasi-zari-checkered-saree-d-no-1584",
    name: "Emerald Green Banarasi Zari Checkered Saree (D.No 1584) With Blouse Piece",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Authentic Miracle Collections Design No. 1584 in a vibrant Emerald Green shade. Detailed with fine gold metallic checks, an ornate floral gold zari border, and an included matching unstitched blouse piece.",
    price: 1899,
    mrp: 3999,
    costPrice: 950,
    rating: 4.8,
    reviews: 28,
    images: ["/images/products/saree-1584-green.jpg"],
    colors: ["Emerald Green"],
    sizes: ["Free Size"],
    badges: ["New Colorway", "With Blouse Piece", "Design No. 1584"],
    specifications: [
      { label: "Design Number", value: "D. NO. 1584" },
      { label: "Fabric", value: "Art Silk / Festive Silk Blend" },
      { label: "Pattern", value: "Metallic Gold Micro Checks" },
      { label: "Border", value: "Woven Traditional Gold Zari Border" },
      { label: "Blouse Piece", value: "Included (Unstitched Matching Piece)" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Festivals, Weddings, Traditional Events" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_1584_grn_v1",
        sku: "MC-SAR-1584-GRN-FS",
        size: "Free Size",
        color: "Emerald Green",
        stock: 30,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Shwetha M.", "Vibrant festive green", "The green shade with golden grid checks is stunning for pooja rituals.", 5),
    ],
    stock: 30,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // =========================================================================
  // 2. MYSORE BUTTA CHIT PALLU SERIES
  // =========================================================================

  // Mysore Butta Chit Pallu - Purple & Forest Green
  {
    id: "mc_saree_mysore_purple_green",
    slug: "mysore-butta-chit-pallu-purple-green-saree",
    name: "Mysore Butta Chit Pallu Silk Saree (Purple & Forest Green)",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Original Miracle Collections tagged 'Mysore Butta Chit Pallu' silk saree. Features an exquisite royal purple body sprinkled with embossed gold zari circular buttas, paired with a rich forest green contrast border depicting traditional peacock and elephant motifs.",
    price: 2199,
    mrp: 4999,
    costPrice: 1100,
    rating: 5.0,
    reviews: 42,
    images: ["/images/products/saree-mysore-purple-green.jpg"],
    colors: ["Purple", "Forest Green"],
    sizes: ["Free Size"],
    badges: ["Mysore Butta", "Chit Pallu", "Top Pick"],
    specifications: [
      { label: "Weave Type", value: "Mysore Butta Chit Pallu" },
      { label: "Fabric", value: "Mysore Silk Blend" },
      { label: "Body Pattern", value: "Embossed Gold Zari Circular Buttas" },
      { label: "Border", value: "Contrast Forest Green Border with Peacocks & Elephants" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Weddings, Temple Visits, Festivals" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_mysore_pg_v1",
        sku: "MC-SAR-MYS-PUR-GRN-FS",
        size: "Free Size",
        color: "Purple & Forest Green",
        stock: 30,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Lakshmi V.", "Authentic Mysore Butta look", "The Chit Pallu design and peacock border are grand! Loved the purple and green contrast.", 5),
    ],
    stock: 30,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Mysore Butta Chit Pallu - Rani Pink & Navy Blue
  {
    id: "mc_saree_mysore_pink_navy",
    slug: "mysore-butta-chit-pallu-pink-navy-saree",
    name: "Mysore Butta Chit Pallu Silk Saree (Rani Pink & Navy Blue)",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Original Miracle Collections tagged 'Mysore Butta Chit Pallu' silk drape in a captivating Rani Magenta Pink body adorned with gleaming gold buttas, bordered by a regal navy blue contrast border carrying intricate ornate zari temple art.",
    price: 2199,
    mrp: 4999,
    costPrice: 1100,
    rating: 4.9,
    reviews: 38,
    images: ["/images/products/saree-mysore-pink-navy.jpg"],
    colors: ["Rani Pink", "Navy Blue"],
    sizes: ["Free Size"],
    badges: ["Mysore Butta", "Chit Pallu", "Trending"],
    specifications: [
      { label: "Weave Type", value: "Mysore Butta Chit Pallu" },
      { label: "Fabric", value: "Mysore Silk Blend" },
      { label: "Body Pattern", value: "Embossed Gold Zari Circular Buttas" },
      { label: "Border", value: "Contrast Navy Blue Border with Peacock & Floral Zari" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Weddings, Reception, Festive Celebrations" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_mysore_pn_v1",
        sku: "MC-SAR-MYS-PNK-NVY-FS",
        size: "Free Size",
        color: "Rani Pink & Navy Blue",
        stock: 30,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Padma S.", "Gorgeous color pairing", "Pink and navy blue combination with gold butta is truly striking.", 5),
    ],
    stock: 30,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // =========================================================================
  // 3. GEOMETRIC BUTTA CONTRAST ZARI BORDER SERIES
  // =========================================================================

  // Teal Blue & Mint Green
  {
    id: "mc_saree_contrast_teal_green",
    slug: "teal-blue-traditional-silk-saree-mint-green-border",
    name: "Teal Blue Traditional Silk Saree with Mint Green Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Stunning peacock teal blue silk saree highlighted with subtle geometric silver-gold zari buttas and finished with an elaborate pastel mint green contrast border displaying woven lotus and floral creepers.",
    price: 1999,
    mrp: 4499,
    costPrice: 1000,
    rating: 4.8,
    reviews: 26,
    images: [
      "/images/products/saree-contrast-teal-green.jpg",
      "/images/products/saree-contrast-teal-green-2.jpg",
    ],
    colors: ["Teal Blue", "Mint Green"],
    sizes: ["Free Size"],
    badges: ["Contrast Border", "Zari Butta"],
    specifications: [
      { label: "Fabric", value: "Kanjivaram Silk Blend" },
      { label: "Body Pattern", value: "Geometric Zari Buttas" },
      { label: "Border", value: "Broad Mint Green Floral Zari Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Festive, Family Ceremonies, Puja" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_teal_grn_v1",
        sku: "MC-SAR-CON-TEL-GRN-FS",
        size: "Free Size",
        color: "Teal Blue & Mint Green",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Roopa N.", "Unique color combination", "Mint green border on teal blue body is very modern yet traditional.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Royal Purple & Mint Green
  {
    id: "mc_saree_contrast_purple_green",
    slug: "royal-purple-traditional-silk-saree-mint-green-border",
    name: "Royal Purple Traditional Silk Saree with Mint Green Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Majestic royal purple silk saree styled with highlighted geometric silver-gold zari buttas, framed by an enchanting mint green contrast border richly woven with traditional floral creeper motifs.",
    price: 1999,
    mrp: 4499,
    costPrice: 1000,
    rating: 4.9,
    reviews: 29,
    images: ["/images/products/saree-contrast-purple-mint.jpg"],
    colors: ["Purple", "Mint Green"],
    sizes: ["Free Size"],
    badges: ["Contrast Border", "New Arrival"],
    specifications: [
      { label: "Fabric", value: "Kanjivaram Silk Blend" },
      { label: "Body Pattern", value: "Geometric Zari Buttas" },
      { label: "Border", value: "Broad Mint Green Floral Zari Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Weddings, Receptions, Festivals" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_pur_mint_v1",
        sku: "MC-SAR-CON-PUR-MNT-FS",
        size: "Free Size",
        color: "Purple & Mint Green",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Usha R.", "Elegant contrast", "The purple body with pastel mint border is a showstopper.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Crimson Red & Lavender Purple
  {
    id: "mc_saree_contrast_red_purple",
    slug: "crimson-red-traditional-silk-saree-lavender-purple-border",
    name: "Crimson Red Traditional Silk Saree with Lavender Purple Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Vibrant bridal crimson red silk drape studded with geometric zari motifs across the field, edged with a majestic lavender purple contrast border featuring opulent woven floral zari craftsmanship.",
    price: 1999,
    mrp: 4499,
    costPrice: 1000,
    rating: 4.9,
    reviews: 31,
    images: ["/images/products/saree-contrast-red-purple.jpg"],
    colors: ["Crimson Red", "Lavender Purple"],
    sizes: ["Free Size"],
    badges: ["Bridal Festive", "Contrast Border"],
    specifications: [
      { label: "Fabric", value: "Kanjivaram Silk Blend" },
      { label: "Body Pattern", value: "Geometric Zari Buttas" },
      { label: "Border", value: "Broad Lavender Purple Floral Zari Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Bridal Wear, Festive, Celebrations" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "mc_saree_red_pur_v1",
        sku: "MC-SAR-CON-RED-PUR-FS",
        size: "Free Size",
        color: "Crimson Red & Lavender Purple",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Bhavani T.", "Grand look for puja", "The red and lavender border combination looks very rich and auspicious.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // =========================================================================
  // 4. HIBISCUS FLORAL PRINT WITH WOVEN ZARI BORDER SERIES
  // =========================================================================

  // Mustard Yellow Floral Hibiscus Saree
  {
    id: "mc_saree_floral_yellow",
    slug: "mustard-yellow-floral-hibiscus-zari-saree",
    name: "Mustard Yellow Floral Hibiscus Saree with Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Vibrant mustard yellow festive saree embellished with delicate hibiscus floral artwork and a distinct woven gold zari geometric temple border. Miracle Collections authentic collection, ideal for Haldi, daytime ceremonies and festive pooja rituals.",
    price: 1499,
    mrp: 3299,
    costPrice: 750,
    rating: 4.8,
    reviews: 24,
    images: ["/images/products/saree-floral-yellow.jpg"],
    colors: ["Mustard Yellow"],
    sizes: ["Free Size"],
    badges: ["Trending", "Festive Collection"],
    specifications: [
      { label: "Fabric", value: "Georgette / Chiffon Silk Blend" },
      { label: "Pattern", value: "Floral Hibiscus Digital Print" },
      { label: "Border", value: "Woven Gold Zari Temple Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Haldi, Festive Pooja, Traditional Functions" },
      { label: "Care Instructions", value: "Dry Clean Recommended" },
    ],
    variants: [
      {
        id: "mc_saree_floral_yellow_v1",
        sku: "MC-SAR-FLR-YLW-FS",
        size: "Free Size",
        color: "Mustard Yellow",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Ananya P.", "Bright and cheerful", "The mustard yellow color is vibrant and the hibiscus print looks gorgeous for Haldi functions.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Baby Pink Floral Hibiscus Saree
  {
    id: "mc_saree_floral_pink",
    slug: "baby-pink-floral-hibiscus-zari-saree",
    name: "Baby Pink Floral Hibiscus Saree with Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Graceful pastel baby pink festive saree featuring elegant hibiscus floral botanicals complemented by an intricate woven gold zari border. Soft hand-feel and fluid drape that embodies understated elegance.",
    price: 1499,
    mrp: 3299,
    costPrice: 750,
    rating: 4.9,
    reviews: 29,
    images: ["/images/products/saree-floral-pink.jpg"],
    colors: ["Baby Pink"],
    sizes: ["Free Size"],
    badges: ["Best Seller", "New Arrival"],
    specifications: [
      { label: "Fabric", value: "Georgette / Chiffon Silk Blend" },
      { label: "Pattern", value: "Floral Hibiscus Digital Print" },
      { label: "Border", value: "Woven Gold Zari Temple Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Day Festive, Wedding Receptions, Parties" },
      { label: "Care Instructions", value: "Dry Clean Recommended" },
    ],
    variants: [
      {
        id: "mc_saree_floral_pink_v1",
        sku: "MC-SAR-FLR-PNK-FS",
        size: "Free Size",
        color: "Baby Pink",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Sneha M.", "Subtle and sophisticated", "The pastel pink with gold zari is absolutely mesmerizing. Got so many compliments!", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Royal Violet Floral Hibiscus Saree
  {
    id: "mc_saree_floral_violet",
    slug: "royal-violet-floral-hibiscus-zari-saree",
    name: "Royal Violet Floral Hibiscus Saree with Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Deep royal violet festive drape accentuated with luminous floral hibiscus blossoms and a classic gold zari woven border. The rich jewel-toned contrast creates a majestic presence for evening occasions and celebrations.",
    price: 1499,
    mrp: 3299,
    costPrice: 750,
    rating: 4.8,
    reviews: 21,
    images: ["/images/products/saree-floral-violet.jpg"],
    colors: ["Royal Violet"],
    sizes: ["Free Size"],
    badges: ["Trending", "Exclusive"],
    specifications: [
      { label: "Fabric", value: "Georgette / Chiffon Silk Blend" },
      { label: "Pattern", value: "Floral Hibiscus Digital Print" },
      { label: "Border", value: "Woven Gold Zari Temple Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Evening Functions, Festivals, Parties" },
      { label: "Care Instructions", value: "Dry Clean Recommended" },
    ],
    variants: [
      {
        id: "mc_saree_floral_violet_v1",
        sku: "MC-SAR-FLR-VIO-FS",
        size: "Free Size",
        color: "Royal Violet",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Pooja V.", "Rich royal violet shade", "Color contrast between violet and gold zari is gorgeous. Very happy with this purchase.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // Wine Magenta Floral Hibiscus Saree
  {
    id: "mc_saree_floral_wine",
    slug: "wine-magenta-floral-hibiscus-zari-saree",
    name: "Wine Magenta Floral Hibiscus Saree with Zari Border",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Opulent wine magenta festive saree adorned with glowing hibiscus floral illustrations and an antique woven gold zari border. Flattering rich hue designed for festive gatherings and auspicious functions.",
    price: 1499,
    mrp: 3299,
    costPrice: 750,
    rating: 4.9,
    reviews: 27,
    images: ["/images/products/saree-floral-wine.jpg"],
    colors: ["Wine Magenta"],
    sizes: ["Free Size"],
    badges: ["New Arrival", "Popular Demand"],
    specifications: [
      { label: "Fabric", value: "Georgette / Chiffon Silk Blend" },
      { label: "Pattern", value: "Floral Hibiscus Digital Print" },
      { label: "Border", value: "Woven Gold Zari Temple Border" },
      { label: "Saree Length", value: "5.5 Metres" },
      { label: "Occasion", value: "Festive Poojas, Family Gatherings, Parties" },
      { label: "Care Instructions", value: "Dry Clean Recommended" },
    ],
    variants: [
      {
        id: "mc_saree_floral_wine_v1",
        sku: "MC-SAR-FLR-WIN-FS",
        size: "Free Size",
        color: "Wine Magenta",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Harini R.", "Deep rich color", "The wine shade with the hibiscus print looks very upscale and festive.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
  },

  // =========================================================================
  // 5. PRESERVED ORIGINAL SUPABASE SAREES
  // =========================================================================

  // Banarasi Warm Silk with Silver Zari
  {
    id: "prod_dc6d2308-eb22-4dcb-9cd7-e29aa1d6f57f",
    slug: "banarasi-warm-silk-katan-warm-silk-with-silver-zari",
    name: "Banarasi Warm Silk (Katan Warm Silk) with Silver Zari",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Premium Banarasi Warm Silk saree crafted in traditional Katan warm silk technique. Features ornate silver zari motifs, rich pallu, and an all-over gleaming sheen designed for weddings and cultural ceremonies.",
    price: 1800,
    mrp: 3500,
    costPrice: 900,
    rating: 5.0,
    reviews: 18,
    images: [
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792621086666-18505109.jpg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792621096987-3a89df76.jpg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792621105279-27e8bced.jpg",
    ],
    colors: ["Warm Silk"],
    sizes: ["Free Size"],
    badges: ["Signature", "Silver Zari"],
    specifications: [
      { label: "Fabric", value: "Banarasi Katan Warm Silk" },
      { label: "Weave", value: "Traditional Silver Zari Brocade" },
      { label: "Occasion", value: "Weddings, Receptions, Festive" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "v_warm_silk_fs",
        sku: "MC-SAR-WRM-SLK-FS",
        size: "Free Size",
        color: "Warm Silk",
        stock: 35,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Aarti M.", "Exquisite silver zari craftsmanship", "Pure elegance! The silver zari shine is rich without being loud. Fantastic saree.", 5),
    ],
    stock: 35,
    status: "live",
    createdAt: "2026-10-21T22:23:43.104Z",
    updatedAt: "2026-10-22T12:51:10.160Z",
  },

  // Designer Sarees
  {
    id: "prod_1d5a508a-d663-477a-96b6-2fb2d156ad65",
    slug: "designer-sarees",
    name: "Designer Sarees",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Exclusive Miracle Collections designer saree collection. Beautiful ethnic drape adorned with traditional motifs and graceful borders suited for modern celebration wear.",
    price: 1600,
    mrp: 3200,
    costPrice: 800,
    rating: 4.8,
    reviews: 14,
    images: [
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676566818-b2dcc61b.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676575873-67c4bf45.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676583427-3f34be28.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676591201-cfde5ff7.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676599622-c23779bd.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676608116-d60b47eb.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676618875-09223b7f.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676625899-58ec2e0b.jpeg",
    ],
    colors: ["Multi"],
    sizes: ["Free Size"],
    badges: ["Designer Edit"],
    specifications: [
      { label: "Fabric", value: "Art Silk Blend" },
      { label: "Style", value: "Designer Ethnic Wear" },
      { label: "Care Instructions", value: "Dry Clean Only" },
    ],
    variants: [
      {
        id: "d286b623-7b6e-47f1-91c1-4e529d55b917",
        sku: "DESIGNER-SAREES-FS",
        size: "Free Size",
        color: "Multi",
        stock: 24,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Shalini P.", "Lovely collection", "The designs and color combinations are unique. Very pleased with the quality.", 5),
    ],
    stock: 24,
    status: "live",
    createdAt: "2026-10-22T13:46:26.331Z",
    updatedAt: "2026-10-29T14:27:00.660Z",
  },

  // Pure Silk Designer Saree
  {
    id: "prod_4f457961-eda9-4b45-8473-e27ba9fc5c96",
    slug: "sarees",
    name: "Pure Silk Designer Saree",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Handcrafted pure silk ethnic drape with delicate all-over motifs and an authentic traditional border from Miracle Collections.",
    price: 890,
    mrp: 1790,
    costPrice: 500,
    rating: 4.8,
    reviews: 12,
    images: [
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792676996044-a6550b89.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677004871-42448ea6.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677012012-70d825bc.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677019316-4648f6cf.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677027206-595ebec1.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677034953-0dd14999.jpeg",
    ],
    colors: ["Multi"],
    sizes: ["Free Size"],
    badges: ["Value Deal"],
    specifications: [
      { label: "Fabric", value: "Silk Blend" },
      { label: "Care Instructions", value: "Dry Clean Recommended" },
    ],
    variants: [
      {
        id: "2d8e4204-cd08-4e3f-9be7-fad5c48f7ba7",
        sku: "SAREES-FS",
        size: "Free Size",
        color: "Multi",
        stock: 25,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Bhavana K.", "Great budget saree", "Very nice fabric at an unbelievable price point. Will order again.", 5),
    ],
    stock: 25,
    status: "live",
    createdAt: "2026-10-22T13:50:44.469Z",
    updatedAt: "2026-10-22T13:50:44.469Z",
  },

  // Elegant Printed Floral Saree
  {
    id: "prod_62a30364-6313-4b40-ba62-cf5b7f1bddbd",
    slug: "printed-saree",
    name: "Elegant Printed Floral Saree",
    brand: "Miracle Collections",
    categoryId: "clothing",
    subCategory: "Sarees",
    gender: "women",
    description:
      "Vibrant printed daily and festive wear saree designed with soft breezy texture and lightweight ethnic elegance.",
    price: 680,
    mrp: 1400,
    costPrice: 380,
    rating: 4.7,
    reviews: 10,
    images: [
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677169749-84ab7b75.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677176112-1bbe692b.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677182900-95548870.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677189573-90ee9d8c.jpeg",
      "https://zsfloyprwqofeoapngdk.supabase.co/storage/v1/object/public/product-images/products/1792677195429-005ac68b.jpeg",
    ],
    colors: ["Multi"],
    sizes: ["Free Size"],
    badges: ["Daily Comfort"],
    specifications: [
      { label: "Fabric", value: "Georgette Print" },
      { label: "Care Instructions", value: "Gentle Hand Wash" },
    ],
    variants: [
      {
        id: "dadad8bd-0f7f-4791-8812-097a1e694ee3",
        sku: "PRINTED-SAREE-FS",
        size: "Free Size",
        color: "Multi",
        stock: 22,
        reservedStock: 0,
      },
    ],
    reviewsList: [
      reviewer("Sunita J.", "Soft and easy to maintain", "Pleasant print and lightweight. Perfect for daily wear.", 5),
    ],
    stock: 22,
    status: "live",
    createdAt: "2026-10-22T13:53:21.714Z",
    updatedAt: "2026-10-27T07:50:14.691Z",
  },
];
