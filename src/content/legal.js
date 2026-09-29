/* ══════════════════════════════════════════════════════════════════
   LEGAL TEMPLATES — review with a qualified lawyer before launch.
   Placeholders filled automatically from src/config.js:
   {entity} {brand} {email} {country}
   ══════════════════════════════════════════════════════════════════ */
const UPDATED = "2026-09-28";

export const LEGAL = {
  terms: {
    ar: {
      title: "شروط الاستخدام", updated: UPDATED,
      sections: [
        { h: "1. القبول", p: ["باستخدامك منصة {brand} المملوكة لـ {entity} فإنك توافق على هذه الشروط. إن لم توافق عليها فلا تستخدم المنصة."] },
        { h: "2. الحساب", p: ["أنت مسؤول عن صحة بياناتك وسرية كلمة المرور وكل نشاط يتم عبر حسابك. الحساب شخصي ولا يجوز مشاركته أو بيعه."] },
        { h: "3. ترخيص الاستخدام", p: ["عند شراء دورة تحصل على ترخيص شخصي غير حصري وغير قابل للتحويل لمشاهدة محتواها لأغراض تعلّمك. يُمنع تنزيل المحتوى أو تسجيله أو إعادة نشره أو بيعه."] },
        { h: "4. الأسعار والدفع", p: ["تُعرض الأسعار بالدولار الأمريكي، ويمكن الدفع بالدينار الليبي بسعر الصرف المعلن وقت الشراء. تتم المعالجة عبر بوابات دفع مرخّصة، ولا نخزّن بيانات البطاقات.", "في الحوالة المصرفية تُفعَّل الدورة بعد التحقق من الإيصال."] },
        { h: "5. محتوى المدرّبين", p: ["يضمن كل مدرّب امتلاكه حقوق المحتوى الذي ينشره. يحق للمنصة مراجعة أي محتوى أو إيقافه إن خالف هذه الشروط أو القانون."] },
        { h: "6. السلوك", p: ["يُمنع نشر محتوى مسيء أو مخالف للقانون في النقاشات والتقييمات، ويُمنع محاولة اختراق المنصة أو تجاوز حماية المحتوى."] },
        { h: "7. إيقاف الحساب", p: ["يجوز لنا إيقاف أي حساب يخالف هذه الشروط، مع إشعار صاحبه متى أمكن."] },
        { h: "8. حدود المسؤولية", p: ["يُقدَّم المحتوى لأغراض تعليمية، ولا يُعد استشارة مالية أو قانونية أو مهنية. لا نضمن نتائج محددة من استخدام المعرفة المكتسبة."] },
        { h: "9. القانون الحاكم", p: ["تخضع هذه الشروط لقوانين {country}، وتختص محاكمها بالنظر في أي نزاع."] },
        { h: "10. التواصل", p: ["لأي استفسار راسلنا على {email}."] },
      ],
    },
    en: {
      title: "Terms of use", updated: UPDATED,
      sections: [
        { h: "1. Acceptance", p: ["By using {brand}, operated by {entity}, you agree to these terms. If you do not agree, do not use the platform."] },
        { h: "2. Your account", p: ["You are responsible for accurate details, keeping your password secret, and all activity on your account. Accounts are personal and may not be shared or sold."] },
        { h: "3. License", p: ["Buying a course grants you a personal, non-exclusive, non-transferable license to watch its content for your own learning. Downloading, recording, republishing or reselling content is prohibited."] },
        { h: "4. Prices and payment", p: ["Prices are shown in US dollars. You may pay in Libyan dinars at the rate published at the time of purchase. Payments are processed by licensed gateways; we do not store card details.", "For bank transfers, the course unlocks after the receipt is verified."] },
        { h: "5. Instructor content", p: ["Each instructor warrants they own the rights to the content they publish. We may review or remove content that breaches these terms or the law."] },
        { h: "6. Conduct", p: ["Do not post abusive or unlawful content in discussions or reviews, and do not attempt to breach the platform or bypass content protection."] },
        { h: "7. Suspension", p: ["We may suspend accounts that breach these terms, notifying the owner where possible."] },
        { h: "8. Limitation of liability", p: ["Content is provided for education and is not financial, legal or professional advice. We do not guarantee specific outcomes from applying what you learn."] },
        { h: "9. Governing law", p: ["These terms are governed by the laws of {country}, whose courts have jurisdiction over any dispute."] },
        { h: "10. Contact", p: ["Questions? Email {email}."] },
      ],
    },
  },
  privacy: {
    ar: {
      title: "سياسة الخصوصية", updated: UPDATED,
      sections: [
        { h: "1. البيانات التي نجمعها", p: ["الاسم والبريد الإلكتروني عند التسجيل، وسجل الدورات والتقدّم فيها، وبيانات الطلبات (المبلغ والطريقة ورقم الفاتورة)، وإيصالات الحوالات التي ترفعها، ورقم الهاتف عند الدفع بالمحفظة."] },
        { h: "2. البيانات التي لا نجمعها", p: ["لا نستلم أرقام البطاقات ولا نخزّنها؛ تُدخلها مباشرة في صفحة بوابة الدفع."] },
        { h: "3. كيف نستخدمها", p: ["لتشغيل حسابك وتفعيل الدورات، وإصدار الشهادات، ومعالجة المدفوعات واحتساب مستحقات المدرّبين، والتواصل معك بشأن حسابك."] },
        { h: "4. مع من نشاركها", p: ["مزوّدو الخدمة الضروريون فقط: مزوّد الاستضافة وقاعدة البيانات (Supabase)، وبوابة الدفع (Plutu) وشركاؤها المصرفيون، ومزوّد استضافة الفيديو. قد تُعالج بعض البيانات على خوادم خارج {country}.", "يرى المدرّب أسماء المسجّلين في دوراته فقط. لا نبيع بياناتك لأي طرف."] },
        { h: "5. مدة الاحتفاظ", p: ["نحتفظ ببيانات الحساب ما دام قائماً، وبسجلات المدفوعات المدة التي يفرضها القانون."] },
        { h: "6. حقوقك", p: ["يمكنك طلب نسخة من بياناتك أو تصحيحها أو حذف حسابك عبر مراسلة {email}."] },
        { h: "7. التخزين المحلي", p: ["نستخدم تخزين المتصفح لحفظ جلسة الدخول واللغة المختارة فقط، ولا نستخدم ملفات تتبّع إعلانية."] },
        { h: "8. القُصّر", p: ["المنصة موجّهة لمن بلغ 18 عاماً، أو لمن هم دونها بموافقة وليّ الأمر وإشرافه."] },
        { h: "9. التواصل", p: ["لأي سؤال عن الخصوصية راسلنا على {email}."] },
      ],
    },
    en: {
      title: "Privacy policy", updated: UPDATED,
      sections: [
        { h: "1. What we collect", p: ["Your name and email when you sign up, your enrollments and progress, order details (amount, method, invoice number), transfer receipts you upload, and your phone number when you pay by wallet."] },
        { h: "2. What we do not collect", p: ["We never receive or store card numbers; you enter them directly on the payment gateway's page."] },
        { h: "3. How we use it", p: ["To run your account, unlock courses, issue certificates, process payments, calculate instructor earnings, and contact you about your account."] },
        { h: "4. Who we share it with", p: ["Only essential service providers: our hosting and database provider (Supabase), the payment gateway (Plutu) and its banking partners, and our video host. Some data may be processed on servers outside {country}.", "Instructors see only the names of learners in their own courses. We never sell your data."] },
        { h: "5. Retention", p: ["We keep account data while your account exists, and payment records for as long as the law requires."] },
        { h: "6. Your rights", p: ["You can request a copy of your data, a correction, or deletion of your account by emailing {email}."] },
        { h: "7. Local storage", p: ["We use browser storage only to keep you signed in and remember your language. We do not use advertising trackers."] },
        { h: "8. Minors", p: ["The platform is intended for people aged 18 or over, or younger learners with a guardian's consent and supervision."] },
        { h: "9. Contact", p: ["Privacy questions? Email {email}."] },
      ],
    },
  },
  refund: {
    ar: {
      title: "سياسة الاسترجاع", updated: UPDATED,
      sections: [
        { h: "1. متى يحق لك الاسترجاع", p: ["يمكنك طلب استرجاع كامل المبلغ خلال 14 يوماً من الشراء، بشرط ألا تكون قد أكملت أكثر من ربع دروس الدورة، وألا تكون قد استلمت شهادتها."] },
        { h: "2. كيف تطلب الاسترجاع", p: ["راسلنا على {email} من البريد المسجّل في حسابك، مع رقم الفاتورة الظاهر في صفحة نتيجة الدفع."] },
        { h: "3. طريقة الإرجاع", p: ["نعيد المبلغ إلى وسيلة الدفع الأصلية خلال 10 أيام عمل من الموافقة. في الحوالات المصرفية نعيده إلى الحساب المرسِل، وقد يخصم المصرف رسومه.", "يُحسب المبلغ المسترد بعملة الدفع الأصلية."] },
        { h: "4. ما بعد الاسترجاع", p: ["يُلغى وصولك إلى الدورة فور إتمام الاسترجاع."] },
      ],
    },
    en: {
      title: "Refund policy", updated: UPDATED,
      sections: [
        { h: "1. When you can get a refund", p: ["You can request a full refund within 14 days of purchase, provided you have completed no more than a quarter of the course's lessons and have not claimed its certificate."] },
        { h: "2. How to request one", p: ["Email {email} from the address registered on your account, including the invoice number shown on the payment result page."] },
        { h: "3. How you are refunded", p: ["We return the amount to the original payment method within 10 business days of approval. Bank transfers are returned to the sending account; the bank may deduct its fees.", "Refunds are made in the original payment currency."] },
        { h: "4. After a refund", p: ["Access to the course ends once the refund is completed."] },
      ],
    },
  },
};
