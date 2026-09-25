import { monthlyContentDefaults } from './monthly-content.defaults';

export type CmsPageKey =
	| 'home'
	| 'photos-2025'
	| 'faq'
	| 'contact'
	| 'news-equation'
	| 'news-app'
	| 'news-detail'
	| 'subscription-details'
	| 'subscription-ab-reviews'
	| 'subscription-intensive'
	| 'social'
	| 'engineers'
	| 'teacher-details'
	| 'requirements'
	| 'schools'
	| 'batch-2027'
	| 'success-stories'
	| 'feedback'
	| 'subscription-computers'
	| 'subscription-engineering-ar'
	| 'subscription-engineering-en'
	| 'subscription-computers-ar'
	| 'subscription-computers-en';

export type SubscriptionCmsPageKey = 'subscription-engineering-ar' | 'subscription-engineering-en' | 'subscription-computers-ar' | 'subscription-computers-en';

export type LiveCmsPageKey = 'batch-2027' | 'success-stories' | 'feedback' | 'subscription-computers';
export type AnyCmsPageKey = CmsPageKey | LiveCmsPageKey;

export interface CmsPageOption {
	key: CmsPageKey;
	route: string;
	title: string;
	description: string;
	group: string;
}

export const cmsPageOptions: CmsPageOption[] = [
	{ key: 'home', route: '/', title: 'الرئيسية', description: 'الهيرو، المميزات، الصور، ونصوص الصفحة الرئيسية', group: 'صفحات أساسية' },
	{ key: 'faq', route: '/faq', title: 'الأسئلة الشائعة', description: 'الأسئلة والإجابات وترتيب ظهورها', group: 'صفحات أساسية' },
	{ key: 'contact', route: '/success-story', title: 'التواصل والسوشيال', description: 'أرقام الواتساب والتليفون وروابط التواصل التي تظهر في الموقع', group: 'صفحات أساسية' },
	{ key: 'requirements', route: '/requirements', title: 'شروط المعادلة', description: 'الشروط والمستندات وخطوات التقديم للطلاب', group: 'الإصدار الحالي' },
	{ key: 'batch-2027', route: '/batch-2027', title: 'دفعة 2027 والعجلة', description: 'الهيرو، خيارات المعادلة، بيانات التسجيل ورسائل العجلة', group: 'الإصدار الحالي' },
	{ key: 'success-stories', route: '/success-stories', title: 'قصص النجاح', description: 'عنوان الصفحة ووصفها وقائمة قصص الطلاب', group: 'الإصدار الحالي' },
	{ key: 'feedback', route: '/feedback', title: 'آراء الطلاب', description: 'نصوص صفحة جمع آراء الطلاب', group: 'الإصدار الحالي' },
	{ key: 'photos-2025', route: '/photos-2025', title: 'صور الطلاب', description: 'ألبومات وصور الطلاب الناجحين', group: 'المحتوى' },
	{ key: 'news-equation', route: '/news-equation', title: 'أخبار المعادلة', description: 'أخبار المعادلة والمواعيد والتنبيهات', group: 'المحتوى' },
	{ key: 'engineers', route: '/engineers-ar', title: 'المهندسين والمدرسين', description: 'بيانات المدرسين والمواد والصور', group: 'المحتوى' },
	{ key: 'schools', route: '/schools', title: 'المدارس والمعاهد', description: 'دليل المدارس والمعاهد والتصنيفات', group: 'المحتوى' },
	{ key: 'subscription-engineering-ar', route: '/subscription-engineering-ar', title: 'اشتراك هندسة عربي — دفعة 2027', description: 'محتوى الشهر والفورم والدفع والجدول', group: 'الاشتراكات' },
	{ key: 'subscription-engineering-en', route: '/subscription-engineering-en', title: 'اشتراك هندسة إنجليزي — دفعة 2027', description: 'محتوى الشهر والفورم والدفع والجدول', group: 'الاشتراكات' },
	{ key: 'subscription-computers-ar', route: '/subscription-computers-ar', title: 'اشتراك حاسبات عربي — دفعة 2027', description: 'محتوى الشهر والفورم والدفع والجدول', group: 'الاشتراكات' },
	{ key: 'subscription-computers-en', route: '/subscription-computers-en', title: 'اشتراك حاسبات إنجليزي — دفعة 2027', description: 'محتوى الشهر والفورم والدفع والجدول', group: 'الاشتراكات' },
	{ key: 'subscription-intensive', route: '/subscription-intensive', title: 'الاشتراك المكثف', description: 'خطط المكثف والدفع والفودافون كاش', group: 'الاشتراكات' },
];

export const cmsPageDefaults: Record<CmsPageKey, unknown> = {
	home: {
		visible: true,
		seo: {
			title: 'ابلكيشن معادلة كلية هندسة',
			description: 'بنجهّزك لاجتياز معادلة كلية الهندسة بخطوات واضحة ومحتوى مُبسّط وتمارين عملية.'
		},
		hero: {
			title: 'ابلكيشن معادلة كلية هندسة',
			features: ['مناهج بسيطة مُحدّثة 2026 ', 'شرح + أمثلة + امتحانات إلكترونية', 'خطط مذاكرة تناسب وقتك', 'دعم ومتابعة علي مدار 24 ساعة'],
			descriptions: [
				{ text: 'أعلي نسبة نجاح في مصر', highlight: ['أعلي نسبة نجاح', 'مصر'] },
				{ text: 'قوانين اللعبة اتغيــرت', highlight: [' اللعبة', ' اتغيــرت'] },
				{ text: 'أكبر فريق مساعدين في مصر لطلاب المعادلة', highlight: ['أكبر فريق مساعدين', 'مصر', 'طلاب المعادلة'] },
				{ text: 'بنجهزك لإجتياز معادلة هندسة بسهولة', highlight: ['بنجهزك', 'معادلة هندسة', 'بسهولة'] },
				{ text: 'بنجهزك لإجتياز معادلة حاسبات بسهولة', highlight: ['بنجهزك', 'معادلة حاسبات', 'بسهولة'] },
				{ text: 'معادلة هندسة وحاسبات بالعربي والإنجليزي', highlight: ['معادلة هندسة وحاسبات', 'بالعربي والإنجليزي'] },
				{ text: 'دعم ومتابعة علي مدار اليوم', highlight: ['دعم ومتابعة', 'مدار اليوم'] },
				{ text: 'طاقم هندسي علي أعلي مستوي', highlight: ['طاقم هندسي', 'أعلي مستوي'] }
			]
		},
		photos: {
			visible: true,
			items: []
		}
	},
	'photos-2025': {
		visible: true,
		title: 'صور طلاب 2025',
		description: 'معرض نجاح طلاب المعادلة',
		albums: []
	},
	faq: {
		visible: true,
		seo: {
			title: 'الأسئلة الشائعة - معادلة كلية هندسة',
			description: 'إجابات لأكثر الأسئلة شيوعًا حول المعادلة والمحتوى وخطط الدراسة.'
		},
		faqs: [
			{ q: 'يعنى ايه معادلة كلية هندسة؟', a: 'هى مسابقة بينظمها المجلس الاعلي للجامعات لطلاب التعليم الفني الصناعي للالتحاق باحدي كليات الهندسة الحكومية.' },
			{ q: 'مين الطلاب المسموح ليهم التقديم على المعادلة؟', a: 'طلاب التعليم الفني الصناعي الدبلومات و المعاهد الفنية الصناعية.' }
		]
	},
	contact: {
		visible: true,
		studentWhatsapp: '201554843745',
		parentWhatsapp: '201554843745',
		phoneNumber: '+201554843745',
		seo: {
			title: 'تواصل معنا - ابلكيشن معادلة كلية هندسة',
			description: 'تواصل معنا عبر واتساب للطلاب وأولياء الأمور أو اتصل بنا مباشرة.'
		}
	},
	'news-equation': {
		visible: true,
		title: 'أخبار المعادلة',
		items: []
	},
	'news-app': {
		visible: true,
		title: 'أخبار الأبلكيشن',
		items: []
	},
	'news-detail': {
		visible: true,
		articles: []
	},
	'engineers': {
		visible: true,
		title: 'المهندسين والمدرسين',
		people: []
	},
	'teacher-details': {
		visible: true,
		profiles: []
	},
	requirements: {
		visible: true,
		title: 'كل شروط المعادلة في مكان واحد',
		description: 'راجع الشروط والمستندات وخطوات التقديم قبل ما تبدأ، وخليك جاهز لكل مرحلة في طريقك لكلية الهندسة.',
		engineeringConditions: ['لا يمكن استرداد المقابل المادي للاختبارات.', 'الحصول علي 70% فأكثر لطلبة دبلوم 3 سنوات.', 'الحصول علي 50% فأكثر لطلاب الدبلوم 5 سنوات وطلاب المعاهد الفنية.', 'الدفعات المطلوبة: خريجي أعوام 2025 و2026.', 'فرصة واحدة فقط خلال عامين متتاليين.'],
		computersConditions: ['يشترط أن يكون الطالب من طلاب التعليم التكنولوجي.', 'الحصول على 70% فأكثر لطلاب الدبلوم 3 سنوات.', 'الحصول على 50% فأكثر لطلاب الدبلوم 5 سنوات وطلاب المعاهد الفنية.', 'الدفعات المطلوبة: خريجو أعوام 2025 و2026.', 'فرصة واحدة فقط خلال عامين متتاليين.', 'مواد المعادلة: رياضة عامة، رياضة خاصة، فيزياء، وإنجليزي.'],
		documents: ['أصل شهادة التخرج', 'صورة الرقم القومي', 'صورة شخصية', 'إيصال الدفع'],
		steps: [{ title: 'الدخول على الموقع', description: 'اختيار نوع الامتحان وإدخال بيانات المتقدم الأساسية.' }, { title: 'دفع رسوم الامتحانات', description: 'عبر رابط الدفع الإلكتروني.' }, { title: 'إنشاء ملف PDF', description: 'عمل Scan للمستندات وتحويلها إلى PDF.' }, { title: 'رفع الملف', description: 'رفع ملف الـ PDF على نظام التقديم.' }, { title: 'متابعة حالة الطلب', description: 'بعد الاستكمال خلال يومين عمل.' }, { title: 'تعديل الطلب', description: 'في حالة الرفض واستكمال البيانات الناقصة.' }, { title: 'متابعة رقم الجلوس', description: 'بعد قبول الطلب.' }]
	},
	schools: {
		visible: true,
		title: 'المدارس والمعاهد',
		items: []
	},
	social: {
		visible: true,
		links: []
	},
	'subscription-details': monthlyContentDefaults['subscription-details'],
	'subscription-ab-reviews': monthlyContentDefaults['subscription-ab-reviews'],
	'subscription-intensive': monthlyContentDefaults['subscription-intensive'],
	'subscription-computers': monthlyContentDefaults['subscription-ab-reviews']
	,
	'subscription-engineering-ar': monthlyContentDefaults['subscription-ab-reviews'],
	'subscription-engineering-en': monthlyContentDefaults['subscription-ab-reviews'],
	'subscription-computers-ar': monthlyContentDefaults['subscription-ab-reviews'],
	'subscription-computers-en': monthlyContentDefaults['subscription-ab-reviews'],
	'batch-2027': {
		visible: true,
		eyebrow: 'مشوارك يبدأ من هنا',
		title: 'كلية هندسة',
		highlight: 'أقرب مما تتخيل',
		features: ['شرح مبسط وخطة واضحة', 'متابعة مستمرة معاك', 'محتوى متحدث لدفعة 2027'],
		programOptions: ['معادلة هندسة عربي', 'معادلة حاسبات عربي', 'معادلة هندسة إنجليزي', 'معادلة حاسبات إنجليزي'],
		studentTypeOptions: ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 3 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 5 سنوات'],
		sourceOptions: ['فيسبوك', 'إنستجرام', 'تيك توك', 'يوتيوب', 'ترشيح من صديق', 'أخرى'],
		joinEyebrow: 'خليك أول واحد يعرف',
		joinTitle: 'سجل دلوقتي',
		joinHighlight: 'وخد أولوية العروض والخصومات',
		joinDescription: 'سيب بياناتك واحجز أولوية التواصل قبل بداية الدفعة الجديدة.',
		submitLabel: 'احصل على الخصم الآن'
	},
	'success-stories': {
		visible: true,
		eyebrow: 'قصص حقيقية من طلابنا',
		title: 'كل خطوة صغيرة',
		highlight: 'بتقرّبك من حلمك',
		description: 'شوف تجارب طلاب بدأوا من نفس المكان، وكملوا بطريقتهم لحد ما حققوا هدفهم.',
		stories: []
	},
	feedback: {
		visible: true,
		eyebrow: 'صوتك يهمنا',
		title: 'قول رأيك في الأبليكيشن',
		description: 'رأيك بيساعدنا نطوّر المحتوى والمتابعة ونقدّم تجربة أفضل لكل طالب.'
	}
};

