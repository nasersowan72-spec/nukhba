# أكاديمية نُخبة — دليل الإطلاق

منصة دورات مدفوعة ثنائية اللغة (عربي/إنجليزي)، متعددة المدرّبين مع اقتسام الأرباح، مهيّأة للتحصيل من **ليبيا** عبر بوابة **Plutu** (بطاقات دولية بالدولار، وبطاقات ومحافظ ليبية بالدينار) مع **الحوالة المصرفية** بديلاً دائماً.

> هذا الملف مرجعك الكامل. اتبع الخطوات بالترتيب؛ مجموع الوقت نحو ساعة إلى ساعتين، دون احتساب مدة اعتماد حساب التاجر لدى Plutu.

---

## 1. بنية المنصة

```
المتصفح (React + Vite)  ──►  Vercel (استضافة الواجهة)
        │
        ├──►  Supabase Auth       تسجيل الدخول، Google، استعادة كلمة المرور
        ├──►  Supabase Postgres   البيانات + سياسات RLS تحمي كل جدول
        ├──►  Supabase Storage    إيصالات الحوالات (خاص) وأغلفة الدورات (عام)
        └──►  Edge Functions      create-payment ─► Plutu ─► plutu-return / plutu-callback
                                                     │
                                  التحقق من توقيع HMAC ثم تفعيل الدورة وتسجيل حصة المدرّب
```

**مبادئ الأمان المطبّقة:**

| الخطر | المعالجة |
|---|---|
| مشاهدة الفيديو دون شراء | روابط الفيديو في جدول `lesson_media` منفصل، لا يُقرأ إلا لمن اشترى أو للدروس المجانية |
| التلاعب بالسعر من المتصفح | المبلغ يُحسب على الخادم فقط (`course_price`)، والمتصفح لا يرسل أي مبلغ |
| تزوير إشعار الدفع | التحقق من توقيع HMAC-SHA256 بالمفتاح السري، ومطابقة المبلغ المدفوع مع الطلب |
| ترقية مستخدم نفسه إلى مدير | مشغّل `guard_profile` يمنع تغيير الدور ونسبة الأرباح إلا للمدير |
| نشر مدرّب لدورة دون مراجعة | مشغّل `guard_course` يحوّل «منشورة» إلى «قيد المراجعة» لغير المدير |
| تسريب المفتاح السري | مفاتيح Plutu ومفتاح `service_role` في أسرار الخادم فقط، ولا تظهر في الواجهة |
| تفعيل مزدوج للطلب | دالة `fulfill_order` متساوية الأثر (idempotent) |

---

## 2. ما يعمل الآن، وما القادم

**المرحلة الأولى (هذا الإصدار):**
الكتالوج والبحث والتصنيفات، صفحة الدورة، المشغّل (YouTube / Vimeo / Bunny / HLS / MP4) مع استئناف المشاهدة، الدروس المقفلة والمعاينات المجانية، تتبّع التقدّم، الشهادة ذات الرمز والتحقق العلني منها، التسجيل والدخول وGoogle واستعادة كلمة المرور، الدفع بأربع طرق، صفحة نتيجة الدفع، «دوراتي»، الحساب، الصفحات القانونية بلغتين، ولوحة إدارة لاعتماد الحوالات وضبط سعر الصرف ونسبة المدرّب.
قاعدة البيانات مكتملة لكل المراحل (الأدوار، الأرباح، الدفعات، التقييمات، النقاشات).

**المرحلة الثانية:** استوديو المدرّب (إنشاء الدورات والوحدات والدروس ورفع الأغلفة من الواجهة)، طابور مراجعة النشر، إدارة المدرّبين ونسبهم، تسجيل دفعات المدرّبين، لوحات الأرباح والتحليلات.

**المرحلة الثالثة:** كتابة التقييمات والنقاشات من الواجهة، شهادة PDF، رسائل بريدية، تحسينات SEO، وتدفّق سداد/ادفع لي المباشر برمز OTP.

> حتى صدور المرحلة الثانية تُضاف الدورات والدروس من **Table Editor** في لوحة Supabase (انظر القسم 6).

---

## 3. الحسابات المطلوبة

| الخدمة | الغرض | التكلفة المبدئية |
|---|---|---|
| [GitHub](https://github.com) | حفظ الكود وربطه بـ Vercel | مجاني |
| [Supabase](https://supabase.com) | قاعدة البيانات والمصادقة والتخزين والدوال | الخطة المجانية تكفي للبداية |
| [Vercel](https://vercel.com) | استضافة الموقع | مجاني للبداية |
| [Plutu](https://plutu.ly) | بوابة الدفع الليبية | حسب عقد التاجر |
| مزوّد نطاق | اسم موقعك | سنوي |
| مزوّد بريد SMTP (مثل Resend أو Brevo) | رسائل التفعيل واستعادة كلمة المرور | خطط مجانية متاحة |
| استضافة فيديو (Bunny Stream أو Vimeo) | بث الدروس بحماية النطاق | حسب الاستهلاك |

وعلى جهازك: **Node.js 18 أو أحدث**.

---

## 4. خطوات الإطلاق

### الخطوة 1 — تشغيل المشروع على جهازك

```bash
npm install
cp .env.example .env      # في ويندوز: copy .env.example .env
npm run dev               # يفتح على http://localhost:5173
```

ستظهر رسالة «أكمل إعداد المنصة» حتى تضيف مفاتيح Supabase في الخطوة التالية.

### الخطوة 2 — إنشاء مشروع Supabase

1. أنشئ مشروعاً جديداً، واختر منطقة قريبة من جمهورك (فرانكفورت `eu-central-1` مناسبة لليبيا وشمال أفريقيا).
2. من **Project Settings ← API** انسخ `Project URL` و`anon public key` إلى ملف `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SITE_URL=http://localhost:5173
VITE_SUPPORT_EMAIL=support@your-domain.com
VITE_PAYMENT_METHODS=bank_transfer
```

> لا تضع أبداً `service_role key` في ملف `.env` الخاص بالواجهة.

### الخطوة 3 — إنشاء قاعدة البيانات

افتح **SQL Editor** في Supabase، والصق محتوى الملف
`supabase/migrations/20260928000000_init.sql` كاملاً، ثم اضغط **Run**.

أو عبر سطر الأوامر:

```bash
npx supabase login
npx supabase link --project-ref xxxxx     # xxxxx من رابط مشروعك
npx supabase db push
```

### الخطوة 4 — اجعل حسابك مديراً

1. شغّل الموقع، وأنشئ حسابك من صفحة التسجيل.
2. في **SQL Editor** نفّذ (بعد وضع بريدك):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

3. سجّل الخروج ثم الدخول؛ سيظهر رابط «لوحة الإدارة».

### الخطوة 5 (اختيارية) — بيانات تجريبية

نفّذ `supabase/seed.sql` في SQL Editor لإضافة ثلاث دورات تجريبية (37 درساً) باسم حسابك.
**احذفها قبل الإطلاق** بالأمر المكتوب في أعلى الملف.

### الخطوة 6 — إعداد المصادقة والبريد

1. **Authentication ← URL Configuration:**
   - `Site URL`: رابط موقعك النهائي (مثل `https://your-domain.com`).
   - `Redirect URLs`: أضف `https://your-domain.com/**` و`http://localhost:5173/**`.
2. **البريد (إلزامي قبل الإطلاق):** خدمة البريد المدمجة في Supabase مخصّصة للتجربة وحدودها منخفضة جداً. اضبط SMTP خاصاً من **Authentication ← Emails ← SMTP Settings**، وعرّب قوالب الرسائل من القسم نفسه.
3. **الدخول بحساب Google (اختياري):** من **Authentication ← Providers ← Google** أدخل `Client ID` و`Client Secret` من Google Cloud Console، واجعل رابط العودة في Google:
   `https://xxxxx.supabase.co/auth/v1/callback`

### الخطوة 7 — بوابة الدفع Plutu

1. سجّل حساب تاجر في [plutu.ly](https://plutu.ly) وأكمل مستندات النشاط التجاري.
2. من لوحة Plutu احصل على: `API Key` و`Access Token` و`Secret Key`. ابدأ بمفاتيح **وضع الاختبار**.
3. اطلب من Plutu تفعيل البوابات التي تريدها:
   - `mpgs`: فيزا وماستركارد الدولية، **بالدولار** — هذه التي تستقبل من خارج ليبيا، وتفعيلها يتطلب موافقة المصرف.
   - `localbankcards`: البطاقات المصرفية الليبية، بالدينار.
   - `tlync`: صفحة T-Lync (سداد، ادفع لي، موبي كاش، تداول)، بالدينار.
4. انشر دوال الدفع واضبط الأسرار:

```bash
npx supabase secrets set \
  PLUTU_API_KEY=... \
  PLUTU_ACCESS_TOKEN=... \
  PLUTU_SECRET_KEY=... \
  SITE_URL=https://your-domain.com \
  PAYMENT_METHODS=mpgs,localbankcards,tlync

npx supabase functions deploy create-payment
npx supabase functions deploy plutu-return   --no-verify-jwt
npx supabase functions deploy plutu-callback --no-verify-jwt
```

> الخيار `--no-verify-jwt` ضروري للدالتين `plutu-return` و`plutu-callback` فقط، لأن Plutu لا يرسل رمز دخول Supabase؛ وحمايتهما تتم بالتحقق من توقيع HMAC.
> المتغيرات `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` متاحة تلقائياً داخل الدوال.

5. فعّل الطرق نفسها في الواجهة داخل `.env`:

```env
VITE_PAYMENT_METHODS=mpgs,localbankcards,tlync,bank_transfer
```

### الخطوة 8 — الحوالة المصرفية

من **لوحة الإدارة ← الإعدادات** اكتب بيانات حسابك المصرفي بالعربية والإنجليزية، واضبط **سعر صرف الدولار بالدينار**. المتعلّم يرفع الإيصال، ويظهر لك في تبويب «الحوالات» لتعتمده أو ترفضه.

### الخطوة 9 — النشر على Vercel

1. ارفع المشروع إلى مستودع GitHub خاص.
2. في Vercel: **Add New ← Project** واختر المستودع؛ سيتعرّف على Vite تلقائياً.
3. أضف متغيرات البيئة `VITE_*` نفسها (مع `VITE_SITE_URL` = نطاقك النهائي)، ثم **Deploy**.
4. من **Settings ← Domains** اربط نطاقك.
5. حدّث `Site URL` في Supabase وسرّ `SITE_URL` إلى النطاق النهائي.

### الخطوة 10 — اختبار قبل الإطلاق

- [ ] شراء بطاقة دولية في وضع اختبار Plutu ← تُفتح الدورة تلقائياً.
- [ ] إلغاء الدفع من صفحة Plutu ← تظهر «أُلغي الدفع».
- [ ] حوالة مصرفية ← اعتمادها من لوحة الإدارة ← تُفتح الدورة.
- [ ] حساب غير مشترك لا يستطيع تشغيل درس مقفل.
- [ ] إكمال دورة ← استلام الشهادة ← التحقق منها من `/verify`.
- [ ] استبدال مفاتيح الاختبار بمفاتيح الإنتاج، ثم عملية شراء حقيقية بمبلغ صغير.

---

## 5. تغيير الاسم والهوية

كل ما يخص الهوية في ملف واحد: **`src/config.js`**

```js
export const BRAND = {
  name:        { ar: "نُخبة", en: "Nukhba" },
  fullName:    { ar: "أكاديمية نُخبة", en: "Nukhba Academy" },
  tagline:     { ar: "حيث يتعلّم القادة من القادة", en: "Where leaders learn from leaders" },
  legalEntity: { ar: "...", en: "..." },   // الاسم المسجّل للشركة
  country:     { ar: "ليبيا", en: "Libya" },
};
```

ثم عدّل `<title>` ووصف الصفحة في `index.html`، والشعار في `public/favicon.svg`.
النصوص الظاهرة للمستخدم في `src/i18n/ar.js` و`src/i18n/en.js`، والألوان في `tailwind.config.js` و`src/styles.css`.

---

## 6. إضافة المحتوى (حتى صدور استوديو المدرّب)

من **Table Editor** في Supabase، بالترتيب:

1. **`courses`**: `slug` (بالإنجليزية وشرطات، مثل `data-analysis`)، `instructor_id` (معرّف المدرّب من `profiles`)، `title_ar`، `title_en`، `price_usd`، `category` (`ai` / `finance` / `leadership` / `general`)، `level`، واجعل `status` = `published`.
2. **`modules`**: `course_id`، `position` (0، 1، 2…)، `title_ar`، `title_en`.
3. **`lessons`**: `module_id`، `position`، `title_ar`، `duration_sec` (المدة بالثواني)، و`is_preview` = `true` للدرس المجاني.
4. **`lesson_media`**: `lesson_id`، و`video_url`، و`resources` بصيغة:
   `[{"name":"ملف التمارين","url":"https://...","type":"PDF","size":"2 MB"}]`

الإحصاءات (عدد الدروس، المدة، الطلاب، التقييم) تُحدَّث تلقائياً.

**السعر بالدينار:** يُحسب من سعر الصرف في الإعدادات، أو ضع سعراً ثابتاً في `price_lyd`.

**إضافة مدرّب:**

```sql
update public.profiles
set role = 'instructor', revenue_share = 70, headline = 'خبير تحليل البيانات', bio = '...'
where id = (select id from auth.users where email = 'instructor@example.com');
```

عند كل عملية بيع تُسجَّل حصة المدرّب تلقائياً في `earnings`، ويظهر رصيده في `instructor_balances`.

---

## 7. استضافة الفيديو

| الخيار | الحماية | التوصية |
|---|---|---|
| **Bunny Stream** | تقييد النطاق + روابط موقّعة، بث HLS متكيّف | الأفضل سعراً وحماية |
| **Vimeo** (خطة مدفوعة) | تقييد التضمين على نطاقك | ممتاز وسهل |
| YouTube «غير مدرج» | **لا حماية**؛ أي شخص يملك الرابط يشاهد | للمعاينات المجانية فقط |
| ملف MP4 مباشر | ضعيفة | للتجربة فقط |

الصق رابط التضمين أو رابط `.m3u8` في `lesson_media.video_url`، وفعّل تقييد النطاق على موقعك من لوحة مزوّد الفيديو.

---

## 8. الإدارة اليومية

- **اعتماد الحوالات:** لوحة الإدارة ← الحوالات.
- **سعر الصرف ونسبة المدرّب الافتراضية:** لوحة الإدارة ← الإعدادات. راجع سعر الصرف دورياً.
- **تسجيل دفعة لمدرّب** (إلى حين واجهة المرحلة الثانية):

```sql
insert into public.payouts (instructor_id, amount_usd, method, reference)
values ('<instructor uuid>', 500, 'bank', 'TRX-123');
```

- **مراجعة المبيعات:** جدول `orders` (الحالة `paid`)، والأرباح في `earnings`.

---

## 9. الجانب القانوني

قوالب الشروط والخصوصية والاسترجاع في `src/content/legal.js` بلغتين، وتُملأ تلقائياً من `src/config.js`.
هي **نقطة انطلاق وليست استشارة قانونية**؛ راجعها مع محامٍ مرخّص في ليبيا، وتأكّد من السجل التجاري ومتطلبات التجارة الإلكترونية وحماية البيانات في الدول التي تستهدفها.

---

## 10. هيكل الملفات

```
├── index.html, vite.config.js, tailwind.config.js, vercel.json, .env.example
├── public/favicon.svg
├── supabase/
│   ├── migrations/20260928000000_init.sql   الجداول + الدوال + RLS + التخزين
│   ├── seed.sql                              دورات تجريبية (اختياري)
│   └── functions/
│       ├── _shared/        http.ts · plutu.ts (التوقيع) · settle.ts (تسوية الطلب)
│       ├── create-payment/ بدء الدفع
│       ├── plutu-return/   عودة العميل من صفحة الدفع
│       └── plutu-callback/ إشعار T-Lync من خادم إلى خادم
└── src/
    ├── config.js            الهوية وطرق الدفع
    ├── i18n/                العربية والإنجليزية
    ├── lib/                 supabase · api · format · video
    ├── auth/                الجلسة وحماية المسارات
    ├── components/          الإطار والبطاقات والمشغّل
    ├── content/legal.js     النصوص القانونية
    └── pages/               الرئيسية، الدورة، التعلّم، الدفع، الحساب، الإدارة…
```

---

## 11. حلّ المشكلات

| العَرَض | السبب المرجّح |
|---|---|
| «أكمل إعداد المنصة» | مفاتيح `VITE_SUPABASE_*` غير موجودة؛ أعد تشغيل `npm run dev` بعد تعديل `.env` |
| لا تصل رسائل التفعيل | لم يُضبط SMTP خاص (الخطوة 6) |
| «تعذّر بدء الدفع» | أسرار Plutu ناقصة، أو البوابة غير مفعّلة في حسابك، أو `PAYMENT_METHODS` لا يتضمنها. راجع **Edge Functions ← Logs** |
| الدفع نجح والدورة لم تُفتح | تأكّد من نشر `plutu-return` و`plutu-callback` مع `--no-verify-jwt`، ومن صحة `PLUTU_SECRET_KEY` |
| الدخول بـ Google يعود لصفحة خاطئة | أضف نطاقك إلى `Redirect URLs` (الخطوة 6) |
| صفحة 404 عند تحديث رابط داخلي | تأكّد من وجود `vercel.json` في جذر المشروع |
