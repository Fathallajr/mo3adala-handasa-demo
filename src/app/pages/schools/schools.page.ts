import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { subPageTransition, fadeInUp, staggerList, cardAnimation } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
  selector: 'app-schools-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './schools.page.html',
  styleUrls: ['./schools.page.css'],
  animations: [subPageTransition, fadeInUp, staggerList, cardAnimation]
})
export class SchoolsPageComponent {
  searchTerm = '';
  selectedFilter = 'الكل';
  isFilterMenuOpen = false;
  pageSize = 24;
  displayedCount = this.pageSize;
  
  filterOptions = [
    'الكل',
    'المعاهد الفنية',
    'مدارس الثانوية الصناعية نظام 3 سنوات',
    'مدارس الثانوية الصناعية نظام 5 سنوات',
    'مدارس تكنولوجية نظام 3 سنوات',
    'مدارس تكنولوجية نظام 5 سنوات'
  ];

  allSchools = [] as Array<{ id: number; name: string; type: string; category: string; logo: string }>;

  private nextId = 1;

  private addSchool(name: string, category: string, logo?: string, typeOverride?: string) {
    this.allSchools.push({
      id: this.nextId++,
      name,
      type: typeOverride || (category.includes('تكنولوجية') ? 'مدرسة تكنولوجية' : (category === 'المعاهد الفنية' ? 'معهد فني' : 'مدرسة صناعية')),
      category,
      logo: logo || '/assets/schools/tech-school.png'
    });
  }

  ngOnInit() {
    const category3 = 'مدارس الثانوية الصناعية نظام 3 سنوات';
    const newIndustrial3YearSchools: { name: string; logo?: string }[] = [
      { name: 'ناصر الثانوية الفنية بنات' },
      { name: 'مبارك كول', logo:'/assets/schools/mobarak-koll.png' },// logooooooooooooooooooo
      { name: '15 مايو الثانوية الصناعية بنات' },
      { name: 'الثانوية الكهربائية العسكرية ببني سويف' },
      { name: 'الإسكندرية الصناعية للبترول والنقل البحري', logo: '/assets/schools/الاسكندرية الثانوية الصناعية للبترول والنقل البحرى والصناعات.jpeg' },
      { name: 'السيدة نفيسة الإلكترونية بنات' },
      { name: 'المعهد الفني للعلوم والتكنولوجيا', logo: '/assets/schools/المعهد الفنى للعلوم والتكنولوجيا.png' },
      { name: 'معهد السالزيان دون بوسكو IPI' },
      { name: '24 اكتوبر' },
      { name: 'قليوب الثانوية الصناعية بنين' },
      { name: 'دمياط الثانوية الميكانيكية العسكرية' },
      { name: 'بني سويف الثانوية الكهربائية العسكرية' },
      { name: 'الشهيد احمد محمد احمد الشناوي' },
      { name: 'مياه الشرب والصرف الصحي', logo: '/assets/schools/ْالمدرسة الثانوية الفنية لمياه الشرب والصرف الصحي.jpeg' },
      { name: 'أبو عطوة الثانوية صناعة بنات' },
      { name: 'الإسكندرية للبترول والبتروكيماويات' },
      { name: 'عرب جهينة الصناعية ' },
      { name: 'العبور الثانوية الصناعية المشتركة' },
      { name: 'ديروط الثانوية الصناعية بنين' },
      { name: 'الفيوم الميكانيكية الصناعية' },
      { name: 'سمارت للحاسبات والإلكترونات', logo: '/assets/schools/سمارت للحاسبات والالكترونات.jpeg' },
      { name: 'الثانوية الفنية للتعليم والتدريب المزدوج' },
      { name: 'السيدة خديجة الصناعية بنات' },
      { name: 'كفر صقر الصناعية' },
      { name: 'الشهيد ماجد فرج الثانوية الصناعية العسكرية' },
      { name: 'بني سويف الثانوية الكهربائية العسكرية بنين' },
      { name: 'المحلة الثانوية الميكانيكية العسكرية' },
      { name: 'كفر الدوار الثانوية الصناعية' },
      { name: 'إمبابة الثانوية الصناعية' },
      { name: 'الشهيد خالد محمد السيد دبور الزخرفية الثانوية بنين' },
      { name: 'ساحل سليم الثانوية الصناعية' },
      { name: 'كفر الزيات الثانوية الصناعية بنات' },
      { name: 'الشهيد هاني لطفي حرك الثانوية بنات' },
      { name: 'سمنود الثانوية الصناعية المهني' },
      { name: 'برج العرب الثانوية الصناعية العسكرية' },
      { name: 'ابو حمص الثانوية الصناعية بنين' },
      { name: 'ادكو الثانوية الصناعية العسكرية بنين' },
      { name: 'سيدي سالم الثانوية الصناعية العسكرية' },
      { name: 'محمد حسين هلال الثانوية الصناعية العسكري' },
      { name: 'رشيد الثانوية الصناعية العسكرية' },
      { name: 'الشهيد الطيار محمد بهجت شقير' },
      { name: 'فوه الثانوية الصناعية النسيجية بنات' },
      { name: 'أرمنت الثانوية الميكانيكية' },
      { name: 'السادات الثانوية الميكانيكية العسكرية' },
      { name: 'الأورمان الثانوية الفنية المتقدمة للحاسبات والإلكترونيات' },
      { name: 'قلين الثانوية الصناعية' },
      { name: 'عين حلوان الثانوية الصناعية (العسكرية)' },
      { name: 'الشهيد محمد فوزي الحوفي' },
      { name: 'الجيزة الكهربية' },
      { name: 'غمرة الثانوية الصناعية' },
      { name: 'أخميم الثانوية الصناعية بنات' },
      { name: 'نزلة محمد سمهان' },
      { name: 'بني حرب الصناعية المعمارية بنين' },
      { name: 'تلا الصناعية' },
      { name: 'بي العرب' },
      { name: 'النوبارية الصناعية المشتركة' },
      { name: 'السلام الثانوية الصناعية بنات' },
      { name: 'محمد صلاح الثانوية الصناعية العسكرية بنين' },
      { name: 'الحوامدية الصناعية للتعليم المزدوج' },
      { name: 'ناصر الثانوية' },
      { name: 'ديرب نجم الصناعية بنين' },
      { name: 'مصطفى حسانين عمر' },
      { name: 'أبورواش الثانوية الصناعية المشتركة' },
      { name: 'بنها الثانوية الزخرفية بنين' },
      { name: 'سلطان عويس' },
      { name: 'أبو تيج الثانوية الصناعية' },
      { name: 'الشهيد يحيى البحيري الصناعية العسكرية' },
      { name: 'الديب الصناعية بنات' },
      { name: 'الثانوية الفنية للتعليم والتدريب المزدوج للتأسيس العسكري' },
      { name: 'مركز التميز للصناعات الهندسية' },
      // المدارس الجديدة المضافة
      { name: 'الشهيد خالد دبور الزخرفية العسكرية (المحلة الزخرفية)' },
      { name: 'مكارم الأخلاق المعمارية', logo: '/assets/schools/مكارم الأخلاق المعمارية.jpg' },
      { name: 'مدرسة الطباعة الفنية بشبرا', logo: '/assets/schools/مدرسة الطباعة الفنية بشبرا.jpg' },
      { name: 'مدرسة رقي المعارف الثانوية الصناعية بنات' },
      { name: 'مدرسة عابدين الثانوية الصناعية', logo: '/assets/schools/مدرسة عابدين الثانوية الصناعية.jpg' },
      { name: 'مدرسة الخصوص الثانوية الصناعية بنين', logo: '/assets/schools/مدرسة الخصوص الثانوية الصناعية بنين.jpg' },
      { name: 'العباسية الثانوية الصناعية بنات', logo: '/assets/schools/العباسية الثانوية الصناعية بنات.jpg' },
      { name: 'مدرسة السيدة خديجة أم المؤمنين الصناعية', logo: '/assets/schools/مدرسة السيدة خديجة أم المؤمنين الصناعية.jpg' },
      { name: 'مدرسة السلام الثانوية الصناعية بنين' },
      { name: 'مدرسة السلام الثانوية الصناعية بنات', logo: '/assets/schools/مدرسة السلام الثانوية الصناعية بنات.jpg' },
      { name: 'مدرسة أحمد ماهر الثانوية الصناعية', logo: '/assets/schools/مدرسة أحمد ماهر الثانوية الصناعية.jpg' },
      { name: 'مدرسة الرضوانية الصناعية بنين', logo: '/assets/schools/مدرسة الرضوانية الصناعية بنين.jpg' },
      { name: 'مدرسة الأهرام الثانوية الصناعية بنين' },
      { name: 'مدرسة النهضة الثانوية الميكانيكية' },
      { name: 'مدرسة شبرا الميكانيكية الجديدة', logo: '/assets/schools/مدرسة شبرا الميكانيكية الجديدة.jpg' },
      { name: 'مدرسة السادات الصناعية بنين', logo: '/assets/schools/مدرسة السادات الصناعية بنين.jpg' },
      { name: 'مدرسة غمرة الثانوية الصناعية بنين' },
      { name: 'أحمد عرابي الثانوية الصناعية' },
      { name: 'الشهيد اللواء ماجد أحمد إبراهيم صالح' },
      { name: 'الشهيد أحمد حسين فهمي' },
      { name: 'السلام الثانوية المعمارية' },
      { name: 'السلام الثانوية الكهربية' },
      { name: 'الشهيد أحمد أبو بكر المعتمدية' },
      { name: 'المرج الثانوية الصناعية للبنين' },
      { name: 'الشعراني الثانوية الصناعية' },
      { name: 'العباسية الثانوية الميكانيكية' },
      { name: 'العباسية الثانوية الكهربية' },
      { name: 'العباسية الثانوية الزخرفية' },
      { name: 'منشأة ناصر الثانوية المعمارية', logo: '/assets/schools/منشأة ناصر الثانوية المعمارية.jpg' },
      { name: 'بنبا قادن الصناعية الثانوية', logo: '/assets/schools/بنبا قادن الصناعية الثانوية.jpg' },
      { name: 'الشهيد محمود رأفت الصناعية' },
      { name: '15 مايو الثانوية الصناعية بنين' },
      { name: 'عين حلوان الثانوية الصناعية بنين' },
      { name: 'حلوان الثانوية الصناعية الجديدة' },
      { name: 'مدرسة دمياط الثانوية العسكرية للصناعات المعدنية بنين' },
      // المدارس الإضافية الجديدة
      { name: 'طلعت حرب الصناعية بنات', logo: '/assets/schools/طلعت حرب الصناعية بنات.jpg' },
      { name: 'باب الشعرية الثانوية الصناعية بنات', logo: '/assets/schools/باب الشعرية الثانوية الصناعية بنات.jpg' },
      { name: 'السيدة زينب الثانوية الصناعية بنات', logo: '/assets/schools/السيدة زينب الثانوية الصناعية بنات.jpg' },
      { name: 'سميرة موسى الصناعية بنات', logo: '/assets/schools/سميرة موسى الصناعية بنات.jpg' },
      { name: 'المرج الثانوية الصناعية للبنات' },
      { name: 'الشيخ زايد الثانوية الصناعية بنات' },
      { name: 'القاهرة الثانوية الصناعية بالمنيل بنات', logo: '/assets/schools/القاهرة الفنية للنسيج بنات_.jpg' },
      { name: 'حلوان الثانوية الصناعية بنات' },
      { name: 'دمياط الثانوية الصناعية بنات', logo: '/assets/schools/مدرسة دمياط الثانوية الصناعية بنات.jpg' },
      { name: 'دمياط الجديدة الثانوية الصناعية', logo: '/assets/schools/مدرسة دمياط الجديدة الثانوية الصناعية.jpg' },
      { name: 'كفر حميدو الصناعية بنات', logo: '/assets/schools/كفر حميدو الصناعية بنات_.jpg' },
      { name: 'الرحامنة الثانوية الصناعية دمياط', logo: '/assets/schools/الرحامنة الثانوية الصناعية دمياط.jpg' },
      { name: 'محمد حسن درة الإلكترونية دمياط', logo: '/assets/schools/محمد حسن درة الإلكترونية دمياط.jpg' },
      { name: 'سلامون الثانوية الصناعية بنين', logo: '/assets/schools/سلامون الثانوية الصناعية بنين.jpg' },
      { name: 'الزقازيق الصناعية بنات رقم 1', logo: '/assets/schools/الزقازيق الصناعية بنات رقم 1.jpg' },
      { name: 'الزقازيق الصناعية بنات رقم 2', logo: '/assets/schools/الزقازيق الصناعية بنات رقم 2.jpg' },
      { name: 'إبراهيم أبو النجا الثانوية الصناعية بنين', logo: '/assets/schools/إبراهيم أبو النجا الثانوية الصناعية بنين.jpg' },
      { name: 'الخصوص الثانوية الصناعية', logo: '/assets/schools/الخصوص الثانوية الصناعية.jpg' },
      { name: 'الزخرفية الصناعية بنين دمياط', logo: '/assets/schools/الزخرفية الصناعية بنين دمياط.jpg' },
      // المدارس الجديدة - نظام 3 سنوات
      { name: 'حلوان المهنية الملحقة بنات', logo: '/assets/schools/حلوان المهنية الملحقة بنات.jpg' },
      { name: 'القاضي شرف الدين بنات', logo: '/assets/schools/القاضي شرف الدين بنات.jpg' },
      { name: 'السيدة زينب المهنية بنين' },
      { name: 'زين العابدين للتعليم المزدوج', logo: '/assets/schools/زين العابدين للتعليم المزدوج.jpg' },
      { name: 'طنطا الثانوية الصناعية بنات', logo: '/assets/schools/طنطا الثانوية الصناعية بنات.jpg' },
      { name: 'طنطا الثانوية الميكانيكية بنين', logo: '/assets/schools/طنطا الثانوية الميكانيكية بنين.jpg' },
      { name: 'طنطا الثانوية الزخرفية بنين', logo: '/assets/schools/طنطا الثانوية الزخرفية بنين.jpg' },
      { name: 'طنبارة الثانوية الصناعية بنات', logo: '/assets/schools/طنبارة الثانوية الصناعية بنات.jpg' },
      { name: 'زفتي الثانوية الصناعية بنات' },
      { name: 'زفتى الثانوية الزخرفية بسندبسط بنين' },
      { name: 'زفتى الثانوية الميكانيكية بنين' },
      { name: 'سنبو الثانوية الصناعية بنات', logo: '/assets/schools/سنبو الثانوية الصناعية بنات.jpg' },
      { name: 'سندوب الثانوية الصناعية بنات', logo: '/assets/schools/سندوب الثانوية الصناعية بنات.jpg' },
      { name: 'كفر الزيات الثانوية الزخرفية بنين' },
      { name: 'كفر الزيات الثانوية الميكانيكية بنين' },
      { name: 'الشين الثانوية الصناعية بنات' },
      { name: 'الفيوم الصناعية الزخرفية بنين', logo: '/assets/schools/مدرسة الفيوم الصناعية الزخرفية بنين.jpg' },
      { name: 'منفلوط الثانوية الصناعية', logo: '/assets/schools/منفلوط الثانوية الصناعية.jpg' },
      { name: 'ديروط الصناعية المهنية' },
      { name: 'بدر الثانوية الصناعية', logo: '/assets/schools/بدر الثانوية الصناعية_.jpg' },
      { name: 'أسيوط الثانوية الميكانيكية', logo: '/assets/schools/أسيوط الثانوية الميكانيكية.jpg' },
      { name: 'أسيوط الثانوية الزخرفية', logo: '/assets/schools/أسيوط الثانوية الزخرفية.jpg' },
      { name: 'القوصية الثانوية الصناعية بالمنشأة الكبرى' },
      { name: 'ابنوب الثانوية الصناعية' }
    ];

    newIndustrial3YearSchools.forEach(s => this.addSchool(s.name, category3, s.logo));

    // Additional 3-year industrial schools (deduplicated by name)
    const additionalIndustrial3: { name: string; logo?: string }[] = [
      { name: 'أحمد عرابي الثانوية الصناعية' },
      { name: 'الثانوية الصناعية بنقادة' },
      { name: 'السيدة خديجة أم المؤمنين الصناعية بنات' },
      { name: 'المعادي الثانوية الصناعية بنات' },
      { name: 'تل بني عمران الثانوية المشتركة' },
      { name: 'المطرية الصناعية' },
      { name: 'الشهيد طيار محمد بهجت' },
      { name: 'القرين الثانوية الصناعية العسكرية المشتركة' },
      { name: 'الدرافيل الصناعية المشتركة' },
      { name: 'المصرية للتلمذة الصناعية' },
      { name: 'المريم الثانوية الصناعية الحديثة' },
      { name: 'الصباح الصناعية بنات' },
      { name: 'الشهيد محمد عبد الله حسين الفنية بنات' },
      { name: 'منوف الثانوية الصناعية العسكرية بنين' },
      { name: 'الشهيد محمد فوزي الحوفي' },
      { name: 'أخميم الثانوية الصناعية بنات' },
      { name: 'صالح عوض الله الثانوية الصناعية' },
      { name: 'الشهيد سامي علي نصر الدين الصناعية بنات' },
      { name: 'النوبارية الثانوية الصناعية المشتركة' },
      { name: 'صلاح العيوطي الفنية بنات' },
      { name: 'نكلا الثانوية الصناعية' },
      { name: 'كفر صقر الثانوية الصناعية' },
      { name: 'طنطا الثانوية الكهربية' },
      { name: 'شبرا الثانوية الميكانيكية العسكرية' },
      { name: 'الغردقة الثانوية الصناعية' },
      { name: 'غمرة الثانوية الصناعية بنين' },
      { name: 'إسنا الثانوية الصناعية بنات' },
      { name: 'الغنايم الثانوية الصناعية المشتركة العسكرية' },
      { name: 'الشهيد حسام جمال جمعة الثانوية الصناعية' },
      { name: 'المنفلوطي الثانوية الصناعية المشتركة' },
      { name: 'الخصوص الثانوية الصناعية بنين' },
      { name: 'كفر الشيخ الثانوية الصناعية العسكرية بنين' },
      { name: 'خزام الثانوية المشتركة' },
      { name: 'الشهيد أحمد الكفراوي' },
      { name: 'منيا القمح الصناعية بنين' },
      { name: 'السلام الصناعية بنات' },
      { name: 'المشير طنطاوي الثانوية بنين' },
      { name: 'حلوان الثانوية الميكانيكية العسكرية' },
      { name: 'أبو حماد الصناعية' },
      { name: 'قويسنا الثانوية الصناعية العسكرية بنين' },
      { name: 'محمد فوزي الحوفي' },
      { name: 'كفر الدوار الثانوية الميكانيكية' },
      { name: 'الدلنجات الصناعية بنين' },
      { name: 'أبو صوير الثانوية الصناعية المشتركة' },
      { name: 'أخميم الثانوية الصناعية بنات' },
      { name: 'كفر شكر الثانوية الصناعية بنين' },
      { name: 'الشهيد محمد عبد الله حسين' },
      { name: 'الشهيد فارس النعمان' },
      { name: 'السويس الثانوية الفنية الصناعية' },
      { name: 'الحسينية الثانوية الفنية الصناعية المشتركة' },
      { name: 'المحمودية الثانوية الصناعية بنات' },
      { name: 'إدكو الثانوية الصناعية بنين' },
      { name: 'رقي المعارف الثانوية الصناعية بنات' },
      { name: 'محمد صلاح الثانوية الصناعية العسكرية' },
      { name: 'أبوكساه الثانوية الصناعية العسكرية بنين' },
      { name: 'أسيوط الثانوية الصناعية بنات' },
      { name: 'الشهيد يحيى البحيري الثانوية الصناعية' },
      { name: 'بلطيم الثانوية الصناعية بنين' },
      { name: 'الشهيد محمد رضا الشناوي' },
      { name: 'كوم حمادة الصناعية بنات' },
      { name: 'الشهيد محمد عرفة' },
      { name: 'الصف الثانوية الصناعية بنات' },
      { name: 'المنشأة الثانوية الفنية الجديدة بنات' },
      { name: 'هيثم سامي حمد الثانوية الفنية بنات' },
      { name: 'بني سويف الثانوية الميكانيكية' },
      { name: 'الشهيد محمود محمد أحمد الثانوية الصناعية المشتركة' },
      { name: 'إبراهيم عثمان الثانوية الصناعية' },
      { name: 'بدير الحديدي الثانوية الصناعية' },
      { name: 'ببا الثانوية الصناعية العسكرية بنين' },
      { name: 'أويش الحجر الثانوية الصناعية' },
      { name: 'الخصوص الثانوية الصناعية بنين' },
      { name: 'محمد حسين هلال' },
      { name: 'حجازة الصناعية' },
      { name: 'تفتيش كفر سعد الثانوية الصناعية العسكرية بنين' },
      { name: 'سرسو البرامون الثانوية الصناعية العسكرية' },
      { name: 'نجع حمادى الصناعية الميكانيكية ', logo: '/assets/schools/نجع حمادى.jpg' },
      { name: 'القبابات الثانوية الصناعية المشتركة '},
      { name: 'ههيا الثانوية الصناعيه العسكريه بنين', logo: '/assets/schools/ههيا الثانوية الصناعية.jpg' },
      { name: 'الهيئة العربية لتصنيع للتكنولوجيا التطبيقية في مجال صناعه الطائرات', logo: '/assets/schools/الهيئة العربية لتصنيع للتكنولوجيا التطبيقية في مجال صناعه الطائرات.jpg' },
      // المدارس الثانوية الصناعية الجديدة - نظام 3 سنوات
      { name: 'أشمون الثانويه الصناعيه' },
      { name: 'أبو شربان الثانوية الصناعية بنين' },
      { name: 'الأشراف الثانوية الصناعية المشتركة' },
      { name: 'الباجور الثانوية الصناعية للتأسيس العسكري' },
      { name: 'البيضا للتعليم و التدريب المزدوج' },
      { name: 'التحرير الثانوية الصناعية بنات' },
      { name: 'التعاونيات الصناعيه بنات' },
      { name: 'المحلة الكبرى الثانوية الصناعية بنات' },
      { name: 'بني مزار الثانوية الصناعية بنين للتأسيس العسكري' },
      { name: 'قوص الثانوية الصناعية بنين' },
      { name: 'نقادة الثانوية الصناعية بنين' },
      { name: 'نقادة الثانوية الصناعية بنات' },
      { name: 'الجلاء الثانوية الصناعية بنات' },
      { name: 'الجيزة الثانوية الصناعية بنات' },
      { name: 'الحامول الثانوية الصناعية بنين للتأسيس العسكري' },
      { name: 'الزقازيق المعمارية الزخرفية العسكرية' },
      { name: 'السنطة الثانوية الصناعية العسكرية بنين' },
      { name: 'الشاطبي الميكانيكية العسكرية' },
      { name: 'الشروق الثانوية الصناعية المطورة لنظم المعلومات والإعلام' },
      { name: 'الشهاب الثانوية الصناعية' },
      { name: 'الشهداء الصناعية بنات' },
      { name: 'الشهيد خالد حمدي السواحلي' },
      { name: 'الشهيد سامح عبد المعبود البطاوي' },
      { name: 'الثانوية الصناعية المشتركة بصيدا والقيراطيين' },
      { name: 'العامريه الثانوية الصناعية العسكرية' },
      { name: 'ألفا الدولية للبترول والتعدين' },
      { name: 'الفشن الثانوية الصناعية العسكرية  بنين' },
      { name: 'القنطرة شرق الصناعية المشتركة' },
      { name: 'الكردي الصناعية بنات' },
      { name: 'اللواء السيد محمد الزهيري' },
      { name: 'المسيري الثانوية الصناعية المشتركة' },
      { name: 'المعدات الثقيلة الثانوية الصناعية العسكرية' },
      { name: 'المنيا الصناعية بنات' },
      { name: 'اهناسيا الفنية بنات' },
      { name: 'بدر الصناعية بنات' },
      { name: 'بلتان الثانوية الكهربية بنات' },
      { name: 'بنها الثانوية الميكانيكية العسكرية بنين' },
      { name: 'بنهو الثانوية الإلكترونية بنات' },
      { name: 'حسن طه الثانوية الصناعية المشتركة' },
      { name: 'حوش عيسى الصناعية العسكرية' },
      { name: 'دسوق الثانوية الصناعيه العسكرية' },
      { name: 'دمنهور الثانوية الصناعية بنات' },
      { name: 'دميرة الثانوية الفنية بنات' },
      { name: 'ديروط الميكانيكية العسكرية بنين' },
      { name: 'سعد الشربيني الصناعية العسكرية' },
      { name: 'سوهاج الثانوية الميكانيكية العسكرية' },
      { name: 'سيكم الثانوية الفنية للتعليم والتدريب المزدوج' },
      { name: 'شبلنجة الثانوية الصناعية بنات' },
      { name: 'شبين القناطر الفنية بنات' },
      { name: 'طوسون الثانوية الصناعية العسكرية' },
      { name: 'عبد المجيد عامر الثانويه الصناعيه' },
      { name: 'عمار بن ياسر الثانوية العسكرية بنين' },
      { name: 'قليوب الثانوية الصناعية بنات' },
      { name: 'كفر الدوار الفنية بنات' },
      { name: 'محمد علي الثانوية الفنية العسكرية' },
      { name: 'محي الدين ابو العز الصناعية العسكرية' },
      { name: 'الباجور الصناعيه للتأسيس العسكري' },
      { name: 'الشهيد علي عبد النبي الفار الثانوية الصناعية بنين' },
      { name: 'بلبيس الثانوية الصناعية العسكرية بنين' },
      { name: 'بني مزار الصناعية العسكرية بنين' },
      { name: 'حاجر الضبعية الثانوية الصناعية المشتركة' },
      { name: 'طنان الصناعية بنين' },
      { name: 'كوم امبو الثانوية الصناعية العسكرية' },
      { name: 'محمد صالح حرب الفنية المتقدمة الصناعية' },
      { name: 'أبو المطامير الثانوية الصناعية بنين' },
      { name: 'أبيس الثانوية الصناعية المشتركة' },
      { name: 'الجيزة الثانوية الصناعية للبنات' },
      { name: 'الشهيد عصام يونس الفنية بنات' },
      { name: 'الشهيد محمد صفوت المتقدمة' },
      { name: 'الطاقة الشمسية' },
      { name: 'حسين جلال الثانوية الصناعية' },
      { name: 'دكرنس الثانوية الصناعية بنين' },
      { name: 'زكي صالح الثانوية الفنية' },
      { name: 'شبراخيت الثانوية الصناعية' },
      { name: 'فيوتك الثانوية الفنية للتعليم والتدريب المزدوج' },
      { name: 'المستقبل الحديثة الثانوية الصناعية' },
      { name: 'ميت خلف الميكانيكية العسكرية' },
      { name: 'ملوي الثانوية الصناعية بنين' },
      { name: 'شبرا الخيمة الثانوية الصناعية بنات' },
      { name: 'الثانوية الفنية للتعليم والتدريب المزدوج' }
    ];
    additionalIndustrial3.forEach(s => {
      if (!this.allSchools.some(x => x.name === s.name)) {
        this.addSchool(s.name, category3, s.logo);
      }
    });

    const category5 = 'مدارس الثانوية الصناعية نظام 5 سنوات';
    const newIndustrial5YearSchools: { name: string; logo?: string }[] = [
      { name: 'السلام المعمارية العسكرية' },
      { name: 'الإسكندرية الفنية المتقدمة' },
      { name: 'دار السلام المعمارية الفنية المتقدمة' },
      { name: 'معهد السالزيان دون بوسكو ITI', logo: '/assets/schools/معهد السالزيان دون بوسكو.jpeg' },
      { name: 'مدرسة مطروح الثانوية الصناعية العسكرية بنبن' },
      { name: 'الشهيد احمد محمد احمد الشناوي' },
      { name: 'جلال فهمي الفنية المتقدمة', logo: '/assets/schools/جلال فهمي الفنيه المتقدمه.jpeg' },
      { name: 'صالح عوض الله' },
      { name: 'العبور الثانوية الصناعية العسكرية المشتركة' },
      { name: 'هواره الصناعية المتقدمة' },
      { name: 'الفنية المتقدمة لتكنولوجيا الصيانة' },
      { name: '15 مايو الفنية المتقدمة العسكرية' },
      { name: 'السلطان عويس الفنية العسكرية المتقدمة' },
      { name: '6 أكتوبر الفنية المتقدمة' },
      { name: 'الثانوية الفنية المتقدمة الصناعية العسكرية' },
      { name: 'محمد صالح حرب الفنية الصناعية المتقدمة' },
      { name: 'الورديان الفنية المتقدمة العسكرية' },
      { name: 'الحديد والصلب الفنية المتقدمة' },
      // المدارس الإضافية للخمس سنوات
      { name: 'القاهرة الفنية للنسيج بنات', logo: '/assets/schools/القاهرة الفنية للنسيج بنات_.jpg' },
      { name: 'الزاوية الحمراء الفنية المشتركة' },
      { name: 'الفنية المتقدمة لتكنولوجيا الصيانة بنين' },
      { name: 'دار السلام الفنية المتقدمة بنين' },
      { name: 'النقل النهري الفنية بنين' },
      { name: 'الفنية المتقدمة الصناعية بالمنصورة' },
      { name: 'الزقازيق الفنية المتقدمة الصناعية العسكرية' },
      { name: 'ناصر الثانوية الصناعية العسكرية بنين بسنورس ', logo: '/assets/schools/ناصر الثانوية الصناعية.jpg' },
      // المدارس الجديدة - نظام 5 سنوات
      { name: 'زفتى الثانوية الميكانيكية بنين' },
      { name: 'قطور الثانوية الصناعية بنين' },
      { name: 'الشين الثانوية الصناعية بنات' },
      { name: 'السيدة صفية الثانوية الصناعية بنات', logo: '/assets/schools/السيدة صفية الثانوية الصناعية بنات.jpg' },
      // المدارس الثانوية الصناعية الجديدة - نظام 5 سنوات
      { name: 'بركة السبع الفنية المتقدمة الصناعية' },
      { name: 'شطا الفنية المتقدمة الصناعية' },
      { name: 'المنيا الفنية المتقدمة الصناعية بنين' },
      { name: 'جرجا الصناعية المتقدمة' },
      { name: 'زهور الامراء الثانويه الصناعيه الفنيه العسكريه المتقدمه' },
      { name: 'قنا الفنية الصناعية المتقدمة' },
      { name: 'الشهيد مجند محمود محسن أبو جمرة الثانوية الصناعية العسكرية' }
    ];

    newIndustrial5YearSchools.forEach(s => this.addSchool(s.name, category5, s.logo));

    // المعاهد الفنية
    const institutesCategory = 'المعاهد الفنية';
    const institutes: { name: string; logo?: string; type?: string }[] = [
      { name: 'المعهد الفني الصناعي' },
      { name: 'معهد مساحة' },
      { name: 'معهد فني صحي' },
      { name: 'الجامعه العماليه شعبه تنميه تكنولوجيه', type: 'معهد فني' }
    ];
    institutes.forEach(s => this.addSchool(s.name, institutesCategory, s.logo, s.type || 'معهد فني'));

    // مدارس تكنولوجية نظام 3 سنوات
    const tech3Category = 'مدارس تكنولوجية نظام 3 سنوات';
    const tech3Schools: { name: string; logo?: string }[] = [
      { name: 'WE', logo: '/assets/schools/مدرسة WE للتكنولوجيا التطبيقية_.jpg' },
      { name: 'الشهيد عمرو مصطفى حسني' },
      { name: 'السويدي الدولية للتكنولوجيا (STA)' },
      { name: 'محمد متولي الشعراوي تكنولوجيا تطبيقية' },
      { name: 'عمار للتكنولوجيا التطبيقية', logo: '/assets/schools/عمار للتكنولوجيا التطبيقيه.jpg' },
      { name: 'حلوان للتكنولوجيا التطبيقية' },
      { name: 'الإنتاج الحربي للتكنولوجيا التطبيقية' },
      { name: 'إلكترو مصر للتكنولوجيا التطبيقية', logo: '/assets/schools/إلكترو مصر للتكنولوجيا التطبيقية.jpeg' },
      { name: 'الفنون للتكنولوجيا التطبيقية' },
      { name: 'العربي للتكنولوجيا التطبيقية', logo: '/assets/schools/العربي للتكنولوجيا التطبيقية.png' },
      { name: 'إيجيبت جولد للتكنولوجيا التطبيقية', logo: '/assets/schools/إيجيبت جولد للتكنولوجيا التطبيقية.jpeg' },
      { name: 'الصالحية للتكنولوجيا التطبيقية' },
      { name: 'STEP' },
      { name: 'بنك مصر للتكنولوجيا التطبيقية وصناعات دوائية' },
      { name: 'Mountain View', logo: '/assets/schools/Mountain View.jpeg' },
      { name: 'فولكس فاجن للكتنولوجية التطبيقية' },
      { name: 'المجمع التكنولوجي المتكامل' },
      { name: 'ظهر للتكنولوجيا التطبيقية' },
      { name: 'غبور 2', logo: '/assets/schools/غبور.jpg' },
      { name: 'الفنية المتقدمة لتكنولوجيا الصيانة' },
      { name: 'أكاديمية مصر الدولية للحاسبات والذكاء الاصطناعي (MICA)', logo: '/assets/schools/أكاديمية مصر الدولية للحاسبات والذكاء الاصطناعي .jpeg' },
      { name: 'النقل النهري للتكنولوجيا التطبيقية' },
      { name: 'HST', logo: '/assets/schools/HST School for Applied Technology.jpeg' },
      { name: 'نهضة مصر المعمارية' },
      { name: 'تكنولوجيا تطبيقية للميكاترونكس' },
      { name: 'فريش الدولية للتكنولوجيا التطبيقية' },
      { name: 'الأكاديمية الحديثة للطباعة' },
      { name: 'معهد هليوبوليس للتكنولوجيا' },
      // المدارس التكنولوجية الجديدة - نظام 3 سنوات
      { name: 'Arias Egypt' },
      { name: 'CFC' },
      { name: 'Eva' },
      { name: 'Evergrow' },
      { name: 'Jeans Car' },
      { name: 'Samrt' },
      { name: 'Sidpec' },
      { name: 'MCV' }
    ];
    tech3Schools.forEach(s => this.addSchool(s.name, tech3Category, s.logo));

    // مدارس تكنولوجية نظام 5 سنوات
    const tech5Category = 'مدارس تكنولوجية نظام 5 سنوات';
    const tech5Schools: { name: string; logo?: string }[] = [
      { name: 'الفنية المتقدمة لتكنولوجيا الصيانة' }
    ];
    tech5Schools.forEach(s => this.addSchool(s.name, tech5Category, s.logo));

    this.monthlyContent.loadPageState('schools', { visible: true, title: 'المدارس والمعاهد', items: this.allSchools }).subscribe((state: any) => {
      if (state?.visible === false) return;
      if (Array.isArray(state?.items) && state.items.length) {
        const existingNames = new Set(this.allSchools.map(school => school.name.trim()));
        const addedSchools = state.items.filter((school: any) => school && typeof school.name === 'string' && !existingNames.has(school.name.trim()));
        this.allSchools = [...this.allSchools, ...addedSchools];
      }
    });
  }

  constructor(private seo: SeoService, private canonical: CanonicalService, private monthlyContent: MonthlyContentService) {
    const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
    const title = 'دليل المدارس والمعاهد المعتمدة - معادلة كلية هندسة';
    const description = 'ابحث عن المدارس والمعاهد التكنولوجية والصناعية المعتمدة والمناسبة للتقديم في معادلة كلية الهندسة.';
    const url = `${siteUrl}/schools`;
    this.seo.setTitle(title);
    this.seo.setDescription(description);
    this.seo.setOgTags({ title, description, url });
    this.seo.setTwitterTags({ title, description });
    this.canonical.setCanonical(url);
  }

  get schools() {
    let filteredSchools = this.allSchools;

    // Apply category filter
    if (this.selectedFilter !== 'الكل') {
      filteredSchools = filteredSchools.filter(school => {
        if (this.selectedFilter === 'المعاهد الفنية') {
          return school.category === 'المعاهد الفنية' || school.category.includes('معهد');
        }
        return school.category === this.selectedFilter;
      });
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filteredSchools = filteredSchools.filter(school =>
        school.name.toLowerCase().includes(term) ||
        school.type.toLowerCase().includes(term)
      );
    }

    return filteredSchools.slice(0, this.displayedCount);
  }

  get totalFilteredCount(): number {
    let filteredSchools = this.allSchools;
    if (this.selectedFilter !== 'الكل') {
      filteredSchools = filteredSchools.filter(school => {
        if (this.selectedFilter === 'المعاهد الفنية') {
          return school.category === 'المعاهد الفنية' || school.category.includes('معهد');
        }
        return school.category === this.selectedFilter;
      });
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filteredSchools = filteredSchools.filter(school =>
        school.name.toLowerCase().includes(term) ||
        school.type.toLowerCase().includes(term)
      );
    }
    return filteredSchools.length;
  }

  get canLoadMore(): boolean {
    return this.displayedCount < this.totalFilteredCount;
  }

  loadMore() {
    this.displayedCount += this.pageSize;
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.displayedCount = this.pageSize;
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  selectFilter(filter: string) {
    this.onFilterChange(filter);
    this.isFilterMenuOpen = false;
  }

  closeFilterMenu() {
    this.isFilterMenuOpen = false;
  }

  onSearchChange() {
    // Search happens automatically through the getter
    this.displayedCount = this.pageSize;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedFilter = 'الكل';
    this.displayedCount = this.pageSize;
    this.isFilterMenuOpen = false;
  }

  getCountByCategory(category: string): number {
    if (category === 'المعاهد الفنية') {
      return this.allSchools.filter(school => 
        school.category === 'المعاهد الفنية' || school.category.includes('معهد')
      ).length;
    }
    return this.allSchools.filter(school => school.category === category).length;
  }

}
