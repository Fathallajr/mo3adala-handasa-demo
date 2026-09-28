import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { subPageTransition, cardAnimation, staggerList, waveAnimation, cascadeAnimation, fadeInUp } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { SubscriptionChoiceTriggerComponent } from '../../shared/components/subscription-choice-trigger/subscription-choice-trigger.component';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
  selector: 'app-engineers-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SubscriptionChoiceTriggerComponent],
  templateUrl: './engineers.page.html',
  styleUrls: ['./engineers.page.css'],
  animations: [subPageTransition, cardAnimation, staggerList, waveAnimation, cascadeAnimation, fadeInUp]
})
export class EngineersPageComponent implements OnInit {
  language: 'ar' | 'en' = 'ar';
  isEnglish = false;
  teachers = [
    { id: 1, image: 'assets/teacher.jpg', alt: 'المهندس أحمد فتح الله', subject: 'رياضيات', description: 'أستاذ الرياضيات العامة والخاصة' },
    { id: 2, image: 'assets/teacher1.jpg', alt: 'المهندس أحمد أبو زيد', subject: 'ميكانيكا', description: 'أستاذ الميكانيكا' },
    { id: 4, image: 'assets/teacher3.jpg', alt: 'المهندس أحمد الشامي', subject: 'فيزياء', description: 'أستاذ الفيزياء' },
    { id: 3, image: 'assets/teacher4.jpg', alt: 'دكتور سعد العميري', subject: 'كيمياء', description: 'أستاذ الكيمياء' },
		{ id: 5, image: 'assets/teacher2.png', alt: 'د/ عمر أحمد عبد الفتاح', subject: 'English', description: 'أستاذ اللغة الإنجليزية' }
  ];
  englishTeachers = [
    { name: 'المهندس/ أحمد علي', subject: 'Math 1 / Math 2', image: 'assets/teacher-english-ahmed-abdelmonem.png' },
    { name: 'المهندس/ محمود الطرابيشي', subject: 'English', image: 'assets/teacher-english-mohamed-nabil.png' },
    { name: 'المهندس/ محمد ماهر', subject: 'Mechanics', image: 'assets/teacher-english-mohamed-ashraf.png' },
    { name: 'المهندس/ محمد نبيل', subject: 'Chemistry', image: 'assets/teacher-english-tarabishi.png' },
    { name: 'المهندس/ أحمد عبد المنعم', subject: 'Physics', image: 'assets/teacher-english-ahmed-ali.png' }
  ];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private seo: SeoService,
    private canonical: CanonicalService,
    private monthlyContent: MonthlyContentService
  ) {}

  ngOnInit(): void {
    this.language = this.route.snapshot.data['language'] === 'en' ? 'en' : 'ar';
    this.isEnglish = this.language === 'en';
    this.monthlyContent.loadPageState('engineers', { visible: true, teachers: this.teachers, englishTeachers: this.englishTeachers }).subscribe((state: any) => {
      if (state?.visible === false) return;
      if (Array.isArray(state?.teachers) && state.teachers.length) this.teachers = state.teachers.map((teacher: any) => teacher.id === 5 ? { ...teacher, alt: 'د/ عمر أحمد عبد الفتاح' } : teacher);
      if (Array.isArray(state?.englishTeachers) && state.englishTeachers.length) {
        const savedTeachers = new Map(state.englishTeachers.map((teacher: any) => [teacher.name, teacher]));
        this.englishTeachers = this.englishTeachers.map((teacher: any) => ({
          ...teacher,
          ...(savedTeachers.get(teacher.name) || {}),
          image: teacher.image
        }));
      }
    });
    if (typeof window !== 'undefined') {
      const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
      const title = this.isEnglish ? 'مدرسين المعادلة English - ابلكيشن معادلة كلية هندسة' : 'مدرسين المعادلة عربي - ابلكيشن معادلة كلية هندسة';
      const description = this.isEnglish ? 'تعرف على مدرسين المعادلة English للشرح والحل والامتحانات باللغة الإنجليزية.' : 'تعرف على مدرسين المعادلة عربي وخبراتهم في شرح مواد هندسة وحاسبات باللغة العربية.';
      const url = `${siteUrl}/engineers-${this.language}`;
      
      this.seo.setTitle(title);
      this.seo.setDescription(description);
      this.seo.setOgTags({ title, description, url });
      this.seo.setTwitterTags({ title, description });
      this.canonical.setCanonical(url);
    }
  }

  viewTeacherDetails(teacherId: number) {
    this.router.navigate(['/teacher', teacherId]);
  }
}
