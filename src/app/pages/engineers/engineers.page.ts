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
    { id: 1, image: 'assets/arabic-2.webp', alt: 'المهندس أحمد فتح الله', subject: 'رياضيات', description: 'أستاذ الرياضيات العامة والخاصة', youtubeUrl: '' },
    { id: 2, image: 'assets/arabic-5.webp', alt: 'المهندس أحمد أبو زيد', subject: 'ميكانيكا', description: 'أستاذ الميكانيكا', youtubeUrl: '' },
    { id: 4, image: 'assets/arabic-4.webp', alt: 'المهندس أحمد الشامي', subject: 'فيزياء', description: 'أستاذ الفيزياء', youtubeUrl: '' },
    { id: 3, image: 'assets/arabic-1.webp', alt: 'دكتور سعد العميري', subject: 'كيمياء', description: 'أستاذ الكيمياء', youtubeUrl: '' },
		{ id: 5, image: 'assets/arabic-3.webp', alt: 'د/ عمر أحمد عبد الفتاح', subject: 'English', description: 'أستاذ اللغة الإنجليزية', youtubeUrl: '' }
  ];
  englishTeachers = [
    { name: 'المهندس/ أحمد علي', subject: 'Math 1 / Math 2', image: 'assets/english-7.webp', youtubeLinks: [{ label: 'Math 1', url: 'https://youtu.be/2xS9MoAlNZw?si=pSV2ek_89IqO7Whx' }, { label: 'Math 2', url: 'https://youtu.be/2hMEXq3QYzo?si=Z_iUjR3MY-7y7fKi' }] },
    { name: 'المهندس/ محمود الطرابيشي', subject: 'English', image: 'assets/english-10.webp', youtubeLinks: [{ label: 'English', url: 'https://youtu.be/K3Ze_e8IFDE?si=SIpLr2StHzyH_GQJ' }] },
    { name: 'المهندس/ محمد ماهر', subject: 'Mechanics', image: 'assets/english-6.webp', youtubeLinks: [{ label: 'Mechanics', url: 'https://youtu.be/bjQxp8uwZeo?si=rKMj8t3Gg55TGMZi' }] },
    { name: 'المهندس/ محمد نبيل', subject: 'Chemistry', image: 'assets/english-8.webp', youtubeLinks: [{ label: 'Chemistry', url: 'https://youtu.be/FNy4Pw4PcYM?si=ReG1X6S57W_AzAcA' }] },
    { name: 'المهندس/ أحمد عبد المنعم', subject: 'Physics', image: 'assets/english-9.webp', youtubeLinks: [{ label: 'Physics', url: 'https://youtu.be/MVneRaWmBCs?si=tL7OHZS8fw1_H-Se' }] }
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
      if (Array.isArray(state?.teachers) && state.teachers.length) this.teachers = state.teachers.map((teacher: any) => ({
        ...teacher,
        image: this.teachers.find((defaultTeacher: any) => defaultTeacher.id === teacher.id)?.image || teacher.image,
        youtubeUrl: this.teachers.find((defaultTeacher: any) => defaultTeacher.id === teacher.id)?.youtubeUrl || '',
        ...(teacher.id === 5 ? { alt: 'د/ عمر أحمد عبد الفتاح' } : {})
      }));
      if (Array.isArray(state?.englishTeachers) && state.englishTeachers.length) {
        const savedTeachers = new Map(state.englishTeachers.map((teacher: any) => [teacher.name, teacher]));
        this.englishTeachers = this.englishTeachers.map((teacher: any) => ({
          ...teacher,
          ...(savedTeachers.get(teacher.name) || {}),
          image: teacher.image,
          youtubeLinks: teacher.youtubeLinks
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
