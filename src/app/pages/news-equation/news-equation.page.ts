import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
	selector: 'app-news-equation',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './news-equation.page.html',
	styleUrls: ['./news-equation.page.css']
})
export class NewsEquationPageComponent implements OnInit {
	newsItems = [
		{
			id: 4,
			title: 'جدول اختبارات معادلة كلية الهندسة 2026',
			excerpt: 'أعلن المجلس الأعلى للجامعات جدول اختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027 بداية من 12 سبتمبر وحتى 17 سبتمبر 2026.',
			date: '2026-07-31',
			image: '/assets/جدول اختبارات معادلة كلية الهندسة .jpeg',
			slug: 'engineering-equation-exam-schedule-2026',
			content: 'أعلن المجلس الأعلى للجامعات جدول اختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027، وجاءت مواعيد الامتحانات من 12 سبتمبر حتى 17 سبتمبر 2026.',
			category: 'جداول الامتحانات',
			important: true
		},
		// {
		// 	id: 1,
		// 	title: 'كتاب امتحانات الأبلكيشن',
		// 	excerpt: 'كتاب امتحانات الأبلكيشن يضم مجموعة كبيرة من الامتحانات الشاملة التي تساعد الطالب على التدرب على شكل الأسئلة الحقيقية ويحتوي على إجابات نموذجية',
		// 	date: '2025-05-20',
		// 	image: '/assets/logo2.png',
		// 	slug: 'App-Book-2025',
		// 	content: 'كتاب امتحانات الأبلكيشن يضم مجموعة كبيرة من الامتحانات الشاملة التي تساعد الطالب على التدرب على شكل الأسئلة الحقيقية ويحتوي على إجابات نموذجية لزيادة الفهم والثقة',
		// 	category: 'الكتب والمراجع',
		// 	important: false
		// },
		{
			id: 2,
			title: 'فرصة واحدة فقط لاختبارات المعادلة لدفعة 2025',
			excerpt: 'اعتباراً من دفعة عام 2025، أصبحت فرص التقدم لاختبارات المعادلة فرصة واحدة فقط خلال عامين متتاليين تحسب ابتداء من عام حصول الطالب على المؤهل والعام الذي يليه',
			date: '2025-06-22',
			image: '/assets/success.png',
			slug: 'one-chance-only-2025',
			content: 'اعتباراً من دفعة عام 2025 من الطلاب الحاصلين على الدبلومات والمعاهد الفنية والمتقدمين لامتحانات الدبلومات والمعاهد في العام الجامعي 2025/2026 أصبحت فرص التقدم لاختبارات الدبلومات والمعاهد هذا العام ٢٠٢٥ هي فرصة واحدة فقط خلال عامين متتاليين تحسب ابتداء من عام حصول الطالب على المؤهل والعام الذي يليه',
			category: 'شروط المعادلة',
			important: false
		},
		{
			id: 3,
			title: 'قبول خريجي مدارس التكنولوجيا التطبيقية في المعادلة',
			excerpt: 'السماح لخريجي مدارس التكنولوجيا التطبيقية وتكنولوجيا المعلومات والذكاء الاصطناعي من الحاصلين على 75% فأكثر بأداء امتحانات المعادلة',
			date: '2025-06-22',
			image: '/assets/we.jpg',
			slug: 'tech-schools-acceptance-2025',
			content: 'السماح للطلاب خريجي مدرسة تكنولوجيا المعلومات بالإسماعيلية ومدرسة أي تك - I-TECH) وخريجي مدارس التكنولوجيا التطبيقية تخصص تكنولوجيا المعلومات - الذكاء الاصطناعي - برمجيات وخريجي مدارس WE للتكنولوجيا التطبيقية من الحاصلين على 75% فأكثر من مجموع درجات شهادة الدبلوم بأداء امتحانات في مواد (رياضة - رياضة - فيزياء - لغة انجليزية مع اختبارات الدبلومات والمعاهد التي تعقد بكليات الهندسة المعنية وتحت إشراف أمانة المجلس الأعلى للجامعات، وذلك اعتباراً من دفعة 2025 فقط.',
			category: 'قبول خاص',
			important: false
		},
		{
			id: -5,
			title: 'المجلس الأعلى للجامعات يعلن فتح باب التقديم لاختبارات معادلة كلية الهندسة 2026',
			excerpt: 'أعلن المجلس الأعلى للجامعات فتح باب التقديم لاختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027، والتسجيل متاح إلكترونيًا خلال الفترة المحددة.',
			date: '2026-07-31',
			image: '/assets/خبر فتح باب التقديم.jpeg',
			slug: 'engineering-equation-application-open-2026',
			content: 'أعلن المجلس الأعلى للجامعات فتح باب التقديم لاختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027، والتسجيل متاح إلكترونيًا خلال الفترة المحددة.',
			category: 'التقديم والقبول',
			important: true
		},
		{
			id: -4,
			title: 'كتاب أبلكيشن معادلة كلية الهندسة 📘💪',
			excerpt: 'بتعمل معادلة ومش لاقي مصدر موثوق تحل منه؟ أقوى تجميعة أسئلة وتمارين وامتحانات مهمة مصممة علشان توصّلك للنجاح بثقة.',
			date: '2026-05-07',
			image: '/assets/خبر الكتاب.png',
			slug: 'app-book-order-2026',
			content: 'كتاب أبلكيشن معادلة كلية الهندسة يضم مجموعة كبيرة من الأسئلة والتمارين والامتحانات المهمة.',
			category: 'الكتب والمراجع',
			important: true
		},
		{
			id: -3,
			title: 'فرصة التأسيس المبكر لدفعة 2027 🚀🔥',
			excerpt: 'لو الإنجليزي عندك عائق أو مستواك صفر، هنبدأ معاك من البداية خطوة بخطوة عشان تدخل المعادلة وأنت جاهز.',
			date: '2026-05-03',
			image: '/assets/جروب السنة الجديدة 2027.png',
			slug: 'group-2027-foundation',
			content: 'فرصة التأسيس المبكر لطلاب دفعة 2027 خطوة بخطوة.',
			category: 'الكورسات والدورات',
			important: true
		},
		{
			id: -2,
			title: 'جروب إنجليزي جديد لطلاب المكثف — من الصفر خطوة بخطوة 🔥',
			excerpt: 'فتحنا جروب مجاني لطلاب المكثف هنبدأ فيه من الصفر حرفيًا مع التركيز على الكلمات والنطق والتأسيس.',
			date: '2026-05-01',
			image: '/assets/خبر جروب الانجليزي.jpeg',
			slug: 'english-group-intensive-2026',
			content: 'جروب إنجليزي جديد لطلاب المكثف يبدأ من الصفر.',
			category: 'الكورسات والدورات',
			important: true
		},
		{
			id: -1,
			title: 'انطلاق جروب C رسميًا على ابلكيشن معادلة كلية الهندسة',
			excerpt: 'جروب C بدأ رسميًا لبداية قوية وطريق واضح إلى كلية الهندسة.',
			date: '2026-01-24',
			image: '/assets/جروب جديد.jpg.jpeg',
			slug: 'group-c-launch-2026',
			content: 'انطلاق جروب C رسميًا على الأبلكيشن.',
			category: 'الكورسات والدورات',
			important: true
		},
		{
			id: 0,
			title: '7 أيام تجريبية مجاناً لطلاب المعادلة',
			excerpt: 'جرب الأبلكيشن بالكامل واحصل على كود مجاني لمدة 7 أيام – العرض ساري لفترة محدودة.',
			date: '2026-01-21',
			image: '/assets/اكواد مجانية.jpg',
			slug: 'free-week-codes-2025',
			content: '7 أيام تجريبية مجاناً لطلاب المعادلة.',
			category: 'عروض خاصة',
			important: true
		},
		{
			id: 5,
			title: 'تفاصيل خطة الإنجليزي مع دكتور عمر أحمد',
			excerpt: 'خطة شاملة لتعلم اللغة الإنجليزية مع دكتور عمر أحمد.',
			date: '2025-11-03',
			image: '/assets/خبر الإنجليزي.jpg',
			slug: 'english-plan-dr-omar-2025',
			content: 'تفاصيل خطة الإنجليزي مع دكتور عمر أحمد.',
			category: 'الكورسات والدورات',
			important: false
		},
		{
			id: 6,
			title: 'نظام المتابعة في الأبلكيشن حاجة تانية',
			excerpt: 'نظام تقييمات شامل لضمان التزام الطلاب.',
			date: '2025-11-01',
			image: '/assets/نظام المتابعة.jpg',
			slug: 'monitoring-system-2025',
			content: 'نظام المتابعة في الأبلكيشن.',
			category: 'أنظمة الأبلكيشن',
			important: false
		},
		{
			id: 7,
			title: 'كتاب امتحانات الأبلكيشن',
			excerpt: 'كتاب امتحانات الأبلكيشن يضم مجموعة كبيرة من الامتحانات الشاملة.',
			date: '2025-05-20',
			image: '/assets/كتاب.jpg',
			slug: 'App-Book-2025',
			content: 'كتاب امتحانات الأبلكيشن.',
			category: 'الكتب والمراجع',
			important: false
		},
		{
			id: 8,
			title: 'الكورس المكثف الجديد',
			excerpt: 'شرح كامل للمنهج الدراسي مع تدريبات متنوعة للتطبيق العملي.',
			date: '2025-06-22',
			image: '/assets/مكثف.jpg',
			slug: 'intensive-course-2025',
			content: 'الكورس المكثف الجديد.',
			category: 'الكورسات والدورات',
			important: false
		},
		// {
		// 	id: 3,
		// 	title: 'تحديثات جديدة في شروط المعادلة للعام 2026',
		// 	excerpt: 'تم الإعلان عن تحديثات مهمة في شروط المعادلة للطلاب الراغبين في الالتحاق بكليات الهندسة',
		// 	date: '2024-01-15',
		// 	image: '/assets/success.png',
		// 	slug: 'equation-requirements-2024'
		// },
		// {
		// 	id: 2,
		// 	title: 'قائمة جديدة من المدارس المعتمدة للمعادلة',
		// 	excerpt: 'تم إضافة 15 مدرسة جديدة إلى قائمة المدارس المعتمدة للمعادلة في مختلف المحافظات',
		// 	date: '2024-01-10',
		// 	image: '/assets/logo2.png',
		// 	slug: 'new-approved-schools-2024'
		// },
		// {
		// 	id: 3,
		// 	title: 'مواعيد امتحانات المعادلة للفصل الدراسي الثاني',
		// 	excerpt: 'تم الإعلان عن مواعيد امتحانات المعادلة للفصل الدراسي الثاني مع إجراءات التسجيل',
		// 	date: '2024-01-05',
		// 	image: '/assets/logo2.png',
		// 	slug: 'exam-schedule-semester-2'
		// },
		// {
		// 	id: 4,
		// 	title: 'تحديثات في نظام التقديم الإلكتروني',
		// 	excerpt: 'تم تطوير نظام التقديم الإلكتروني ليكون أكثر سهولة وسرعة للطلاب',
		// 	date: '2024-01-01',
		// 	image: '/assets/logo2.png',
		// 	slug: 'electronic-application-update'
		// },
		// {
		// 	id: 5,
		// 	title: 'ورش عمل مجانية لطلاب المعادلة',
		// 	excerpt: 'تنظيم ورش عمل مجانية لمساعدة الطلاب في التحضير لامتحانات المعادلة',
		// 	date: '2023-12-28',
		// 	image: '/assets/logo2.png',
		// 	slug: 'free-workshops-students'
		// },
		// // {
		// 	id: 6,
		// 	title: 'نتائج امتحانات المعادلة للفصل الأول',
		// 	excerpt: 'تم الإعلان عن نتائج امتحانات المعادلة للفصل الدراسي الأول مع إحصائيات النجاح',
		// 	date: '2023-12-20',
		// 	image: '/assets/logo2.png',
		// 	slug: 'exam-results-semester-1'
		// }
	];

	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private monthlyContent: MonthlyContentService
	) {}

	ngOnInit(): void {
		this.monthlyContent.loadPageState('news-equation', { visible: true, title: 'أخبار المعادلة', items: this.newsItems }).subscribe((state: any) => {
			if (state?.visible === false) return;
			if (Array.isArray(state?.items) && state.items.length) this.newsItems = state.items;
		});
		if (typeof window !== 'undefined') {
			const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
			const title = 'أخبار المعادلة - ابلكيشن معادلة كلية هندسة';
			const description = 'تابع أخبار معادلة هندسة وحاسبات وآخر تحديثات أبلكيشن معادلة كلية الهندسة والمواعيد والشروط والقرارات المهمة';
			const url = `${siteUrl}/news/equation`;
			
			this.seo.setTitle(title);
			this.seo.setDescription(description);
			this.seo.setOgTags({ title, description, url });
			this.seo.setTwitterTags({ title, description });
			this.canonical.setCanonical(url);
		}
	}

	formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ar-EG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
}
