# إعداد Google Apps Script الخاص بالعجلة

هذا التكامل منفصل تمامًا عن Apps Script الخاص بفورمات الموقع الأخرى.

1. افتح Google Sheet المخصص للعجلة (معرّفه موجود بالفعل في السكربت).
2. افتح **Extensions → Apps Script** والصق محتوى `scripts/wheel-apps-script.gs`.
3. السكربت يستخدم تبويب `Wheel Claims` إن وُجد، وإلا يستخدم أول تبويب موجود في الشيت.
4. اختر **Deploy → New deployment → Web app**، وشغّله باسمك واسمح بالوصول لـ **Anyone**.
5. الكود يدعم التشغيل من سيرفر Node ومن استضافة Angular static مثل Hostinger. في الوضع static تُرسل العجلة طلب `spin` ثم `claim` مباشرة إلى هذا الـ Web App.
6. من **Project Settings → Script properties** أضف الخاصية `WHEEL_API_SECRET`. يجب أن تكون نفس قيمة الملف `server/data/wheel-secret.txt` على سيرفر Node. السيرفر يرسل توقيع HMAC للـ claim بدل إرسال السر نفسه.
7. نتيجة `spin` أصبحت تصدر من Apps Script نفسه في كل البيئات؛ لا تعتمد على نتيجة عشوائية من المتصفح.
8. رابط نشر العجلة الحالي مربوط بالفعل في السيرفر. ويمكن تغييره لاحقًا من متغير البيئة بدون تعديل الكود:

   `WHEEL_APPS_SCRIPT_ENDPOINT=https://script.google.com/macros/s/AKfycbyrF6S-pyZys6aKo75ExPWxXCm9F-zIRKr_t-IvV7gyeCGKIBJ-nnISHMlyaRSNk4_r/exec`

9. بعد لصق النسخة الجديدة اضغط **Deploy → Manage deployments → Edit → New version → Deploy**، ثم أعد نشر نسخة الموقع من Hostinger.

عند تكرار رقم واتساب، يقرأ السكربت الهدية السابقة من عمود «الهدية» في الشيت ويرجعها للموقع. لو عدّلت الهدية في الشيت، ستظهر القيمة المعدّلة بعد محاولة التسجيل بنفس الرقم.

السكربت ينسّق عمود رقم الواتساب كنص قبل الكتابة، لذلك يبقى الرقم مثل `01098221988` بالصفر الأول.
