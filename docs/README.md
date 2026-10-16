# ProWeb — Loyiha Yoʻriqnomalari

Ushbu papkada ikki loyiha uchun toʻliq, bosqichma-bosqich qoʻllanmalar joylashgan.

| # | Loyiha | Stack | Fayl |
|---|---|---|---|
| 1 | **Kichik Onlayn Doʻkon** | Next.js 14 + TypeScript + Tailwind + Prisma + PostgreSQL | [`01-onlayn-dokon-yoriqnomasi.md`](./01-onlayn-dokon-yoriqnomasi.md) |
| 2 | **E'lonlar Paneli (Platforma)** | React (Vite) + Express + MongoDB + JWT + Socket.io | [`02-elonlar-paneli-yoriqnomasi.md`](./02-elonlar-paneli-yoriqnomasi.md) |

---

## Qisqacha mazmun

### 1. Onlayn Doʻkon
- Mahsulotlar katalogi (filtr, qidiruv, kategoriya)
- Product Details sahifasi (SEO bilan)
- Savatcha — `localStorage` + React Context (`useReducer`)
- Checkout forma (Zod validatsiya, **narx serverda hisoblanadi**)
- Admin panel — JWT cookie bilan himoyalangan CRUD
- Prisma sxema: `Category`, `Product`, `User`, `Order`, `OrderItem`

### 2. E'lonlar Paneli
- Roʻyxatdan oʻtish / kirish (JWT access + refresh, httpOnly cookie)
- E'lon joylash, tahrirlash, oʻchirish (Multer bilan rasm)
- Kategoriya / hudud / narx boʻyicha filtr + toʻliq matnli qidiruv
- Egasi bilan ichki chat (Socket.io)
- Mongoose sxemalar: `User`, `Category`, `Ad`, `Conversation`, `Message`

---

## Umumiy qoidalar (ikkala loyihada ham)

1. **Serverga hech qachon ishonmaydi** — har bir maʼlumot `Zod` bilan tekshiriladi.
2. **Narxni faqat server hisoblaydi.**
3. **Parol faqat `bcrypt` hash bilan.**
4. **Token faqat `httpOnly` + `secure` + `sameSite` cookie'da.**
5. **Foydalanuvchi faqat oʻz maʼlumotini oʻzgartira oladi** (egalik tekshiruvi).
6. **`.env` fayllar git'ga tushmasin.**
