# Kichik Onlayn Doʻkon — Noldan Qurish Boʻyicha Toʻliq Yoʻriqnoma

> Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL**
> Savat: **localStorage** | Admin: **JWT (httpOnly cookie)**

---

## 1. Nega aynan shu texnologiyalar?

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Frontend + Backend | Next.js (App Router) | Bitta repozitoriyada ham UI, ham API Route'lar. Kichik doʻkon uchun alohida server shart emas. |
| Til | TypeScript | `price: number` va `stock: number` ni chalkashtirib qoʻyishning oldi olinadi. |
| Stil | Tailwind CSS | Tez yoziladi, oʻlchamlar bir xil (dizayn tizimi), production CSS juda kichik. |
| Maʼlumotlar bazasi | PostgreSQL + Prisma | SQL — pullik hisob-kitoblar uchun ishonchli. Prisma migratsiya va type-safe soʻrovlar beradi. |
| Validatsiya | Zod | Serverga kelgan har bir maʼlumotni tekshiradi (xavfsizlikning 1-qalini). |

> **Variant (eng sodda start):** PostgreSQL oʻrniga `data/products.json` fayl + API Route ichida `fs` bilan oʻqish/yozish. Faqat MVP va oʻrganish uchun. Production'da alboh PostgreSQL.

---

## 2. Arxitektura

```
┌──────────────────────────────────────────────────────────────┐
│  BRAUZER (Client)                                            │
│  ┌────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │ Sahifalar  │  │ CartContext   │  │ localStorage       │   │
│  │ (App Router│◄─┤ (useReducer + │──┤ "cart_v1"          │   │
│  │  page.tsx) │  │  useEffect)   │  │ {items:[...]}      │   │
│  └─────┬──────┘  └───────────────┘  └────────────────────┘   │
└────────┼─────────────────────────────────────────────────────┘
         │ fetch() — Server Components yoki Client Components
┌────────▼─────────────────────────────────────────────────────┐
│  NEXT.JS SERVER                                              │
│  ┌───────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ app/api/*     │──►│ lib/db.ts    │──►│ PostgreSQL     │  │
│  │ (Route Handler│   │ (Prisma)     │   │ (Product,Order,│  │
│  │  + Zod)       │   └──────────────┘   │  Category,User)│  │
│  └───────────────┘                      └────────────────┘  │
│         │                                                     │
│         └──► lib/auth.ts (JWT sign/verify → httpOnly cookie) │
└──────────────────────────────────────────────────────────────┘
```

**Muhim qoida:** Narx (total) **faqat serverda** hisoblanadi. Client faqat `productId + quantity` yuboradi.

---

## 3. Papka va fayllar strukturasi

```
online-store/
├── app/
│   ├── layout.tsx                    # Umumiy layout (Header + Footer + CartProvider)
│   ├── page.tsx                      # Bosh sahifa (hero, tavsiya etilganlar)
│   ├── globals.css
│   │
│   ├── products/
│   │   ├── page.tsx                  # 📌 KATALOG: filtr + qidiruv + kategoriya
│   │   └── [slug]/
│   │       └── page.tsx              # 📌 PRODUCT DETAILS
│   │
│   ├── cart/
│   │   └── page.tsx                  # 📌 SAVATCHA (localStorage'dan)
│   ├── checkout/
│   │   └── page.tsx                  # 📌 BUYURTMA BERISH (forma)
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Admin guard (JWT tekshiruvi)
│   │   ├── page.tsx                  # Dashboard (buyurtmalar soni, daromad)
│   │   └── products/
│   │       ├── page.tsx              # Mahsulotlar jadvali
│   │       ├── new/
│   │       │   └── page.tsx          # 📌 CREATE
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx      # 📌 UPDATE / DELETE
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        # POST → JWT cookie
│       │   └── logout/route.ts       # POST → cookie o'chirish
│       ├── products/
│       │   ├── route.ts              # GET (filtr) | POST (admin)
│       │   └── [id]/route.ts         # GET | PUT | DELETE (admin)
│       ├── orders/
│       │   └── route.ts              # POST (buyurtma yaratish)
│       └── upload/route.ts           # POST (rasm yuklash, admin)
│
├── components/
│   ├── layout/Header.tsx, Footer.tsx, MobileMenu.tsx
│   ├── product/ProductCard.tsx, ProductGrid.tsx, Filters.tsx, SearchBar.tsx, QuantityInput.tsx
│   ├── cart/CartItem.tsx, CartSummary.tsx, EmptyCart.tsx
│   ├── checkout/CheckoutForm.tsx, OrderSuccess.tsx
│   └── ui/Button.tsx, Input.tsx, Select.tsx, Modal.tsx, Spinner.tsx, Toast.tsx
│
├── context/CartContext.tsx           # Savat holati (barcha ilova ishlatadi)
├── hooks/useDebounce.ts, useLocalStorage.ts
├── lib/
│   ├── db.ts                         # Prisma client (singleton)
│   ├── auth.ts                       # signToken / verifyToken / requireAdmin
│   ├── validations.ts                # Zod sxemalari (product, order, login)
│   └── utils.ts                      # formatPrice(), cn(), slugify()
├── types/index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # Namunaviy maʼlumotlar
├── public/uploads/                   # Yuklangan rasmlar
├── middleware.ts                     # /admin/* himoyasi
├── .env.local                        # DATABASE_URL, JWT_SECRET
└── package.json
```

---

## 4. Maʼlumotlar bazasi sxemasi (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique          // "Elektronika"
  slug     String    @unique          // "elektronika"
  image    String?
  products Product[]
}

model Product {
  id          String      @id @default(cuid())
  title       String      @db.VarChar(120)
  slug        String      @unique
  description String      @db.Text
  price       Int                       // tiyda (float EMAS!)
  oldPrice    Int?
  images      String[]                  // ["/uploads/a.jpg", ...]
  stock       Int         @default(0)   // ombordagi soni
  isActive    Boolean     @default(true)
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([categoryId, isActive])
  @@index([title])
}

model User {                            // faqat admin(lar)
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String                    // bcrypt hash
  name         String
  createdAt    DateTime @default(now())
}

model Order {
  id           String      @id @default(cuid())
  customerName String      @db.VarChar(80)
  phone        String      @db.VarChar(20)
  address      String      @db.VarChar(300)
  comment      String?
  total        Int                       // server hisoblagan summa
  status       OrderStatus @default(PENDING)
  items        OrderItem[]
  createdAt    DateTime    @default(now())
}

model OrderItem {                       // narxni "muzlatib" saqlaymiz
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  title     String                       // mahsulot nomi o'zgarsa ham buyurtma o'zgarmaydi
  price     Int                          // sotib olingandagi narx
  quantity  Int
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### Nega narxni `Int` (tiyda) saqlaymiz?
`Float`/`Decimal` — suzuvchi nuqta xatolari: `0.1 + 0.2 = 0.30000000000000004`. Narxni **butun son (tiyda)** saqlash — pullar bilan ishlashning standart yoʻli.

```prisma
price 49_900_00  // 49 900.00 so'm
```

### Namunaviy maʼlumotlar (JSON koʻrinishi)

```json
{
  "categories": [
    { "id": "cat_1", "name": "Elektronika", "slug": "elektronika" },
    { "id": "cat_2", "name": "Kiyimlar", "slug": "kiyimlar" },
    { "id": "cat_3", "name": "Uy-ro'zg'or", "slug": "uy-rozgor" }
  ],
  "products": [
    {
      "id": "prd_1",
      "title": "Simsiz Quloqchin AirSound Pro",
      "slug": "simsiz-quloqchin-airsound-pro",
      "description": "Aktiv shovqin bekor qilish (ANC), 36 soat ishlash vaqti.",
      "price": 12990000,
      "oldPrice": 15990000,
      "images": ["/uploads/airsound-1.jpg", "/uploads/airsound-2.jpg"],
      "stock": 12,
      "isActive": true,
      "categoryId": "cat_1",
      "createdAt": "2026-01-15T09:00:00Z"
    },
    {
      "id": "prd_2",
      "title": "Futbolka Basic 100% paxta",
      "slug": "futbolka-basic-100-paxta",
      "description": "Har qanday mavsum uchun qulay futbolka. O'lchamlar S-XXL.",
      "price": 149000,
      "oldPrice": null,
      "images": ["/uploads/tshirt-1.jpg"],
      "stock": 40,
      "isActive": true,
      "categoryId": "cat_2",
      "createdAt": "2026-02-02T11:30:00Z"
    }
  ]
}
```

---

## 5. Savat (localStorage) — toʻliq kod

`localStorage` — brauzer xotirasi, server soʻrovisiz ishlaydi, lekin **faqat matn (string)** saqlaydi.

### Savatning maʼlumot tuzilishi

```ts
// types/index.ts
export type CartItem = {
  id: string;        // product id
  title: string;
  price: number;     // tiyda
  image: string;
  quantity: number;
  stock: number;     // limitni bilish uchun
};

export type Cart = {
  items: CartItem[];
  version: 1;        // sxema o'zgarsa eski savatni bekor qilish uchun
};
```

### CartContext (useReducer + localStorage saqlash)

```tsx
// context/CartContext.tsx
'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState,
} from 'react';
import type { Cart, CartItem } from '@/types';

const STORAGE_KEY = 'cart_v1';
const MAX_QTY = 99;
const FREE_SHIPPING_FROM = 50000000;   // 500 000 so'm
const SHIPPING_COST = 2500000;         // 25 000 so'm

type Action =
  | { type: 'HYDRATE'; payload: Cart }
  | { type: 'ADD'; payload: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' };

const emptyCart: Cart = { items: [], version: 1 };

function clampQty(qty: number, stock: number) {
  return Math.max(1, Math.min(qty, stock, MAX_QTY));
}

function reducer(state: Cart, action: Action): Cart {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: clampQty(i.quantity + action.payload.quantity, i.stock) }
              : i
          ),
        };
      }
      // Eski narxni saqlamaymiz — savatdagi narx faqat ko'rsatuv uchun,
      // yakuniy narx checkout'da serverda qayta hisoblanadi.
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: clampQty(action.payload.quantity, action.payload.stock) }],
      };
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case 'SET_QTY':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, quantity: clampQty(action.quantity, i.stock) } : i))
          .filter((i) => i.quantity > 0),
      };

    case 'CLEAR':
      return emptyCart;
  }
}

type CartContextValue = {
  cart: Cart;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
  totalCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, emptyCart);
  const [hydrated, setHydrated] = useState(false);

  // 1) Sahifa yuklanganda localStorage'dan o'qiymiz
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Cart;
        if (parsed?.version === 1 && Array.isArray(parsed.items)) {
          dispatch({ type: 'HYDRATE', payload: parsed });
        } else {
          localStorage.removeItem(STORAGE_KEY);   // eski/buzuq sxema
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 2) Savat o'zgarsa — saqlaymiz
  useEffect(() => {
    if (!hydrated) return;   // bo'sh savat bilan yozib qo'ymaslik uchun
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD', payload: item }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
  const setQuantity = useCallback((id: string, quantity: number) => dispatch({ type: 'SET_QTY', id, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
    const totalCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      cart,
      addItem, removeItem, setQuantity, clearCart,
      subtotal,
      shipping,
      total: subtotal + shipping,
      totalCount,
    };
  }, [cart, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart faqat <CartProvider> ichida ishlatilishi kerak');
  return ctx;
}
```

> **SSR xavfi:** Next.js'da server render paytida `localStorage` yoʻq. Shu sababli birinchi render'da savatni boʻsh koʻrsatamiz, `useEffect` ichida toʻldiramiz (hydration). Aks holda "Text content did not match" xatosi chiqadi.

---

## 6. Asosiy komponentlar

### ProductCard

```tsx
// components/product/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-3 transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={product.images[0] ?? '/placeholder.png'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            −{discount}%
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800">
        {product.title}
      </h3>

      <div className="mt-auto pt-2">
        <p className="text-lg font-bold text-orange-600">{formatPrice(product.price)}</p>
        {product.oldPrice && (
          <p className="text-sm text-gray-400 line-through">{formatPrice(product.oldPrice)}</p>
        )}
        {product.stock === 0 && (
          <p className="mt-1 text-xs font-semibold text-gray-500">Mavjud emas</p>
        )}
      </div>
    </Link>
  );
}
```

### Katalog sahifasi — filtr + qidiruv + kategoriya (URL'da saqlash)

```tsx
// app/products/page.tsx
import { prisma } from '@/lib/db';
import ProductGrid from '@/components/product/ProductGrid';
import Filters from '@/components/product/Filters';

export const dynamic = 'force-dynamic';   // har so'rovda DB'dan

const PER_PAGE = 12;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; page?: string; max?: string };
}) {
  const q = (searchParams.q ?? '').slice(0, 100);
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const maxPrice = searchParams.max ? Number(searchParams.max) : undefined;

  // Filtr shartini bir joyda yig'amiz
  const where = {
    isActive: true,
    ...(searchParams.category ? { category: { slug: searchParams.category } } : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const sortMap = {
    new: { createdAt: 'desc' },
    cheap: { price: 'asc' },
    expensive: { price: 'desc' },
    popular: { orderItems: { _count: 'desc' } },
  } as const;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: sortMap[(searchParams.sort as keyof typeof sortMap) ?? 'new'],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Katalog</h1>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Filters categories={categories} />
        <div>
          <p className="mb-4 text-sm text-gray-500">{total} ta mahsulot topildi</p>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
```

### Filters (client, URL'ga yozadi — qidiruv natijasi ulashish mumkin)

```tsx
// components/product/Filters.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Category } from '@/types';

export default function Filters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');            // filtr o'zgarsa 1-sahifaga qaytamiz
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <aside className="space-y-5 rounded-2xl border bg-white p-4 lg:sticky lg:top-20 lg:h-fit">
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="q">Qidiruv</label>
        <input
          id="q"
          type="search"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value.trim())}
          placeholder="Mahsulot nomi..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="cat">Kategoriya</label>
        <select
          id="cat"
          value={params.get('category') ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Barchasi</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">Narx (maks.)</label>
        <input
          type="range" min={0} max={20000000} step={500000}
          defaultValue={params.get('max') ?? ''}
          onChange={(e) => update('max', e.target.value)}
          className="w-full accent-orange-600"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="sort">Saralash</label>
        <select
          id="sort"
          value={params.get('sort') ?? 'new'}
          onChange={(e) => update('sort', e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="new">Yangi kelganlar</option>
          <option value="cheap">Arzonidan qimmatiga</option>
          <option value="expensive">Qimmatidan arzoniga</option>
        </select>
      </div>
    </aside>
  );
}
```

### Product Details sahifasi

```tsx
// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/product/AddToCartButton';
import { generateMetadata } from './metadata';   // SEO uchun

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });
  if (!product || !product.isActive) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <Image src={product.images[0] ?? '/placeholder.png'} alt={product.title} fill priority className="object-cover" />
      </div>

      <div>
        <p className="text-sm text-gray-500">{product.category.name}</p>
        <h1 className="mt-1 text-2xl font-bold">{product.title}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-orange-600">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>

        <p className="mt-4 whitespace-pre-line text-gray-700">{product.description}</p>

        <p className={`mt-4 text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {product.stock > 0 ? `Omborda: ${product.stock} dona` : 'Mavjud emas'}
        </p>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
```

```tsx
// components/product/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <button disabled className="mt-6 w-full rounded-xl bg-gray-300 py-3 font-semibold text-gray-600 md:w-auto md:px-8">
        Mavjud emas
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem({
          id: product.id, title: product.title, price: product.price,
          image: product.images[0] ?? '/placeholder.png', quantity: 1, stock: product.stock,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      className="mt-6 w-full rounded-xl bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 active:scale-95 md:w-auto md:px-8"
    >
      {added ? '✓ Savatga qoʻshildi' : `Savatga qoʻshish — ${formatPrice(product.price)}`}
    </button>
  );
}
```

### Savat sahifasi

```tsx
// app/cart/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { cart, setQuantity, removeItem, subtotal, shipping, total } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-xl font-bold">Savatingiz boʻsh</h1>
        <Link href="/products" className="mt-4 inline-block rounded-xl bg-orange-600 px-6 py-3 text-white">
          Katalogga oʻtish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y rounded-2xl border bg-white">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-lg border">
                  <button onClick={() => setQuantity(item.id, item.quantity - 1)} className="px-3 py-1" aria-label="Kamaytirish">−</button>
                  <span className="w-10 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => setQuantity(item.id, item.quantity + 1)} className="px-3 py-1" aria-label="Ko'paytirish">+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-sm text-red-500 hover:underline">
                  Oʻchirish
                </button>
              </div>
            </div>
            <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Buyurtma</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Mahsulotlar</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Yetkazib berish</dt><dd>{shipping === 0 ? 'Bepul' : formatPrice(shipping)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Jami</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <Link href="/checkout" className="mt-5 block rounded-xl bg-orange-600 py-3 text-center font-semibold text-white hover:bg-orange-700">
          Buyurtma berish
        </Link>
      </aside>
    </div>
  );
}
```

### Checkout — forma + buyurtma yaratish

```tsx
// app/checkout/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get('name') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      address: String(form.get('address') ?? '').trim(),
      comment: String(form.get('comment') ?? '').trim(),
      // Faqat id + quantity yuboriladi — narx serverda tekshiriladi
      items: cart.items.map((i) => ({ id: i.id, quantity: i.quantity })),
    };

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.issues ?? { _form: data.error });
        return;
      }
      clearCart();
      router.push(`/checkout/success?order=${data.orderId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 px-4 py-8" noValidate>
      <h1 className="text-2xl font-bold">Buyurtma berish</h1>

      <Field label="Ism va familiya" name="name" error={errors.customerName} required />
      <Field label="Telefon" name="phone" type="tel" placeholder="+998901234567" error={errors.phone} required />
      <Field label="Manzil" name="address" error={errors.address} required textarea />
      <Field label="Izoh (ixtiyoriy)" name="comment" textarea />

      <div className="flex justify-between rounded-xl bg-gray-100 p-4 font-bold">
        <span>Jami:</span><span>{formatPrice(total)}</span>
      </div>

      <button
        type="submit"
        disabled={loading || cart.items.length === 0}
        className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
      </button>
    </form>
  );
}

function Field({ label, name, error, required, type = 'text', textarea, placeholder }: any) {
  const cls = `w-full rounded-lg border px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`;
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {textarea
        ? <textarea name={name} rows={3} placeholder={placeholder} className={cls} required={required} />
        : <input name={name} type={type} placeholder={placeholder} className={cls} required={required} />}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
```

---

## 7. API Route'lar va xavfsizlik

### Zod sxemalari

```ts
// lib/validations.ts
import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(3, 'Kamida 3 belgi').max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000),
  price: z.number().int().positive(),
  oldPrice: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).max(100000),
  categoryId: z.string().min(1),
  images: z.array(z.string().startsWith('/uploads/')).max(8).default([]),
});

export const orderSchema = z.object({
  customerName: z.string().min(2).max(80),
  phone: z.string().regex(/^\+?998\d{9}$/, 'Telefon formati: +998901234567'),
  address: z.string().min(10).max(300),
  comment: z.string().max(1000).optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })).min(1, 'Savat boʻsh'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
```

### JWT (httpOnly cookie)

```ts
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: { sub: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; email: string };
  } catch {
    return null;
  }
}

/** Route Handler ichida adminni tekshiradi — topilmasa null */
export async function getAdmin() {
  const token = cookies().get('admin_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ?? null;
}
```

```ts
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email yoki parol notoʻgʻri' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Xavfsizlik: foydalanuvchi bor-yoʻqligini oshkor qilmaslik uchun
  // har ikki holatda ham bir xil xabar va bir xil kechikish qaytaramiz
  const ok = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
  if (!ok) {
    return NextResponse.json({ error: 'Email yoki parol notoʻgʻri' }, { status: 401 });
  }

  const token = await signToken({ sub: admin!.id, email: admin!.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,      // JavaScript oʻqiy olmaydi → XSS himoyasi
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',     // CSRF himoyasi
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
```

### Mahsulotlar API (GET + POST)

```ts
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/auth';
import { productSchema } from '@/lib/validations';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').slice(0, 100);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const take = 12;

  const where = {
    isActive: true,
    ...(searchParams.get('category') ? { category: { slug: searchParams.get('category')! } } : {}),
    ...(q ? { OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
    ] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / take) });
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Ruxsat yoʻq' }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Maʼlumotlar notoʻgʻri', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
```

### Buyurtma API — narxni SERVERDA hisoblash

```ts
// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { orderSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Maʼlumotlar notoʻgʻri', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { customerName, phone, address, comment, items } = parsed.data;

  // 🔒 HECH QACHON client'dan kelgan narxga ishonmaymiz
  const ids = items.map((i) => i.id);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
  });

  if (products.length !== new Set(ids).size) {
    return NextResponse.json({ error: 'Baʼzi mahsulotlar mavjud emas' }, { status: 400 });
  }

  let total = 0;
  const orderItems: { productId: string; title: string; price: number; quantity: number }[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.id)!;
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `"${product.title}" yetarli emas` }, { status: 409 });
    }
    total += product.price * item.quantity;
    orderItems.push({
      productId: product.id, title: product.title,
      price: product.price, quantity: item.quantity,
    });
  }

  // Transaction: buyurtma + itemlar + ombondan ayirish — hammasi yoki hech biri
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerName, phone, address, comment, total,
        items: { create: orderItems },
      },
    });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } },
      });
    }
    return created;
  });

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
```

### Admin CRUD — PUT / DELETE

```ts
// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/auth';
import { productSchema } from '@/lib/validations';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Ruxsat yoʻq' }, { status: 401 });

  const parsed = productSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Xato', issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Ruxsat yoʻq' }, { status: 401 });

  // Soft-delete: buyurtmalar tarixi saqlanib qolsin
  await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
```

### Middleware — /admin sahifalarini himoya qilish

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: Request) {
  const token = (req as any).cookies.get('admin_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('next', new URL(req.url).pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
```

---

## 8. Rasm yuklash (xavfsiz usul)

```ts
// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { getAdmin } from '@/lib/auth';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;   // 5 MB

export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Ruxsat yoʻq' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Faqat JPG/PNG/WebP' }, { status: 415 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Maks. 5 MB' }, { status: 413 });

  // Xavfsiz nom: foydalanuvchi kiritgan nom ishlatilmaydi
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'jpg';
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  await writeFile(`./public/uploads/${name}`, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
```

---

## 9. UX/UI best practices

1. **Skeleton loader** — maʼlumot kelgunicha "kutayotgan" kard koʻrsating (spinner emas). UX hisobida sayt tez his qilinadi.
2. **Boʻsh holatlar (empty state)** — "Savat boʻsh", "Mahsulot topilmadi" — har doim keyingi qadamni koʻrsating (tugma/link).
3. **Optimistik UI** — "Savatga qoʻshildi" ni darhol koʻrsating, soʻng serverga yuboring.
4. **Mobil birinchi (mobile-first)** — Tailwind'da `class="w-full md:w-auto"`.
5. **Rasm optimizatsiyasi** — `next/image` + `sizes` prop'i; aks holda 4 MB rasm butun sahifani og'diradi.
6. **Kirish imkoniyati (a11y)** — `<label htmlFor>`, `aria-label`, `alt` matn, klaviatura bilan boshqarish.
7. **Pul formati** — `new Intl.NumberFormat('uz-UZ').format(price / 100)` → `129 900`.
8. **Line-clamp** — uzun sarlavhalar kartochkani buzmasin.
9. **Debounce** — qidiruv input'ida 300 ms kutib soʻrov yuboring.
10. **Toast xabarlar** — har qanday amal uchun qisqa tasdiq xabari.

---

## 10. Xavfsizlik best practices

| Xavf | Himoya |
|---|---|
| SQL injection | Prisma parametrli soʻrov ishlatadi — xom SQL yozmang |
| XSS | React avtomatik ekranlaydi. `dangerouslySetInnerHTML` ISHLATMANG |
| Narxni manipulyatsiya | Narx faqat serverda hisoblanadi (yuqoridagi `orders/route.ts`) |
| JWT o'g'irlanishi | `httpOnly` + `secure` + `sameSite` cookie, qisqa muddat (7 kun) |
| Brute-force login | `express-rate-limit` / Next.js'da IP boʻyicha cheklov (masalan 5 urinish/15 min) |
| Zaif parol | `bcrypt` (12 round), minimum 8 belgi |
| Xavfli fayl yuklash | Faqat `image/jpeg/png/webp`, hajmi ≤ 5 MB, nom `crypto.randomUUID()` |
| Maxfiy kalitlar | `.env.local` (git'ga qoʻshilmasin), `.gitignore` ichiga yozing |
| CSRF | `sameSite='lax''` cookie + forma tekshiruvlari |
| Maʼlumot oshkasi | API xatolarda tizim ichi maʼlumot qaytarmang — umumiy xabar |

---

## 11. Ishga tushirish bosqichlari

```bash
# 1) Loyiha yaratish
npx create-next-app@latest online-store --typescript --tailwind --app
cd online-store

# 2) Kutubxonalar
npm i prisma @prisma/client zod jose bcryptjs
npm i -D @types/bcryptjs

# 3) Prisma sozlash
npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init

# 4) Namunaviy maʼlumotlar
npx prisma db seed

# 5) Ishga tushirish
npm run dev
```

`.env.local` namunasi:

```env
DATABASE_URL="postgresql://postgres:parol@localhost:5432/store?schema=public"
JWT_SECRET="juda-uzun-tasodifiy-kalit-kamida-32-belgi"
```

`prisma/seed.ts` (namunaviy maʼlumot):

```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const elektronika = await prisma.category.create({
    data: { name: 'Elektronika', slug: 'elektronika' },
  });
  const kiyim = await prisma.category.create({
    data: { name: 'Kiyimlar', slug: 'kiyimlar' },
  });

  await prisma.product.createMany({
    data: [
      {
        title: 'Simsiz Quloqchin AirSound Pro',
        slug: 'simsiz-quloqchin-airsound-pro',
        description: 'Aktiv shovqin bekor qilish (ANC), 36 soat ishlash vaqti.',
        price: 12990000,
        oldPrice: 15990000,
        images: ['/uploads/airsound-1.jpg'],
        stock: 12,
        categoryId: elektronika.id,
      },
      {
        title: 'Futbolka Basic 100% paxta',
        slug: 'futbolka-basic-100-paxta',
        description: 'Har qanday mavsum uchun qulay futbolka. Oʻlchamlar S–XXL.',
        price: 149000,
        images: ['/uploads/tshirt-1.jpg'],
        stock: 40,
        categoryId: kiyim.id,
      },
    ],
  });

  await prisma.user.create({
    data: {
      email: 'admin@store.uz',
      name: 'Administrator',
      passwordHash: await bcrypt.hash('KuchliParol123', 12),
    },
  });
}

main().finally(() => prisma.$disconnect());
```

---

## 12. 6 haftalik ish rejasi

| Hafta | Vazifa |
|---|---|
| 1 | Loyiha skeleti, Tailwind, Prisma sxema, seed maʼlumotlar |
| 2 | Katalog: filtr, qidiruv, kategoriya, URL parametrlar |
| 3 | Product Details sahifasi + SEO (generateMetadata) |
| 4 | CartContext + localStorage + savat sahifasi |
| 5 | Checkout + Orders API + admin login + CRUD |
| 6 | Rasm yuklash, test, optimizatsiya (Lighthouse ≥ 90), deploy (Vercel) |
