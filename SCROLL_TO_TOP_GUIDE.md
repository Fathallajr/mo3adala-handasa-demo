# دليل التمرير إلى الأعلى

## نظرة عامة
تم إضافة وظيفة التمرير إلى الأعلى (Scroll to Top) لضمان أن تبدأ كل صفحة جديدة من الأعلى وليس من آخر موضع التمرير.

## الميزات المضافة

### 1. التمرير التلقائي عند تغيير الصفحة
- **الملف**: `src/app/app.component.ts`
- **الوظيفة**: يتم التمرير إلى الأعلى تلقائياً عند الانتقال بين الصفحات
- **التطبيق**: على جميع الصفحات في التطبيق

### 2. التمرير عند تحميل الصفحة لأول مرة
- **الملف**: `src/app/app.component.ts`
- **الوظيفة**: يتم التمرير إلى الأعلى عند تحميل الصفحة لأول مرة
- **التطبيق**: عند فتح الموقع لأول مرة

### 3. التمرير عند إغلاق القوائم
- **الملف**: `src/app/shared/components/navbar/navbar.component.ts`
- **الوظائف**:
  - `closeMobileMenu()` - عند إغلاق القائمة المحمولة
  - `closeNewsDropdown()` - عند إغلاق قائمة الأخبار
  - `closeRequirementsDropdown()` - عند إغلاق قائمة الشروط
  - `closeMobileNewsDropdown()` - عند إغلاق قائمة الأخبار المحمولة
  - `closeMobileRequirementsDropdown()` - عند إغلاق قائمة الشروط المحمولة

### 4. التمرير عند الضغط على "الرئيسية"
- **الملف**: `src/app/shared/components/footer/footer.component.ts`
- **الوظيفة**: يتم التمرير إلى الأعلى عند الضغط على رابط "الرئيسية" في Footer

## كيفية العمل

### 1. استخدام ViewportScroller
```typescript
import { ViewportScroller } from '@angular/common';

constructor(private viewportScroller: ViewportScroller) {}

scrollToTop() {
  // التمرير إلى الأعلى بسلاسة
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  
  // استخدام ViewportScroller كبديل
  this.viewportScroller.scrollToPosition([0, 0]);
}
```

### 2. الاستماع لتغيير الصفحة
```typescript
this.router.events
  .pipe(filter(event => event instanceof NavigationEnd))
  .subscribe((event: NavigationEnd) => {
    this.currentRoute = event.url;
    // التمرير إلى الأعلى عند تغيير الصفحة
    this.scrollToTop();
  });
```

### 3. التمرير عند تحميل الصفحة
```typescript
ngOnInit() {
  // التمرير إلى الأعلى عند تحميل الصفحة لأول مرة
  this.scrollToTop();
}
```

## الملفات المعدلة

### 1. `src/app/app.component.ts`
- إضافة `ViewportScroller`
- إضافة `OnInit` interface
- إضافة `scrollToTop()` function
- إضافة التمرير التلقائي عند تغيير الصفحة
- إضافة التمرير عند تحميل الصفحة لأول مرة

### 2. `src/app/shared/components/navbar/navbar.component.ts`
- إضافة `ViewportScroller`
- تحسين `scrollToTop()` function
- إضافة التمرير عند إغلاق القوائم المختلفة
- إضافة وظائف جديدة للقوائم المحمولة

### 3. `src/app/shared/components/footer/footer.component.ts`
- إضافة `ViewportScroller`
- إضافة `scrollToTop()` function
- إضافة التمرير عند الضغط على "الرئيسية"

### 4. `src/app/shared/components/footer/footer.component.html`
- إضافة `(click)="scrollToTop()"` لرابط "الرئيسية"

## المميزات

### ✅ **التمرير السلس**
- استخدام `behavior: 'smooth'` للتمرير السلس
- استخدام `ViewportScroller` كبديل آمن

### ✅ **التوافق مع جميع المتصفحات**
- يعمل على Chrome, Firefox, Safari, Edge
- يعمل على الأجهزة المحمولة

### ✅ **الأداء المحسن**
- لا يؤثر على سرعة التطبيق
- استخدام أحدث تقنيات Angular

### ✅ **تجربة مستخدم محسنة**
- كل صفحة تبدأ من الأعلى
- لا حاجة للتمرير اليدوي
- سلاسة في التنقل

## الاختبار

### 1. اختبار التنقل بين الصفحات
- انتقل من صفحة إلى أخرى
- تأكد من أن الصفحة الجديدة تبدأ من الأعلى

### 2. اختبار القوائم المحمولة
- افتح القائمة المحمولة
- اضغط على أي رابط
- تأكد من أن الصفحة تبدأ من الأعلى

### 3. اختبار رابط "الرئيسية"
- انتقل إلى أي صفحة
- اضغط على "الرئيسية" في Footer
- تأكد من العودة إلى الأعلى

## استكشاف الأخطاء

### إذا لم يعمل التمرير:
1. تأكد من أن `ViewportScroller` مستورد بشكل صحيح
2. تأكد من أن الوظيفة `scrollToTop()` موجودة
3. تأكد من أن `(click)="scrollToTop()"` مضاف للروابط

### إذا كان التمرير سريع جداً:
- يمكن تغيير `behavior: 'smooth'` إلى `behavior: 'auto'`

### إذا كان التمرير بطيء جداً:
- يمكن إزالة `behavior: 'smooth'` واستخدام `ViewportScroller` فقط




























