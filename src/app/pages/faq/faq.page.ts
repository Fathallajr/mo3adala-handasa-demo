import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { expandCollapse, fadeInUp, staggerList } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
	selector: 'app-faq-page',
	standalone: true,
  imports: [CommonModule, FormsModule],
	animations: [expandCollapse, fadeInUp, staggerList],
	templateUrl: './faq.page.html',
	styleUrls: ['./faq.page.css'],
})
export class FaqPageComponent implements OnInit {
	openIndex: number | null = null;
  query: string = '';
  isLoading: boolean = true;
	faqs = [
		{ q: 'يعنى ايه معادلة كلية هندسة؟', a: 'هى مسابقة بينظمها المجلس الاعلي للجامعات لطلاب التعليم الفني الصناعي ( الدبلومات و المعاهد الفنية الصناعية ) للالتحاق باحدي كليات الهندسة الحكومية.' },
		{ q: 'مين الطلاب المسموح ليهم التقديم على المعادلة؟', a: 'طلاب التعليم الفني الصناعي الدبلومات و المعاهد الفنية الصناعية.' },
		{ q: 'ما هى عدد المحاولات المسموحة للمعادلة؟', a: ' محاولة واحدة فقط فى سنة التخرج او السنة اللى بعدها' },
		{ q: 'ما هى مواد المعادلة؟', a: '  رياضة عامة (جبر وهندسة فراغية) - رياضة خاصة (تفاضل وتكامل) - ميكانيكا - كيمياء  -فيزياء- انجلش ' },
		{ q: 'ما هى شروط التقديم على المعادلة؟', a: 'لطلاب الدبلوم 3 سنين يكون حاصل على 70% ولطلاب الدبلوم 5سنين والمعاهد يكون حاصل على 50% ' },
		{ q: 'موعد التقديم على الامتحانات؟', a: ' التقديم عادة بيكون في أول شهر أغسطس (8)' },
		{ q: 'مكان الامتحان والكليات المتاح فيها الإمتحانات؟', a: '- بتمتحن في كلية الهندسة التابعة للجامعة الأقرب ليك علي حسب الموقع الجغرافي التابع للإدارة التعليمية في حالة انك طالب دبلوم ٣ سنين.- لو معهد حسب الموقع الجغرافي الأقرب لبطاقتك.- الكليات (القاهرة، الزقازيق، أسيوط، كفر الشيخ)' },
		{ q: 'لو سقطت في المعادلة ينفع أعيدها تاني؟', a: 'لا للأسف، إلا لو دخلت معهد، وهنا ليك فرصة تانية.' },
		{ q: 'نظام الامتحان بيكون اختياري ولا مقالي؟', a: 'بيكون 50 سؤال اختياري (MCQ).' },
		{ q: 'لو سقطت في مادة واحدة يبقى سقطت في كله ولا في دور تاني؟', a: 'لو سقطت في مادة واحدة بتسقط في كله، ومفيش دور تاني للأسف.' },
		{ q: 'أذاكر منين؟ وهل في كتب معينة للمعادلة؟', a: 'الأبلكيشن بينزلك ملازم PDF شاملة ووافية جدًا بإذن الله.' },
		{ q: 'إيه أكتر مادة صعبة في المعادلة؟', a: 'مفيش مادة أصعب من مادة، مع المذاكرة كله بيكون في المتناول وبسيط.' },
		{ q: 'في وقت قد إيه محتاج أذاكر علشان ألحق الامتحان؟', a: 'يفضل تبدأ بدري، كل ما بدأت بدري كل ما كان أفضل من 10–12 شهر.' },
		{ q: 'بعد ما أنجح في المعادلة هدخل أنهي سنة في هندسة؟', a: 'هتدخل اعدادي هندسة عادي زي خريج الثانوية العامة.' },
		{ q: 'هل بدخل كلية الهندسة اللي في محافظتي ولا أي كلية؟', a: 'بتدخل حسب التوزيع الجغرافي لمدرستك لو دبلوم 3 سنوات فحسب المدرسة، ولو معهد فحسب البطاقة.' },
		{ q: 'بعد التخرج من الهندسة، بتفرق معادلة عن ثانوي عام في الشغل؟', a: 'لا مفيش فرق، أنت خريج هندسة زيك زي أي طالب.' },
		{ q: 'هل ليّا الحق في الالتحاق بالنقابة زي خريج الثانوية العامة؟', a: 'آه طبعًا، ليك الحق كامل في نقابة المهندسين.' },
		{ q: 'مين اللي بيدرسولنا في الابلكيشن؟', a: 'بيشرحلكم نخبة من المدرسين: م/ أحمد فتح الله، م/ أحمد أبو زيد، د/ سعد العميري، م/ أحمد الشامي، د/ عمر أحمد عبد الفتاح.' },
		{ q: 'يعني إيه معادلة حاسبات؟', a: 'هي معادلة مشابهة لمعادلة كلية الهندسة، ومخصصة للطلاب الراغبين في الالتحاق بكليات الحاسبات والمعلومات حسب الشروط المعلنة.' },
		{ q: 'مين الطلاب المسموح لهم بالتقديم على معادلة حاسبات؟', a: 'طلاب التعليم التكنولوجي المستوفون لشروط التقديم والدفعات المطلوبة طبقًا للإعلان الرسمي.' },
		{ q: 'ما هي مواد معادلة حاسبات؟', a: 'مواد معادلة حاسبات أربع مواد: رياضة عامة، رياضة خاصة، فيزياء، وإنجليزي.' },
	];
	constructor(private seo: SeoService, private canonical: CanonicalService, private contentService: MonthlyContentService) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'الأسئلة الشائعة - معادلة كلية هندسة';
		const description = 'إجابات لأكثر الأسئلة شيوعًا حول المعادلة والمحتوى وخطط الدراسة.';
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url: siteUrl.replace(/\/$/, '') + '/faq' });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical();
	}

	ngOnInit() {
		this.contentService.loadPageState('faq', { ...(cmsPageDefaults.faq as object), faqs: this.faqs }).subscribe(content => {
			const state = content as { faqs?: Array<{ q: string; a: string }> };
			if (Array.isArray(state.faqs)) {
				const existingQuestions = new Set(state.faqs.map(item => item.q));
				this.faqs = [
					...state.faqs,
					...this.faqs.filter(item => !existingQuestions.has(item.q)),
				];
			}
		});

		// محاكاة تحميل البيانات لإظهار الـ animations بشكل صحيح
		setTimeout(() => {
			this.isLoading = false;
		}, 300);
	}
	toggle(i: number) { this.openIndex = this.openIndex === i ? null : i; }
  filteredFaqs() {
    const q = this.query.trim();
    if (!q) return this.faqs;
    const lower = q.toLowerCase();
    return this.faqs.filter(item =>
      (item.q + ' ' + item.a).toLowerCase().includes(lower)
    );
  }
}
