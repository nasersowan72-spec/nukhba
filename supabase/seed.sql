-- ═══════════════════════════════════════════════════════════════
--  DEMO CONTENT — for trying the platform only. Delete before launch:
--    delete from public.courses where slug in ('ai-mastery', 'fin-eng', 'exec-product');
--  Run AFTER you have signed up and made your account admin (README step 4).
--  The demo courses are assigned to the first admin account.
-- ═══════════════════════════════════════════════════════════════
do $$
declare
  v_admin uuid; v_course uuid; v_module uuid; v_lesson uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' order by created_at limit 1;
  if v_admin is null then
    raise exception 'No admin account yet. Sign up on the site, then run: update public.profiles set role = ''admin'' where id = (select id from auth.users where email = ''you@example.com'');';
  end if;

  -- إتقان الذكاء الاصطناعي وتعلّم الآلة
  insert into public.courses (slug, instructor_id, status, category, level, title_ar, subtitle_ar, description_ar, outcomes_ar, theme, price_usd, compare_price_usd, featured, published_at)
  values ('ai-mastery', v_admin, 'published', 'ai', 'advanced', 'إتقان الذكاء الاصطناعي وتعلّم الآلة', 'من الحدس الرياضي إلى بناء النماذج التوليدية ونشرها في بيئات الإنتاج', 'رحلة احترافية مكثّفة تنقلك من فهم الحدس الرياضي وراء الخوارزميات إلى تصميم نماذج تعلّم عميق وتدريبها ونشرها على نطاق واسع.
لمن صُمّمت هذه الدورة؟
• المهندسون الساعون إلى التخصص في الذكاء الاصطناعي.
• قادة التقنية الذين يبنون فرق بيانات عالية الأداء.
• الباحثون الراغبون في نقل أفكارهم إلى الإنتاج.
المعيار هنا ليس أن تفهم النموذج، بل أن تبنيه وتشغّله وتحاسبه.', array['بناء شبكات عصبية عميقة من الصفر باستخدام PyTorch', 'فهم معمارية المحوّلات وآلية الانتباه فهماً رياضياً', 'تصميم أنظمة RAG وتقييمها في بيئة إنتاجية', 'أتمتة دورة حياة النماذج عبر ممارسات MLOps']::text[], 'teal', 349, 590, true, now())
  returning id into v_course;
  insert into public.modules (course_id, position, title_ar) values (v_course, 0, 'الأسس الرياضية والحدس الهندسي') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'مرحباً بك: خريطة الطريق نحو الإتقان', 'جولة شاملة على مسار الدورة والمشروع الختامي ومنهجية التقييم التي تنقلك من الفهم إلى الإتقان.', 374, true) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'الجبر الخطي بعين مهندس التعلّم الآلي', 'المتجهات والمصفوفات والتحويلات الخطية بوصفها لغة النماذج، مع أمثلة تطبيقية مباشرة.', 1120, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'التفاضل والتحسين: من الانحدار التدرّجي إلى Adam', 'كيف تتعلّم النماذج فعلاً؟ تفكيك خوارزميات التحسين ومقارنة سلوكها على أسطح خسارة حقيقية.', 1265, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 3, 'الاحتمالات ونظرية المعلومات', 'الإنتروبيا والتباعد وتقدير الإمكان الأعظم: الأساس الإحصائي للنماذج التوليدية.', 992, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 1, 'التعلّم العميق باستخدام PyTorch') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'الموترات والاشتقاق التلقائي', 'بناء الرسوم الحسابية وفهم آلية الانتشار العكسي خطوة بخطوة.', 1152, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'بناء شبكة عصبية من الصفر وتدريبها', 'من الطبقات الخطية إلى حلقة التدريب الكاملة، مع أفضل ممارسات التهيئة والمراقبة.', 1488, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'التنظيم ومكافحة فرط التخصيص', 'Dropout والتطبيع الدفعي والتوقف المبكر. يُقدَّم هذا الدرس عبر بث HLS متكيّف الجودة.', 1040, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  insert into public.modules (course_id, position, title_ar) values (v_course, 2, 'المحوّلات والنماذج اللغوية الكبيرة') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'آلية الانتباه: الحدس والرياضيات', 'لماذا غيّر الانتباه قواعد اللعبة؟ اشتقاق آلية الانتباه النقطي المُقيَّس وتصوّرها بصرياً.', 1335, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'معمارية المحوّل سطراً بسطر', 'تنفيذ محوّل كامل: الترميز الموضعي والانتباه متعدد الرؤوس والكتل المتبقية.', 1650, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'الضبط الدقيق الفعّال وتقنيات المواءمة', 'LoRA والتكميم وتعليم النماذج اتباع التعليمات بتكلفة حوسبية محدودة.', 1384, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 3, 'من النموذج إلى الإنتاج') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'أنظمة الاسترجاع المعزّز المتقدمة', 'التقطيع الذكي والتضمينات وإعادة الترتيب وتقييم جودة الإجابات في بيئة إنتاجية.', 1510, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'التقييم والمراقبة وأمن النماذج', 'مقاييس الجودة واكتشاف الانجراف والحماية من حقن الأوامر وتسريب البيانات.', 1185, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'المشروع الختامي: منصة ذكاء اصطناعي متكاملة', 'تصميم منصة كاملة من الفكرة إلى النشر، وعرضها أمام لجنة تقييم من الخبراء.', 1880, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');

  -- الهندسة المالية والاستثمار الاحترافي
  insert into public.courses (slug, instructor_id, status, category, level, title_ar, subtitle_ar, description_ar, outcomes_ar, theme, price_usd, compare_price_usd, featured, published_at)
  values ('fin-eng', v_admin, 'published', 'finance', 'intermediate', 'الهندسة المالية والاستثمار الاحترافي', 'النمذجة الكمية وتقييم الأصول وبناء المحافظ بمنهجية صناديق الاستثمار الكبرى', 'تعلّم كيف يفكر مديرو المحافظ المؤسسية: من تقييم الشركات وبناء النماذج المالية إلى تسعير المشتقات وإدارة المخاطر وبناء محافظ متوازنة.
منهجية الدورة
• مفهوم واحد في كل درس، يليه تطبيق عملي على بيانات حقيقية.
• نماذج Excel وPython قابلة لإعادة الاستخدام في عملك.
• مشروع ختامي أمام لجنة استثمار افتراضية.', array['بناء نموذج تدفقات نقدية مخصومة بمعايير بنوك الاستثمار', 'تسعير الخيارات والعقود الآجلة وفهم حساسياتها', 'قياس المخاطر عبر القيمة المعرّضة للخطر واختبارات الضغط', 'تصميم محفظة متنوعة على الحد الكفء']::text[], 'gold', 299, 480, false, now())
  returning id into v_course;
  insert into public.modules (course_id, position, title_ar) values (v_course, 0, 'أسس التمويل الحديث') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'لماذا تخسر معظم المحافظ؟ مقدمة الدورة', 'الأخطاء السلوكية والهيكلية الأكثر شيوعاً، وكيف تبني الدورة منهجيتك الاستثمارية المؤسسية.', 422, true) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'القيمة الزمنية للنقود وخصم التدفقات', 'الفائدة المركبة والقيمة الحالية والمستقبلية ومعدلات الخصم في القرارات الواقعية.', 1105, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'قراءة القوائم المالية بعين المستثمر المؤسسي', 'ما وراء الأرقام: جودة الأرباح والتدفق النقدي الحر والإشارات التحذيرية المبكرة.', 1360, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 1, 'التقييم والنمذجة المالية') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'نموذج التدفقات النقدية المخصومة خطوة بخطوة', 'بناء نموذج DCF احترافي وتقدير المتوسط المرجّح لتكلفة رأس المال والقيمة النهائية.', 1575, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'التقييم النسبي ومضاعفات السوق', 'متى تثق بالمضاعفات ومتى تضللك، وكيف تختار مجموعة المقارنة الصحيحة.', 1070, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'بناء نموذج مالي متكامل من الصفر', 'ربط القوائم الثلاث وبناء سيناريوهات وحساسيات تصمد أمام لجنة الاستثمار.', 1775, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 2, 'المشتقات وإدارة المخاطر') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'الخيارات والعقود الآجلة: الحدس قبل المعادلات', 'مخططات العائد والتحوط والمضاربة بلغة بسيطة قبل الدخول في الرياضيات.', 1270, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'نموذج بلاك-شولز وتسعير الخيارات', 'اشتقاق النموذج وفهم افتراضاته ومقاييس الحساسية اليونانية وحدود تطبيقه.', 1470, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'القيمة المعرّضة للخطر واختبارات الضغط', 'ثلاث طرق لحساب VaR، وتصميم سيناريوهات ضغط تكشف هشاشة المحفظة.', 1195, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 3, 'بناء المحافظ والاستثمار المنهجي') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'نظرية المحفظة الحديثة والحد الكفء', 'التنويع الرياضي وبناء الحد الكفء عملياً وحدود النظرية في الأسواق الحقيقية.', 1220, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'الاستثمار العاملي والاستراتيجيات الكمية', 'عوامل القيمة والزخم والجودة، وكيف تختبر استراتيجية كمية دون خداع نفسك.', 1425, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'المشروع الختامي: لجنة استثمار افتراضية', 'صياغة أطروحة استثمارية متكاملة والدفاع عنها أمام لجنة من المحترفين.', 1690, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4');

  -- القيادة التنفيذية للمنتجات
  insert into public.courses (slug, instructor_id, status, category, level, title_ar, subtitle_ar, description_ar, outcomes_ar, theme, price_usd, compare_price_usd, featured, published_at)
  values ('exec-product', v_admin, 'published', 'leadership', 'executive', 'القيادة التنفيذية للمنتجات', 'كيف يصوغ قادة المنتجات الرؤية، ويحسمون الأولويات، ويبنون فرقاً عالية الأداء', 'برنامج تنفيذي مكثّف لمن ينتقل من إدارة المنتج إلى قيادة منظومة منتجات كاملة: الرؤية والاستراتيجية، واتخاذ القرار تحت الغموض، ومواءمة مجالس الإدارة، وبناء ثقافة فرق استثنائية.
ما الذي يميّز البرنامج؟
• دراسات حالة من شركات تقنية عالمية وإقليمية.
• أطر عمل جاهزة للتطبيق من الأسبوع الأول.
• مشروع ختامي بمحاكاة عرض أمام مجلس إدارة.', array['صياغة رؤية منتج واستراتيجية قابلة للقياس', 'حسم الأولويات بأطر واضحة تحت الغموض', 'قيادة أصحاب المصلحة ومجالس الإدارة بثقة', 'بناء فرق منتج عالية الأداء وثقافة مساءلة']::text[], 'violet', 399, 650, false, now())
  returning id into v_course;
  insert into public.modules (course_id, position, title_ar) values (v_course, 0, 'عقلية قائد المنتج') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'من مدير منتج إلى قائد تنفيذي', 'التحول الحقيقي في المسؤوليات والعقلية، وما الذي يتوقعه منك الرئيس التنفيذي.', 495, true) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'صياغة رؤية المنتج واستراتيجيته', 'من بيان رؤية ملهم إلى استراتيجية قابلة للتنفيذ والقياس.', 1230, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'خرائط الفرص وتحديد الرهانات الكبرى', 'كيف تختار الرهانات التي تستحق مواردك، وتقول «لا» لكل ما عداها.', 1125, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 1, 'الاكتشاف واتخاذ القرار') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'الاكتشاف المستمر ومقابلات العملاء', 'بناء عادة اكتشاف أسبوعية تمنع فريقك من بناء ما لا يحتاجه أحد.', 1330, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'أطر تحديد الأولويات تحت الغموض', 'RICE وتكلفة التأخير والرهانات غير المتماثلة: متى تستخدم كلاً منها.', 1180, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'التجارب وقياس الأثر بالبيانات', 'تصميم تجارب موثوقة وقراءة نتائجها دون الوقوع في فخاخ الإحصاء.', 1285, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 2, 'التنفيذ والمواءمة التنظيمية') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'أهداف OKRs التي تعمل فعلاً', 'لماذا تفشل معظم تطبيقات OKRs، وكيف تصمم أهدافاً تحرّك السلوك.', 1055, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'إدارة أصحاب المصلحة ومجلس الإدارة', 'بناء الثقة والتأثير دون سلطة مباشرة، وإدارة الاجتماعات عالية المخاطر.', 1445, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'خرائط الطريق المبنية على النتائج', 'التحول من قوائم الميزات إلى خرائط طريق تتمحور حول المشكلات والنتائج.', 1010, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4');
  insert into public.modules (course_id, position, title_ar) values (v_course, 3, 'بناء فرق عالية الأداء') returning id into v_module;
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 0, 'التوظيف وتصميم الهياكل التنظيمية', 'متى تبني فريقاً مستقلاً، وكيف توظف قادة يفوقونك في مجالاتهم.', 1255, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 1, 'ثقافة المساءلة والأمان النفسي', 'المعادلة الصعبة بين المعايير العالية والبيئة الآمنة للتجريب.', 1100, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  insert into public.lessons (module_id, course_id, position, title_ar, summary_ar, duration_sec, is_preview) values (v_module, v_course, 2, 'المشروع الختامي: عرض استراتيجي أمام مجلس الإدارة', 'إعداد عرض استراتيجي متكامل والدفاع عنه أمام مجلس إدارة افتراضي.', 1600, false) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, course_id, video_url) values (v_lesson, v_course, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
end $$;
