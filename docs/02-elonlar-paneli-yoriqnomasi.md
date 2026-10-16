# E'lonlar Paneli (Platforma) — Noldan Qurish Boʻyicha Toʻliq Yoʻriqnoma

> Stack: **React (Vite) + Express + MongoDB (Mongoose) + JWT + Socket.io**
> Bu — OLX/UZ ning kichik versiyasi.

---

## 1. Nega aynan shu stack?

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Frontend | React + Vite | Tez dev-server, keng ekosistema, SPA — filtrlarda sahifa qayta yuklanmaydi |
| Backend | Express | Oddiy va tushunarli routing + middleware tizimi |
| Maʼlumotlar bazasi | MongoDB + Mongoose | E'lonlar bir-biriga oʻxshamaydi (har xil maydonlar) → hujjatli DB mos keladi. Text-index bilan qidiruv tez. |
| Auth | JWT (access + refresh) | SPA uchun standart. `httpOnly` cookie'da saqlanadi |
| Chat | Socket.io | Real-time xabar, avtomatik qayta ulanish (reconnect) |
| Validatsiya | Zod | Frontend va backend'da BIR XIL sxema |

> **Muqobil:** Agar bitta til va bitta repozitoriy istasangiz — **Next.js (App Router) + Server Actions + MongoDB**. Lekin SPA + Express API'ni oʻrganish kelajakda katta loyihalarda foydaliroq.

---

## 2. Toʻliq Arxitektura

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT — React SPA (Vite)            http://localhost:5173         │
│                                                                     │
│  ┌──────────┐   ┌───────────────┐   ┌───────────────────────────┐  │
│  │  Pages   │──►│  Context/Hooks│──►│ api/axios.js              │  │
│  │(React    │   │ AuthContext   │   │  baseURL + withCredentials │  │
│  │ Router)  │   │ useAdFilters  │   │  + interceptor (401→login) │  │
│  └──────────┘   └───────────────┘   └──────────┬────────────────┘  │
│                                                │                    │
│  Socket.io-client ◄────── WebSocket ───────────┼───────┐           │
└────────────────────────────────────────────────┼───────┼───────────┘
                                                 │       │
                          REST (JSON, cookie)    │       │ WS (JWT)
┌────────────────────────────────────────────────▼───────▼───────────┐
│  SERVER — Express API                 http://localhost:4000         │
│                                                                     │
│  Request → helmet → cors → cookieParser → express.json → rateLimit │
│         → routes → validate (Zod) → controller → service → response│
│                                                                     │
│  routes/          controllers/        models/          middleware/  │
│  ├ authRoutes     ├ authController    ├ User.js        ├ auth.js   │
│  ├ adRoutes       ├ adController      ├ Ad.js          ├ validate  │
│  ├ categoryRoutes ├ categoryCtrl      ├ Category.js    ├ upload.js │
│  └ convRoutes     ├ convController    ├ Message.js     ├ error.js  │
│                   └ msgController     └ Conversation.js            │
│                                                                     │
│  Socket.io server (JWT bilan ulanish)                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Mongoose
                    ┌──────────▼──────────┐
                    │  MongoDB            │
                    │  users, ads,        │
                    │  categories,        │
                    │  messages, convs    │
                    └─────────────────────┘
```

### Soʻrov oqimi (misol: e'lon qidirish)

```
Browser → GET /api/ads?search=iphone&city=Toshkent&sort=cheap&page=1
  → Express router (/ads)
  → controller.listAds: Mongoose bilan filter + text search + sort + pagination
  → .populate('author', 'name avatar')  // egasining ismi kerak, paroli YO'Q
  → JSON: { items, total, page, pages }
```

---

## 3. Papka va fayllar strukturasi

```
elonlar-platforma/
│
├── client/                                  # ── FRONTEND ──
│   ├── index.html
│   ├── vite.config.js
│   ├── .env                                 # VITE_API_URL=http://localhost:4000/api
│   └── src/
│       ├── main.jsx                         # React root + BrowserRouter
│       ├── App.jsx                          # Route'lar
│       ├── index.css                        # Tailwind
│       │
│       ├── api/
│       │   ├── axios.js                     # Axios instance (cookie + interceptor)
│       │   └── endpoints.js                 # Barcha URL'lar bir joyda
│       │
│       ├── context/
│       │   └── AuthContext.jsx              # user, login, register, logout
│       │
│       ├── hooks/
│       │   ├── useAdFilters.js              # URL ↔ filtr sinxronizatsiyasi
│       │   ├── useDebounce.js
│       │   └── useSocket.js
│       │
│       ├── components/
│       │   ├── layout/Navbar.jsx, Footer.jsx, Layout.jsx
│       │   ├── ads/AdCard.jsx, AdGrid.jsx, FilterSidebar.jsx,
│       │   │        SearchBar.jsx, ImageGallery.jsx, ContactSellerButton.jsx
│       │   ├── chat/ChatWindow.jsx, MessageBubble.jsx, ConversationList.jsx
│       │   └── ui/Button.jsx, Input.jsx, Select.jsx, Modal.jsx,
│       │            Spinner.jsx, EmptyState.jsx, Toast.jsx
│       │
│       └── pages/
│           ├── Home.jsx                     # E'lonlar + filtrlar
│           ├── AdDetail.jsx                 # Bitta e'lon
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── NewAd.jsx                    # E'lon joylash
│           ├── EditAd.jsx                   # Tahrirlash
│           ├── Profile.jsx                  # Profil + "Mening e'lonlarim"
│           ├── Favorites.jsx
│           ├── MyAds.jsx
│           └── Chat.jsx                     # Chat ro'yxati
│
├── server/                                  # ── BACKEND ──
│   ├── .env                                 # MONGO_URI, JWT_SECRET, ...
│   ├── package.json
│   └── src/
│       ├── index.js                         # app + httpServer + Socket.io
│       ├── app.js                           # Express ilova (middleware + routes)
│       ├── config/
│       │   └── db.js                        # Mongoose ulanish
│       ├── models/
│       │   ├── User.js
│       │   ├── Category.js
│       │   ├── Ad.js
│       │   ├── Conversation.js
│       │   └── Message.js
│       ├── routes/
│       │   ├── index.js                     # /api
│       │   ├── auth.routes.js
│       │   ├── ad.routes.js
│       │   ├── category.routes.js
│       │   └── conversation.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── ad.controller.js
│       │   ├── category.controller.js
│       │   └── conversation.controller.js
│       ├── middleware/
│       │   ├── auth.js                      # JWT tekshiruvi
│       │   ├── validate.js                  # Zod tekshiruvi
│       │   ├── upload.js                    # Multer (rasm)
│       │   └── errorHandler.js
│       ├── socket/
│       │   └── index.js                     # Socket.io hodisalari
│       └── utils/
│           ├── AppError.js
│           └── slugify.js
│
└── README.md
```

---

## 4. Ma'lumotlar bazasi rejasi (Mongoose Schema)

### 4.1 User

```js
// server/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 60 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },  // select:false → hech qachon avtomatik qaytmaydi
    phone:    { type: String, match: /^\+?998\d{9}$/ },
    avatar:   { type: String, default: '/avatars/default.png' },
    city:     { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Parolni saqlashdan oldin hash qilamiz
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);  // 12 = qiyinlik
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// JSON'ga o'tganda maxfiy maydonlarni olib tashlaymiz
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
```

### 4.2 Category

```js
// server/src/models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  icon: { type: String },            // emoji yoki rasm URL
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },  // sub-kategoriya
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
```

### 4.3 Ad (E'lon)

```js
// server/src/models/Ad.js
import mongoose from 'mongoose';

const adSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 5000 },
    price:       { type: Number, required: true, min: 0, index: true },
    currency:    { type: String, enum: ['UZS', 'USD'], default: 'UZS' },
    isNegotiable:{ type: Boolean, default: false },        // "kelishiladi"
    images:      { type: [String], validate: [(v) => v.length <= 10, 'Maks. 10 rasm'] },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    city:    { type: String, required: true, index: true },
    district:{ type: String },
    phone:   { type: String, required: true, match: /^\+?998\d{9}$/ },

    status: { type: String, enum: ['active', 'sold', 'archived'], default: 'active', index: true },
    views:  { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// To'liq matnli qidiruv indeksi (title + description bo'yicha)
adSchema.index({ title: 'text', description: 'text' });

// Filtrlar uchun murakkab indeks — tez ishlash kaliti
adSchema.index({ status: 1, category: 1, city: 1, price: 1, createdAt: -1 });

export default mongoose.model('Ad', adSchema);
```

### 4.4 Conversation + Message (Chat)

```js
// server/src/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, validate: (v) => v.length === 2,
    }],
    ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

// Bir e'lon bo'yicha bir juftlik uchun bitta suhbat
conversationSchema.index({ participants: 1, ad: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
```

```js
// server/src/models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Chat tarixini tez yuklash uchun
messageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
```

### Sxema xaritasi

```
User ──1:N──► Ad ◄──N:1── Category
 │            │
 │            └──1:N──► Conversation ◄──N:1── User
 │                              │
 └──────────N:M─────────────────┴──1:N──► Message
```

---

## 5. API Endpoint'lar roʻyxati

### Auth (`/api/auth`)
| Method | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| POST | `/api/auth/register` | Roʻyxatdan oʻtish | — |
| POST | `/api/auth/login` | Kirish (JWT cookie) | — |
| POST | `/api/auth/logout` | Chiqish (cookie o'chirish) | — |
| GET | `/api/auth/me` | Joriy foydalanuvchi | 🔒 |
| POST | `/api/auth/refresh` | Access tokenni yangilash | refresh cookie |
| PATCH | `/api/auth/me` | Profilni tahrirlash | 🔒 |
| PATCH | `/api/auth/password` | Parolni oʻzgartirish | 🔒 |

### E'lonlar (`/api/ads`)
| Method | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| GET | `/api/ads` | Roʻyxat + filtr + qidiruv + paginatsiya | — |
| GET | `/api/ads/:id` | Bitta e'lon | — |
| POST | `/api/ads` | Yangi e'lon joylash | 🔒 |
| PUT | `/api/ads/:id` | Tahrirlash | 🔒 + egalik |
| DELETE | `/api/ads/:id` | Oʻchirish | 🔒 + egalik |
| PATCH | `/api/ads/:id/status` | `sold` / `active` qilish | 🔒 + egalik |
| GET | `/api/ads/my` | Mening e'lonlarim | 🔒 |
| POST | `/api/ads/:id/favorite` | Sevimlilarga qoʻshish | 🔒 |
| GET | `/api/ads/favorites` | Sevimlilar roʻyxati | 🔒 |

**Qidiruv query parametrlari (GET /api/ads):**
```
?search=iphone        → to'liq matnli qidiruv
&category=<id>        → kategoriya
&city=Toshkent        → hudud
&minPrice=1000000     → narxdan
&maxPrice=5000000     → narxgacha
&sort=new|cheap|expensive
&page=1&limit=20      → paginatsiya
```

### Kategoriyalar (`/api/categories`)
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/api/categories` | Barcha kategoriyalar |

### Chat (`/api/conversations`)
| Method | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| GET | `/api/conversations` | Mening suhbatlarim | 🔒 |
| POST | `/api/conversations` | Suhbat boshlash/ochish `{adId}` | 🔒 |
| GET | `/api/conversations/:id/messages?page=1` | Xabarlar | 🔒 + ishtirokchi |
| POST | `/api/conversations/:id/messages` | Xabar yozish (Socket'ga ham yuboriladi) | 🔒 |

### Socket.io hodisalari
| Hodisa | Yoʻnalish | Tavsif |
|---|---|---|
| `connection` | client→server | JWT bilan ulanish |
| `conversation:join` | client→server | Xonaga qoʻshilish |
| `message:send` | client→server | Xabar yuborish |
| `message:new` | server→client | Yangi xabar keldi |
| `typing:start` / `typing:stop` | ikkala tom | "Yozmoqda..." indikatori |

---

## 6. Kod namunalari

### 6.1 Express ilovaning skeleti

```js
// server/src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());                                   // xavfsizlik sarlavhalari
app.use(cors({
  origin: process.env.CLIENT_URL,                   // faqat bizning frontend
  credentials: true,                                // cookie'larga ruxsat
}));
app.use(express.json({ limit: '100kb' }));           // hajm chegarasi
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));      // rasmlar

// Brute-force himoyasi
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use('/api', routes);

app.use(errorHandler);                              // OXIRIDA — barcha xatolar shu yerga
export default app;
```

```js
// server/src/index.js
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { initSocket } from './socket/index.js';

const server = http.createServer(app);
initSocket(server);                                 // Socket.io HTTP server'ga ulangan

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT ?? 4000, () =>
      console.log(`Server ${process.env.PORT ?? 4000}-portda ishlayapti`)
    );
  })
  .catch((err) => { console.error('DB xatosi:', err); process.exit(1); });
```

### 6.2 Auth controller (JWT + httpOnly cookie)

```js
// server/src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().regex(/^\+?998\d{9}$/).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ACCESS_EXPIRES = '15m';      // qisqa — xavfsiz
const REFRESH_EXPIRES_DAYS = 30;   // uzoq — qulaylik

function sendTokens(res, userId) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });

  const cookieOpts = {
    httpOnly: true,                                    // JS oʻqiy olmaydi → XSS himoyasi
    secure: process.env.NODE_ENV === 'production',     // faqat HTTPS
    sameSite: 'lax',                                   // CSRF himoyasi
    path: '/',
  };
  res.cookie('access_token', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: REFRESH_EXPIRES_DAYS * 864e5 });
}

export async function register(req, res) {
  const data = registerSchema.parse(req.body);        // xato bo'lsa validate middleware ushlaydi

  const exists = await User.findOne({ email: data.email });
  if (exists) throw new AppError('Bu email band', 409);

  const user = await User.create(data);               // parol pre('save') hook'da hash qilinadi
  sendTokens(res, user.id);
  res.status(201).json(user);                          // toJSON parolni olib tashlaydi
}

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  // select('+passwordHash') — chunki sxemada select:false
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    // Bir xil xabar: hujumchi qaysi maydon xato ekanini bilmaydi
    throw new AppError('Email yoki parol notoʻgʻri', 401);
  }
  sendTokens(res, user.id);
  res.json(user);
}

export async function logout(_req, res) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await User.findById(req.user.sub);
  if (!user) throw new AppError('Topilmadi', 404);
  res.json(user);
}
```

### 6.3 Middleware: auth + validate + errorHandler

```js
// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';

/** JWT tekshiruvi — himoyalangan route'lar uchun */
export function protect(req, _res, next) {
  const token = req.cookies?.access_token
    ?? req.headers.authorization?.replace('Bearer ', '');

  if (!token) return next(new (require('../utils/AppError.js').AppError)('Tizimga kiring', 401));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);   // { sub, iat, exp }
    next();
  } catch {
    next(new (require('../utils/AppError.js').AppError)('Sessiya tugagan', 401));
  }
}
```

```js
// server/src/middleware/validate.js
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const err = new Error('Maʼlumotlar notoʻgʻri');
    err.status = 422;
    err.issues = result.error.flatten().fieldErrors;
    return next(err);
  }
  req.body = result.data;   // tozalangan va tayyor maʼlumot
  next();
};
```

```js
// server/src/middleware/errorHandler.js
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;
  // 500 xatolarni log'ga yozamiz, lekin client'ga ichki tafsilot YUBORMAYMIZ
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Server xatosi' : err.message,
    issues: err.issues,
  });
}
```

```js
// server/src/utils/AppError.js
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
```

### 6.4 E'lon controller — filtr + qidiruv + paginatsiya

```js
// server/src/controllers/ad.controller.js
import Ad from '../models/Ad.js';

const SORTS = { new: { createdAt: -1 }, cheap: { price: 1 }, expensive: { price: -1 } };

export async function listAds(req, res) {
  const { search, category, city, minPrice, maxPrice, sort = 'new', page = 1, limit = 20 } = req.query;

  const filter = { status: 'active' };

  if (category) filter.category = category;
  if (city) filter.city = city;
  if (search) filter.$text = { $search: search };              // text index ishlatadi
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));    // maks. 50 — hujumdan himoya

  const [items, total] = await Promise.all([
    Ad.find(filter)
      .populate('author', 'name avatar city createdAt')        // faqat kerakli maydonlar
      .sort(SORTS[sort] ?? SORTS.new)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),                                                   // lean() → tezroq, oddiy obyekt
    Ad.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
}

export async function getAd(req, res) {
  const ad = await Ad.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },                                    // ko'rishlar soni
    { new: true }
  ).populate('author', 'name avatar phone city createdAt');

  if (!ad) throw new AppError('Eʼlon topilmadi', 404);
  res.json(ad);
}

export async function createAd(req, res) {
  const ad = await Ad.create({ ...req.body, author: req.user.sub });
  res.status(201).json(ad);
}

export async function updateAd(req, res) {
  const ad = await Ad.findById(req.params.id);
  if (!ad) throw new AppError('Eʼlon topilmadi', 404);
  // 🔒 EGALIK TEKSHIRUVI — boshqaning e'lonini tahrirlash mumkin emas
  if (ad.author.toString() !== req.user.sub) throw new AppError('Ruxsat yoʻq', 403);

  Object.assign(ad, req.body);
  await ad.save();
  res.json(ad);
}

export async function deleteAd(req, res) {
  const ad = await Ad.findById(req.params.id);
  if (!ad) throw new AppError('Eʼlon topilmadi', 404);
  if (ad.author.toString() !== req.user.sub) throw new AppError('Ruxsat yoʻq', 403);

  await ad.deleteOne();
  res.json({ ok: true });
}
```

### 6.5 Route'lar

```js
// server/src/routes/ad.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdSchema, updateAdSchema } from '../validators/ad.validator.js';
import * as ad from '../controllers/ad.controller.js';

const router = Router();

// ── Statik (o'zgarishsiz) route'lar AVVAL ──
router.get('/', ad.listAds);
router.get('/my', protect, ad.myAds);                  // /:id'dan OLDIN!
router.get('/favorites', protect, ad.favorites);

// ── Dinamik route'lar keyin ──
router.get('/:id', ad.getAd);

router.post('/', protect, validate(createAdSchema), ad.createAd);
router.put('/:id', protect, validate(updateAdSchema), ad.updateAd);
router.delete('/:id', protect, ad.deleteAd);
router.patch('/:id/status', protect, ad.setStatus);
router.post('/:id/favorite', protect, ad.toggleFavorite);

export default router;
```

> ⚠️ **Tartib muhim:** `/:id` dan oldin `/my` yozilmasa, `GET /api/ads/my` soʻrovi `id = "my"` deb tushuniladi.

### 6.6 Multer — rasm yuklash

```js
// server/src/middleware/upload.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/ads/',
  filename: (_req, file, cb) => {
    // Xavfsiz nom: asl nom ishlatilmaydi (yo'l bilan urg'u hujumidan himoya)
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  cb(allowed.includes(file.mimetype) ? null : new Error('Faqat rasm'), allowed.includes(file.mimetype));
};

export const uploadAdImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },   // 5 MB, 10 fayl
}).array('images', 10);
```

### 6.7 Socket.io chat

```js
// server/src/socket/index.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Har bir ulanishda JWT tekshiramiz
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      ?? socket.handshake.headers.cookie?.match(/access_token=([^;]+)/)?.[1];
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Ruxsat yoʻq'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.sub;
    console.log(`Ulanish: ${userId}`);

    socket.on('conversation:join', async (conversationId) => {
      // Xona a'zosimi? — tekshiruv SHART
      const conv = await Conversation.findById(conversationId);
      if (!conv?.participants.map(String).includes(userId)) return;
      socket.join(conversationId);
    });

    socket.on('message:send', async ({ conversationId, text }) => {
      const conv = await Conversation.findById(conversationId);
      if (!conv?.participants.map(String).includes(userId)) return;   // yana tekshiruv!

      const message = await Message.create({ conversation: conversationId, sender: userId, text });
      conv.lastMessage = message._id;
      await conv.save();

      // Xonadagilarga (o'zimni ham) yuboramiz
      io.to(conversationId).emit('message:new', {
        _id: message._id, text, sender: userId, createdAt: message.createdAt,
      });
    });

    socket.on('disconnect', () => console.log(`Uzildi: ${userId}`));
  });

  return io;
}
```

---

## 7. Frontend kod namunalari

### 7.1 Axios instance

```js
// client/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,          // cookie'lar yuborilsin
});

// 401 bo'lsa — login'ga yuboramiz
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 7.2 AuthContext

```jsx
// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // sahifa chayqalmasligi uchun

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    setUser(data);
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 7.3 Route'lar + himoyalangan sahifa

```jsx
// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import AdDetail from './pages/AdDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import NewAd from './pages/NewAd';
import Profile from './pages/Profile';
import MyAds from './pages/MyAds';
import Chat from './pages/Chat';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center">Yuklanmoqda...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ads/:id" element={<AdDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/ads/new" element={<Protected><NewAd /></Protected>} />
        <Route path="/ads/:id/edit" element={<Protected><EditAd /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/my-ads" element={<Protected><MyAds /></Protected>} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/chat/:conversationId" element={<Protected><Chat /></Protected>} />

        <Route path="*" element={<p className="p-8 text-center">Sahifa topilmadi</p>} />
      </Route>
    </Routes>
  );
}
```

### 7.4 AdCard

```jsx
// client/src/components/ads/AdCard.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { formatPrice, timeAgo } from '../../utils/format';

export default function AdCard({ ad }) {
  const { user } = useAuth();

  async function contactSeller() {
    if (!user) return (window.location.href = '/login');
    const { data } = await api.post('/conversations', { adId: ad._id });
    window.location.href = `/chat/${data._id}`;
  }

  return (
    <article className="overflow-hidden rounded-2xl border bg-white transition hover:shadow-md">
      <Link to={`/ads/${ad._id}`}>
        <div className="aspect-[4/3] bg-gray-100">
          <img
            src={ad.images[0] ?? '/placeholder.jpg'}
            alt={ad.title}
            loading="lazy"                       // sahifa tez yuklanishi uchun
            className="h-full w-full object-cover"
          />
        </div>
      </Link>

      <div className="p-3">
        <Link to={`/ads/${ad._id}`}>
          <h3 className="line-clamp-2 font-medium hover:text-orange-600">{ad.title}</h3>
        </Link>

        <p className="mt-1 text-lg font-bold text-orange-600">
          {formatPrice(ad.price, ad.currency)}
          {ad.isNegotiable && <span className="ml-1 text-xs font-normal text-gray-500">kelishiladi</span>}
        </p>

        <p className="mt-1 text-xs text-gray-500">{ad.city} · {timeAgo(ad.createdAt)}</p>

        <button
          onClick={contactSeller}
          className="mt-3 w-full rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Bogʻlanish
        </button>
      </div>
    </article>
  );
}
```

### 7.5 Filtrlar — URL'da saqlash

```jsx
// client/src/hooks/useAdFilters.js
import { useSearchParams } from 'react-router-dom';

export function useAdFilters() {
  const [params, setParams] = useSearchParams();

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');                    // filtr o'zgarsa 1-sahifaga
    setParams(next);
  }

  return {
    values: Object.fromEntries(params),     // { search, category, city, sort... }
    update,
    setPage: (p) => { const n = new URLSearchParams(params); n.set('page', p); setParams(n); },
  };
}
```

```jsx
// client/src/components/ads/FilterSidebar.jsx
import { useAdFilters } from '../../hooks/useAdFilters';

export default function FilterSidebar({ categories }) {
  const { values, update } = useAdFilters();

  return (
    <aside className="space-y-4 rounded-2xl border bg-white p-4 lg:sticky lg:top-4 lg:h-fit">
      <input
        type="search"
        value={values.search ?? ''}
        onChange={(e) => update('search', e.target.value)}
        placeholder="Qidirish..."
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />

      <select value={values.city ?? ''} onChange={(e) => update('city', e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm">
        <option value="">Barcha hududlar</option>
        <option value="Toshkent">Toshkent</option>
        <option value="Samarqand">Samarqand</option>
        <option value="Buxoro">Buxoro</option>
        <option value="Andijon">Andijon</option>
      </select>

      <select value={values.category ?? ''} onChange={(e) => update('category', e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm">
        <option value="">Barcha kategoriyalar</option>
        {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>

      <div className="flex gap-2">
        <input type="number" placeholder="dan" value={values.minPrice ?? ''}
          onChange={(e) => update('minPrice', e.target.value)}
          className="w-1/2 rounded-lg border px-2 py-2 text-sm" />
        <input type="number" placeholder="gacha" value={values.maxPrice ?? ''}
          onChange={(e) => update('maxPrice', e.target.value)}
          className="w-1/2 rounded-lg border px-2 py-2 text-sm" />
      </div>

      <select value={values.sort ?? 'new'} onChange={(e) => update('sort', e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm">
        <option value="new">Yangi</option>
        <option value="cheap">Arzon</option>
        <option value="expensive">Qimmat</option>
      </select>
    </aside>
  );
}
```

```jsx
// client/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import AdCard from '../components/ads/AdCard';
import FilterSidebar from '../components/ads/FilterSidebar';
import { useAdFilters } from '../hooks/useAdFilters';
import { useDebounce } from '../hooks/useDebounce';

export default function Home() {
  const { values } = useAdFilters();
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = useDebounce(values.search, 400);   // 400 ms kutib so'rov yuboramiz

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...values, search, page: values.page ?? 1 });
    api.get(`/ads?${params}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [values, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar categories={categories} />

        <section>
          <p className="mb-4 text-sm text-gray-500">{data.total} ta eʼlon</p>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />   // skeleton
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-gray-500">
              <p className="text-4xl">🔍</p>
              <p className="mt-2">Hech nima topilmadi</p>
              <p className="text-sm">Filtrlarni oʻzgartirib koʻring</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.items.map((ad) => <AdCard key={ad._id} ad={ad} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

### 7.6 Chat (Socket.io client)

```jsx
// client/src/pages/Chat.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Ulanish (bir marta)
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    return () => socketRef.current.disconnect();
  }, []);

  // Xabarlarni yuklash + xonaga qoʻshilish
  useEffect(() => {
    if (!conversationId) return;
    api.get(`/conversations/${conversationId}/messages`).then((r) => setMessages(r.data));

    const socket = socketRef.current;
    socket.emit('conversation:join', conversationId);
    socket.on('message:new', (msg) => setMessages((prev) => [...prev, msg]));

    return () => socket.off('message:new');
  }, [conversationId]);

  // Yangi xabarda pastga tushish
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.emit('message:send', { conversationId, text });
    setText('');
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col p-4">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.sender === user.id ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.sender === user.id ? 'bg-orange-600 text-white' : 'bg-gray-100'
            }`}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 rounded-full border px-4 py-2 text-sm"
        />
        <button className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white">
          Yuborish
        </button>
      </form>
    </div>
  );
}
```

---

## 8. UI dizayn tavsiyalari

1. **Layout:** Yuqorida qidiruv + logo, chapda filtr paneli (`260px`), oʻngda karta grid'i (`grid-cols-2 md:grid-cols-3`).
2. **Rang:** OLX uslubi — bitta quvvatli aksent rang (masalan `#f97316` orange), qolgani neytral (white/gray-50). Rangi koʻp = arzon koʻrinadi.
3. **Kartochka:** `aspect-[4/3]` rasm (bir xil balandlik!) → sarlavha (2 qator, `line-clamp-2`) → narx (yirik, qalin) → shahar + vaqt.
4. **Filtr holati saqlansin:** URL'da saqlash orqali foydalanuvchi natijani do'stimga yubora oladi va "orqaga" bosganda filtr yoʻqolmaydi.
5. **Boʻsh holat:** "Hech nima topilmadi" + "Filtrlarni tozalash" tugmasi.
6. **Skeleton loader:** kutish paytida kulrang animatsiyali bloklar — sezilarli tezlik.
7. **Mobil:** Pastda yopish-tugmasi bilan "Filtr" modal paneli; kattaroq barmoqlar uchun `min-h-[44px]` tugmalar.
8. **Rasm:** `loading="lazy"`, `object-cover`, birinchi rasm katta galereya (thumbnail'lar ostida).
9. **Ishonch belgilari:** "Tekshirilgan", "Bugun qoʻshilgan" — foydalanuvchi ishonchini oshiradi.
10. **Dark mode:** `dark:` klasslari bilan qoʻshimcha qoʻllab-quvvatlash (ixtiyoriy).

---

## 9. Xavfsizlik best practices

| Xavf | Himoya choralari |
|---|---|
| Parol oshkor boʻlishi | `bcrypt` 12 round, `select: false`, `toJSON`da oʻchirish |
| XSS | React avtomatik ekranlaydi; `dangerouslySetHTML` ISHLATMANG |
| NoSQL injection | `req.body` → Zod bilan tekshirish; `$where`, `$function` ishlatishga ruxsat bermaslik |
| SQL/DB injection | Mongoose casting qiladi, lekin `ObjectId` formatini tekshiring: `mongoose.isValidObjectId(id)` |
| Boshqaning maʼlumotini oʻzgartirish | Har `PUT`/`DELETE`da **egallik tekshiruvi** (`ad.author.toString() !== req.user.sub → 403`) |
| JWT o'g'irlanishi | `httpOnly` + `secure` + `sameSite` cookie; access 15 daqiqa, refresh 30 kun; refresh tokenni DB'da saqlash (blacklist) |
| Brute-force | `express-rate-limit` (`/api/auth` uchun 20 soʻrov/15 daqiqa) |
| Xavfli fayl | Multer `fileFilter` (faqat rasm) + `limits: 5MB` + tasodifiy nom |
| Hajm hujumi | `express.json({ limit: '100kb' })` |
| CORS | `origin: process.env.CLIENT_URL` — `*` EMAS |
| Maxfiy kalitlar | `.env` + `.gitignore`; `.env.example` nusxasini qoldiring |
| Xato oshkor boʻlishi | `errorHandler` faqat umumiy xabar qaytaradi, stack trace'ni client'ga yubormaydi |

---

## 10. UX best practices

1. **Forma validatsiyasi har joyda:** `required`, `minLength`, xato matni input ostida (qizil).
2. **Yuklash holatlari:** tugmalar `disabled` + "Yuborilmoqda..." matni — qoʻshaloq soʻrovning oldi olish.
3. **Optimistik UI:** "Sevimlilarga qoʻshildi" ni darhol koʻrsatish, xato boʻlsa orqaga qaytarish.
4. **Toast xabarlar:** muvaffaqiyat/xato haqida qisqa bildirishnoma.
5. **Qidiruv kechikishi (debounce):** har harfda soʻrov yuborilmaydi — 400 ms.
6. **Cheksiz oʻqish yoki paginatsiya:** har 20 e'londa.
7. **Saqlash va ulashish:** filtr holatini URL'da saqlash.
8. **Profil:** "Mening e'lonlarim" jadvali — tahrirlash, "sotildi" belgilash, oʻchirish.
9. **Chat:** `typing` indikatori, oʻqilgan belgisi, avtomatik pastga scroll.
10. **A11y:** `aria-label`, `alt` matn, klaviatura navigatsiyasi, yetarli rang kontrasti.

---

## 11. Ishga tushirish

```bash
# ── Backend ──
mkdir server && cd server
npm init -y
npm i express mongoose bcryptjs jsonwebtoken zod cors helmet cookie-parser \
        express-rate-limit multer socket.io dotenv
npm i -D nodemon

# ── Frontend ──
cd ..
npm create vite@latest client -- --template react
cd client
npm i react-router-dom axios socket.io-client
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`server/.env` namunasi:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/elonlar
JWT_SECRET=kamida-32-belgili-uzun-tasodifiy-kalit
JWT_REFRESH_SECRET=boshqa-uzun-tasodifiy-kalit
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

---

## 12. 7 haftalik ish rejasi

| Hafta | Vazifa |
|---|---|
| 1 | Express skeleti, MongoDB ulanish, User/Category/Ad sxemalari, seed |
| 2 | Auth: register/login/JWT cookie, `protect` middleware, React AuthContext |
| 3 | E'lon CRUD + rasm yuklash (Multer) + egalik tekshiruvi |
| 4 | Filtr/qidiruv/paginatsiya + Home sahifasi + AdCard |
| 5 | AdDetail sahifasi + sevimlilar + "Mening e'lonlarim" + profil |
| 6 | Socket.io chat (backend + frontend) + suhbat roʻyxati |
| 7 | Xavfsizlik tekshiruvi, test, Lighthouse optimizatsiyasi, deploy |

**Deploy:** Frontend → Vercel/Netlify, Backend → Render/Railway, Maʼlumotlar bazasi → MongoDB Atlas, Rasmlar → Cloudinary/S3.
