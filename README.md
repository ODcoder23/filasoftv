# FilasofTV

Anime, drama, serial va kinolarni oʻzbek tilida tomosha qilish uchun **Telegram Mini App** dizayni.
Faqat frontend: backend ulanmagan, barcha maʼlumotlar demo rejimda brauzerda saqlanadi.

**Jonli demo:** https://odcoder23.github.io/filasoftv/

## Ekranlar

| Boʻlim | Ichida |
|---|---|
| Bosh sahifa | Balans kartasi, katalog (kategoriyalar, qidiruv, filtrlar), poster setkasi |
| Qidirish | Kategoriya + nom boʻyicha qidiruv (`yo'li` va `yoʻli` bir xil topiladi) |
| Film sahifasi | Muqova, qismlar karuseli, posterlar, reyting, janrlar, maʼlumotlar jadvali, saqlash |
| Toʻlov va obuna | 4 ta tarif (Anime / Drama / Kino / Barchasi) × 3 muddat, 2 bosqichli tasdiqlash |
| Hisobni toʻldirish | Summa, tayyor summalar, aniq summa + 30 daqiqalik taymer, karta raqamini nusxalash |
| Bonus coinlar | Bonus kod, kunlik bonus, doʻstlarni taklif qilish |
| Doʻstga sovgʻa, Donat | Oltin (gold) mavzudagi toʻlov ekranlari |
| Sozlamalar | Profil, telefon raqami, til (Oʻzbekcha / Русский), xizmatlar |
| Moliya tarixi, Kutubxona | Tranzaksiyalar, saqlangan va koʻrilgan filmlar |

## Demo rejim qanday ishlaydi

Backend yoʻq, shuning uchun:

- **Hisobni toʻldirish** → "Toʻladim" bosilgach ~1.5 soniyada balans avtomatik toʻldiriladi.
- **Tarif sotib olish** balansdan yechiladi, obuna 30 × oy kunga yoqiladi, har oy uchun +100 coin.
- **Bonus kod:** `FILASOV` bilan boshlanuvchi istalgan kod (masalan `FILASOV2026`) +50 coin beradi.
- Maʼlumotlar `localStorage`da saqlanadi. Tozalash: yuqoridagi **⋮ → Demo maʼlumotlarni tozalash**.

## Texnologiyalar

- Toza HTML + CSS + JavaScript, **build bosqichi yoʻq**
- [Preact](https://preactjs.com) + [htm](https://github.com/developit/htm) (lokal, `assets/js/vendor/`)
- Inter shrifti lokal (`assets/fonts/`), tashqi CDN kerak emas
- Telegram WebApp SDK faqat ilova Telegram ichida ochilganda yuklanadi

## Tuzilma

```
index.html
assets/
  css/app.css          dizayn tokenlari va barcha uslublar
  js/data.js           katalog, narxlar, tarjimalar (uz / ru)
  js/icons.js          SVG ikonkalar
  js/app.js            ilova: holat, navigatsiya, ekranlar
  js/vendor/           htm + preact
  fonts/               Inter (latin, kirill)
  img/favicon.svg
```

## Lokal ishga tushirish

`index.html` ni brauzerda ochish kifoya. Yoki lokal server:

```bash
python -m http.server 5173
# http://localhost:5173
```

## Telegram botga ulash

1. [@BotFather](https://t.me/BotFather) → botingiz → **Bot Settings → Configure Mini App** (yoki Menu Button).
2. URL sifatida `https://odcoder23.github.io/filasoftv/` ni kiriting.
3. Telegram ichida ilova oʻz sarlavhasini yashiradi, Telegram foydalanuvchi nomi va rasmini oladi,
   "Orqaga" tugmasi va haptik javoblar ishlaydi.
