import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
	selector: 'app-news-detail',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './news-detail.page.html',
	styleUrls: ['./news-detail.page.css']
})
export class NewsDetailPageComponent implements OnInit {
	newsItem: any = null;
	newsId: string = '';

	isEquationNews(): boolean {
		const category = this.newsItem?.category;
		return Boolean(this.newsItem?.id?.startsWith('engineering-') || category === 'أخبار المعادلة' || category === 'التقديم والقبول' || category === 'جداول الامتحانات');
	}

	constructor(
		private route: ActivatedRoute,
		private location: Location,
		private seo: SeoService,
		private canonical: CanonicalService,
		private monthlyContent: MonthlyContentService
	) { }

	// Mock data - في التطبيق الحقيقي ستحصل على البيانات من API
	newsData: { [key: string]: any } = {
		'engineering-equation-application-open-2026': {
			id: 'engineering-equation-application-open-2026',
			title: 'المجلس الأعلى للجامعات يعلن فتح باب التقديم لاختبارات معادلة كلية الهندسة 2026',
			content: `
				<div class="mb-8 text-center">
					<img src="/assets/خبر فتح باب التقديم.jpeg" alt="فتح باب التقديم لاختبارات معادلة كلية الهندسة 2026" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>

				<div class="bg-orange-50 border-l-4 border-orange-500 p-6 mb-6">
					<h3 class="text-orange-800 font-bold mb-3 text-2xl">المجلس الأعلى للجامعات يعلن فتح باب التقديم لاختبارات معادلة كلية الهندسة 2026</h3>
					<p class="text-orange-700 text-lg">
						أعلن المجلس الأعلى للجامعات فتح باب التقديم لاختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027.
					</p>
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">أهم التفاصيل</h3>
					<ul class="space-y-3 text-blue-700 text-lg list-none">
						<li>📅 بدء التقديم رسميًا عبر الموقع الإلكتروني للمجلس الأعلى للجامعات.</li>
						<li>👨‍🎓 التقديم متاح لطلاب الدبلومات الفنية والمعاهد الفنية وفقًا للشروط المعلنة.</li>
						<li>📝 يتم التسجيل إلكترونيًا خلال الفترة المحددة.</li>
						<li>⏳ ننصح جميع الطلاب بسرعة إنهاء إجراءات التقديم وعدم الانتظار لآخر موعد.</li>
					</ul>
				</div>

				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-3 text-xl">مساعدة في التقديم</h3>
					<p class="text-green-700 text-lg mb-4">
						لو بتوجهك مشاكل في التقديم وفرنا رقم تقدر تتواصل معانا عبر واتساب.
					</p>
					<a href="https://wa.me/201013305510" target="_blank"
					   class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors no-underline hover:no-underline">
						تواصل واتساب: 01013305510
					</a>
				</div>
			`,
			date: '2026-07-31',
			author: 'فريق الابلكيشن',
			category: 'التقديم والقبول',
			important: true,
			image: '/assets/خبر فتح باب التقديم.jpeg',
			images: ['/assets/خبر فتح باب التقديم.jpeg']
		},
		'engineering-equation-exam-schedule-2026': {
			id: 'engineering-equation-exam-schedule-2026',
			title: 'جدول اختبارات معادلة كلية الهندسة 2026',
			content: `
				<div class="mb-8 text-center">
					<img src="/assets/جدول اختبارات معادلة كلية الهندسة .jpeg" alt="جدول اختبارات معادلة كلية الهندسة 2026" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>

				<div class="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
					<h3 class="text-red-800 font-bold mb-3 text-2xl">خبر هام | جدول اختبارات معادلة كلية الهندسة 2026</h3>
					<p class="text-red-700 text-lg">
						أعلن المجلس الأعلى للجامعات جدول اختبارات معادلة كلية الهندسة للعام الجامعي 2026/2027.
					</p>
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">مواعيد الامتحانات</h3>
					<ul class="space-y-3 text-blue-700 text-lg list-none">
						<li>📅 12 سبتمبر 2026: اللغة الإنجليزية.</li>
						<li>📅 13 سبتمبر 2026: رياضة (1) (الجبر والهندسة الفراغية).</li>
						<li>📅 14 سبتمبر 2026: رياضة (2) (التفاضل والتكامل).</li>
						<li>📅 15 سبتمبر 2026: الفيزياء.</li>
						<li>📅 16 سبتمبر 2026: الميكانيكا.</li>
						<li>📅 17 سبتمبر 2026: الكيمياء.</li>
					</ul>
				</div>

				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
					<h3 class="text-yellow-800 font-bold mb-3 text-xl">تنويه مهم</h3>
					<p class="text-yellow-700 text-lg">
						تُعقد الاختبارات وفق أماكن التوزيع الجغرافي التي يحددها المجلس الأعلى للجامعات.
					</p>
				</div>
			`,
			date: '2026-07-31',
			author: 'فريق المعادلة',
			category: 'جداول الامتحانات',
			important: true,
			image: '/assets/جدول اختبارات معادلة كلية الهندسة .jpeg',
			images: ['/assets/جدول اختبارات معادلة كلية الهندسة .jpeg']
		},
		'app-book-order-2026': {
			id: 'app-book-order-2026',
			title: 'كتاب أبلكيشن معادلة كلية الهندسة 📘💪',
			content: `
				<div class="mb-8 text-center">
					<img src="/assets/خبر الكتاب.png" alt="كتاب أبلكيشن معادلة كلية الهندسة" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>

				<div class="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 mb-6 text-center">
					<h3 class="text-orange-800 font-bold mb-3 text-2xl">🤔 بتعمل معادلة ومش لاقي مصدر موثوق تحل منه؟</h3>
					<p class="text-orange-700 text-lg font-semibold mb-2">بتجهز نفسك للأمتحان.. يبقي لازم يكون معاك كتاب الابلكيشن 🔥📚</p>
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-3 text-xl">📘💪 كتاب أبلكيشن معادلة كلية الهندسة</h3>
					<p class="text-blue-700 text-lg">أقوى تجميعة أسئلة – تمارين – امتحانات مهمة مصممة علشان توصّلك للنجاح بثقة 🎯</p>
				</div>

				<hr class="my-6 border-gray-300">

				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-4 text-xl">📌 طريقة حجز الباكدج:</h3>
					<ol class="space-y-3 text-green-700 text-lg list-none">
						<li>1️⃣ <strong>السعر:</strong> 500 جنيه + مصاريف الشحن</li>
						<li>2️⃣ ادخل على اللينك 👇
							<div class="mt-2">
								<a href="https://booxtore.net/product/333" target="_blank"
								   class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors no-underline hover:no-underline">
									🛒 رابط الشراء
								</a>
							</div>
						</li>
						<li>3️⃣ املى بياناتك بالكامل واضغط شراء</li>
					</ol>
					<p class="text-green-700 mt-4 font-semibold">🚛 الشحن خلال أسبوع بعد توافر الكتاب في المتجر</p>
				</div>

				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
					<h3 class="text-yellow-800 font-bold mb-3 text-xl">⚠️ الدفع عن طريق فوري</h3>
					<p class="text-yellow-700 text-lg">(هيظهرلك كود الدفع بعد تسجيل البيانات مباشرة)</p>
				</div>

				<hr class="my-6 border-gray-300">

				<div class="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6">
					<h3 class="text-purple-800 font-bold mb-4 text-xl">📌 ملحوظة مهمة:</h3>
					<ul class="space-y-2 text-purple-700 text-lg list-none">
						<li>▪️ لازم تعمل أكونت على موقع الكُتب لو مش عامل</li>
						<li>▪️ بعد كده تسجل دخول</li>
						<li>▪️ تختار المرحلة تالتة ثانوي</li>
						<li>▪️ وفي خطوة الشراء تختار كتب الأبلكيشن</li>
					</ul>
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-3 text-xl">🎥 فيديو سريع يوضح خطوات الشراء 👇</h3>
					<a href="https://www.facebook.com/share/v/1JNXm7apAp/" target="_blank"
					   class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors no-underline hover:no-underline">
						▶️ شاهد الفيديو
					</a>
				</div>

				<hr class="my-6 border-gray-300">

				<div class="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
					<h3 class="text-red-800 font-bold mb-4 text-xl">⚠️ تنبيهات هامة:</h3>
					<ul class="space-y-2 text-red-700 text-lg list-none">
						<li>▪️ ادفع فورًا بعد ظهور كود فوري قبل انتهاء صلاحيته</li>
						<li>▪️ مدة صلاحية الكود هتوصلك في رسالة مع الكود</li>
					</ul>
				</div>

				<div class="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl text-white text-center">
					<p class="text-xl font-bold">🔥 ابدأ من دلوقتي… وخلي النجاح قرارك مش صدف</p>
				</div>
			`,
			date: '2026-05-07',
			author: 'فريق الابلكيشن',
			category: 'الكتب والمراجع',
			important: true,
			image: '/assets/خبر الكتاب.png',
			images: ['/assets/خبر الكتاب.png']
		},
		'group-2027-foundation': {
			id: 'group-2027-foundation',
			title: 'فرصة التأسيس المبكر لدفعة 2027 🚀🔥',
			content: `
				<div class="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-6 mb-6">
					<h3 class="text-orange-800 font-bold mb-3 text-2xl">🚀 فرصة التأسيس المبكر لدفعة 2027 🔥</h3>
					<p class="text-orange-700 text-lg font-semibold mb-2">لو الإنجليزي عندك عائق أو مستواك "صفر"..</p>
					<p class="text-orange-700 text-lg font-bold">فإحنا هنبدأ معاك من البداية خالص خطوة بخطوة عشان تدخل المعادلة وأنت جاهز 🎓✨</p>
				</div>

				<div class="mb-8 text-center">
					<img src="/assets/جروب السنة الجديدة 2027.png" alt="فرصة التأسيس المبكر دفعة 2027" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">🔹 نظام الجروب:</h3>
					<ul class="space-y-3 text-blue-700 text-lg">
						<li>▫️ تأسيس من الصفر بشكل مبسط وسهل</li>
						<li>▫️ محتوى منظم: تقسيم كلمات أسبوعيًا بدون ضغط</li>
						<li>▫️ تسميع دوري كل يوم (أربعاء) لتثبيت المعلومات</li>
						<li>▫️ دعم مباشر: الجروب بيفتح (الأحد والأربعاء) للنقاش والأسئلة</li>
					</ul>
				</div>

				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6 text-center">
					<h3 class="text-green-800 font-bold mb-3 text-xl">🔥 الجروب مجاني بالكامل..</h3>
					<p class="text-green-700 text-lg font-semibold">كل المطلوب منك الالتزام 💪</p>
				</div>

				<div class="bg-teal-50 border-l-4 border-teal-500 p-6 mb-6 text-center">
					<h3 class="text-teal-800 font-bold mb-4 text-xl">🔗 رابط الانضمام</h3>
					<a href="https://t.me/application2027" target="_blank"
					   class="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors no-underline hover:no-underline text-lg">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
						</svg>
						<span>انضم للجروب المجاني</span>
					</a>
				</div>

				<div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
					<p class="text-slate-600 text-sm">#معادلة_كلية_الهندسة &nbsp; #دفعة_2027 &nbsp; #إنجليزي_من_الصفر</p>
				</div>
			`,
			date: '2026-05-03',
			author: 'فريق المعادلة',
			category: 'الكورسات والدورات',
			important: true,
			image: '/assets/جروب السنة الجديدة 2027.png',
			images: ['/assets/جروب السنة الجديدة 2027.png']
		},
		'english-group-intensive-2026': {
			id: 'english-group-intensive-2026',
			title: 'جروب إنجليزي جديد لطلاب المكثف — من الصفر خطوة بخطوة 🔥',
			content: `
				<div class="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-6 mb-6">
					<h3 class="text-orange-800 font-bold mb-3 text-2xl">أبلكيشن معادلة كلية الهندسة 🔥</h3>
					<p class="text-orange-700 text-lg font-semibold mb-2">لو الإنجليزي عندك صفر… ولسه مبدأتش أو حتى أقل من كده 😅</p>
					<p class="text-orange-700 text-lg font-bold">فـ الخبر ده معمول ليك أنت بالظبط!</p>
				</div>

				<div class="mb-8 text-center">
					<img src="/assets/خبر جروب الانجليزي.jpeg" alt="جروب إنجليزي مكثف" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>

				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">🚀 فتحنا جروب جديد لطلاب المكثف</h3>
					<p class="text-blue-700 text-lg mb-2">هنبدأ فيه من الصفر حرفيًا</p>
					<p class="text-blue-700">يعني حتى لو مش عارف كلمة واحدة… هتمشي معانا خطوة بخطوة</p>
				</div>

				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-4 text-xl">💡 هنركز على:</h3>
					<ul class="space-y-3 text-green-700 text-lg">
						<li>✔️ كلمات أساسية مهمة</li>
						<li>✔️ نطق صح</li>
						<li>✔️ تأسيس يخليك تفهم وتكمل باقي المنهج بسهولة</li>
					</ul>
				</div>

				<div class="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6">
					<h3 class="text-purple-800 font-bold mb-3 text-xl">🎯 الهدف</h3>
					<p class="text-purple-700 text-lg">مش تحفظ وخلاص… الهدف إنك تفهم وتبقى واثق</p>
				</div>

				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
					<h3 class="text-yellow-800 font-bold mb-2 text-xl">⏳ متأجلش البداية…</h3>
					<p class="text-yellow-700 text-lg font-semibold">كل يوم بيعدي بيصعب عليك الدنيا أكتر</p>
				</div>

				<div class="bg-teal-50 border-l-4 border-teal-500 p-6 mb-6 text-center">
					<h3 class="text-teal-800 font-bold mb-4 text-xl">🔗 انضم للجروب المجاني من هنا</h3>
					<a href="https://t.me/+RSZ8TYa53YdkZTQ8" target="_blank"
					   class="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors no-underline hover:no-underline text-lg">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
						</svg>
						<span>انضم للجروب المجاني</span>
					</a>
				</div>

				<div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
					<p class="text-slate-600 text-sm">#معادلة_كلية_الهندسة &nbsp; #انجليزي_من_الصفر &nbsp; #ابدأ_صح &nbsp; #مكثف_الابلكيشن</p>
				</div>
			`,
			date: '2026-05-01',
			author: 'فريق المعادلة',
			category: 'الكورسات والدورات',
			important: true,
			image: '/assets/خبر جروب الانجليزي.jpeg',
			images: ['/assets/خبر جروب الانجليزي.jpeg']
		},
		'group-c-launch-2026': {
			id: 'group-c-launch-2026',
			title: 'انطلاق جروب C رسميًا على ابلكيشن معادلة كلية الهندسة',
			content: `
				<div class="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-6 mb-6">
					<h3 class="text-orange-800 font-bold mb-3 text-2xl">🔥 انطلاق جروب C رسميًا على ابلكيشن معادلة كلية الهندسة 🔥</h3>
					<p class="text-orange-700 text-lg font-semibold mb-2">لو بتدور على بداية قوية وطريق واضح الي كلية الهندسة؟</p>
					<p class="text-orange-700 text-lg font-semibold mb-2">لو لسه مبدأتش وخايف من الوقت؟</p>
				</div>
				
				<div class="mb-8 text-center">
					<img src="/assets/جروب جديد.jpg.jpeg" alt="انطلاق جروب C" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>
				
				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">🎯 ليه لازم تشترك في جروب C؟</h3>
					<ul class="list-disc list-inside space-y-3 text-blue-700">
						<li class="text-lg"> بداية المنهج من الصفر مع وجود جداول مذاكرة</li>
						<li class="text-lg">متابعة شخصية بواسطة الاسيستانت المتخصصين في المادة</li>
						<li class="text-lg">شرح مبسّط يخليك تفهم مادة علمية بطريقة كويسة</li>
						<li class="text-lg">تركيز على أهم الأفكار والأسئلة المتوقعة</li>
					</ul>
				</div>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-4 text-xl">🎯 الجروب معمول مخصوص لطلبة معادلة كلية الهندسة اللي عايزين:</h3>
					<ul class="list-disc list-inside space-y-3 text-green-700">
						<li class="text-lg">✔️ بداية صح</li>
						<li class="text-lg">✔️ تنظيم</li>
					</ul>
				</div>
				
				<div class="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6 text-center">
					<h3 class="text-purple-800 font-bold mb-4 text-xl">📢 تشترك في جروب C ازاي؟</h3>
					<a href="https://www.appmo3adla.com/subscription-engineer" target="_blank"
					   class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors no-underline hover:no-underline">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
						</svg>
						<span>لتفاصيل الاشتراك</span>
					</a>
				</div>
				
				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6 text-center">
					<h3 class="text-yellow-800 font-bold mb-2 text-xl">🚀 خطوتك الأولى لكلية الهندسة تبدأ من هنا</h3>
					<p class="text-yellow-700 text-lg font-semibold">ابدأ رحلتك مع جروب C اليوم!</p>
				</div>
			`,
			date: '2026-01-24',
			author: 'فريق المعادلة',
			category: 'الكورسات والدورات',
			important: true,
			image: '/assets/جروب جديد.jpg.jpeg',
			images: [
				'/assets/جروب جديد.jpg.jpeg'
			]
		},
		'english-plan-dr-omar-2025': {
			id: 'english-plan-dr-omar-2025',
			title: 'تفاصيل خطة الإنجليزي مع دكتور عمر أحمد أسطورة اللغة الانجليزية وصلت 🔥',
			content: `
				<div class="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-3 text-2xl"> تفاصيل خطة الإنجليزي مع دكتور عمر أحمد</h3>
					<p class="text-blue-700 text-lg font-semibold mb-2">الإنجليزي من النهاردة اتحول من عقدة… إلى لعبة 💪</p>
					<p class="text-blue-700 mb-2">جاهز تبدأ وتكسر خوفك؟ 🫣</p>
				</div>
				
				<div class="mb-8 text-center">
					<img src="/assets/خبر الإنجليزي.jpg" alt="خطة الإنجليزي مع دكتور عمر" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>
				
				<div class="bg-orange-50 border-l-4 border-orange-500 p-6 mb-6">
					<h3 class="text-orange-800 font-bold mb-4 text-xl">📅 الخطة الزمنية:</h3>
					<p class="text-orange-700 mb-4 font-semibold">البداية هتكون في شهر نوفمبر كالتالي:</p>
					<ul class="list-disc list-inside space-y-3 text-orange-700">
						<li class="text-lg"><strong>شهر 11:</strong> تأسيس + تراكمي</li>
						<li class="text-lg"><strong>شهر 12:</strong> Unit (1,2)</li>
						<li class="text-lg"><strong>شهر 1:</strong> Unit (3,4)</li>
						<li class="text-lg"><strong>شهر 2:</strong> Unit (5,6)</li>
						<li class="text-lg"><strong>شهر 3:</strong> Unit (7,8)</li>
						<li class="text-lg"><strong>شهر 4:</strong> Unit (9,10)</li>
						<li class="text-lg"><strong>شهر 5:</strong> Unit (11,12)</li>
						<li class="text-lg"><strong>شهر 6&7&8:</strong> مراجعة + حل امتحانات سنوات سابقة</li>
					</ul>
				</div>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-4 text-xl">📚 النظام الدراسي:</h3>
					<div class="space-y-4">
						<div class="bg-white p-4 rounded-lg">
							<p class="text-green-700 font-semibold mb-2 text-lg">1️⃣ محاضرة في الأسبوع</p>
							<p class="text-green-700">شرح + حل</p>
						</div>
						<div class="bg-white p-4 rounded-lg">
							<p class="text-green-700 font-semibold mb-2 text-lg">2️⃣ اليونيت على مرتين</p>
							<p class="text-green-700">مرة جرامر ومرة كلمات + حل</p>
						</div>
						<div class="bg-white p-4 rounded-lg">
							<p class="text-green-700 font-semibold mb-2 text-lg">3️⃣ كلمات من خارج المنهج</p>
							<p class="text-green-700">هيتم حفظها مع الأسسيستانت المتخصص للغة الإنجليزية</p>
						</div>
						<div class="bg-white p-4 rounded-lg">
							<p class="text-green-700 font-semibold mb-2 text-lg">4️⃣ يوم الأسئلة</p>
							<p class="text-green-700">في جروب التيلجرام كما هو موضح في الجدول</p>
						</div>
					</div>
				</div>
				
				<div class="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6 text-center">
					<h3 class="text-purple-800 font-bold mb-4 text-xl">🎥 فيديو التفاصيل:</h3>
					<a href="https://www.facebook.com/share/v/1CCF29Rjxp/?mibextid=wwXIfr" target="_blank" 
					   class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
						</svg>
						<span>شاهد الفيديو على فيسبوك</span>
					</a>
				</div>
				
				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
					<h3 class="text-yellow-800 font-bold mb-2 text-xl">💪 لماذا هذه الخطة مختلفة؟</h3>
					<ul class="list-disc list-inside space-y-2 text-yellow-700">
						<li>شرح مبسط وسهل الفهم مع دكتور عمر أحمد</li>
						<li>خطة متدرجة ومنظمة تغطي كل جوانب اللغة</li>
						<li>متابعة مستمرة ودعم من الأسسيستانت</li>
						<li>تدريبات عملية وحل أسئلة حقيقية</li>
						<li>مراجعة شاملة وحل امتحانات سنوات سابقة</li>
					</ul>
				</div>
			`,
			date: '2025-11-03',
			author: 'فريق المعادلة',
			category: 'الكورسات والدورات',
			important: true,
			image: '/assets/خبر الإنجليزي.jpg',
			images: [
				'/assets/خبر الإنجليزي.jpg'
			]
		},
		'monitoring-system-2025': {
			id: 'monitoring-system-2025',
			title: 'نظام المتابعة في الابلكيشن حاجة تانية 🧡🔥',
			content: `
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-orange-800 font-bold mb-2 text-xl">🧡🔥 المتابعة في الابلكيشن حاجة تانية</h3>
					<p class="text-orange-700 text-lg">هتذاكر يعني هتذاكر - متابعة طلاب الابلكيشن</p>
				</div>
				
				<div class="mb-8 text-center">
					<img src="/assets/نظام المتابعة.jpg" alt="نظام المتابعة" class="mx-auto rounded-lg shadow-lg max-w-full" style="max-width: 800px;">
				</div>
				
				<p class="text-lg leading-relaxed mb-6 text-gray-700 font-semibold text-center">
					المتابعة في الابلكيشن حاجة تانية 🧡🔥
				</p>
				
				<div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
					<h3 class="text-blue-800 font-bold mb-4 text-xl">📊 متابعة طلاب الابلكيشن</h3>
					<div class="space-y-3">
						<div class="bg-white p-4 rounded-lg">
							<p class="text-blue-700 font-semibold mb-2">1️⃣ نظام تقييمات</p>
						</div>
						<div class="bg-white p-4 rounded-lg">
							<p class="text-blue-700 font-semibold">2️⃣ ثواب وعقاب</p>
						</div>
					</div>
				</div>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
					<h3 class="text-green-800 font-bold mb-4 text-xl">أولاً: نظام التقييم (المتابعة)</h3>
					
					<div class="mb-6">
						<h4 class="text-green-700 font-bold mb-3 text-lg">1️⃣ علي المنصة</h4>
						<ul class="list-disc list-inside space-y-2 text-green-700">
							<li>يجري اختبار يومي للطالب علي الدرس السابق لقياس مدي استيعابه</li>
							<li>يتم تقييم الطالب يوميا ( من ١ الي ١٠)</li>
							<li>تسجل الدرجات النهائية اسبوعيا بشكل دوري</li>
							<li>الطلاب الحاصلون علي درجات ضعيفة يتم التواصل معهم لمعرفة اسباب ذلك ومساعدتهم في تجاوز الصعوبات</li>
							<li>اما الطلاب المتغيبون أو الغير ملتزمين بالاختبارات يتابع غيابهم ويُرسل لهم تنبيه في المرة الاولي ، مع التأكيد علي عدم لكرار ذلك</li>
							<li>يتم اختبار الطلاب اختبار شامل بعد كل مراجعة حسب الخطة الزمنية</li>
						</ul>
					</div>
					
					<div class="mb-6">
						<h4 class="text-green-700 font-bold mb-3 text-lg">2️⃣ بواسطة المشرفين</h4>
						<ul class="list-disc list-inside space-y-2 text-green-700">
							<li>يتم سؤال الطالب يوميآ عن حل الواجب يدويآ و ملخص للدرس وتسليمه للاسيستانت الخاص بالطالب</li>
							<li>يتم تقييم الطالب ( من ١ الي ١٠) من قبل الاسيستانت</li>
							<li>يتم تسميع كلمات للغة الانجليزية بشكل يومي من قبل الاسيستانت الخاص ب اللغة الانجليزية</li>
						</ul>
					</div>
					
					<div class="mb-4">
						<h4 class="text-green-700 font-bold mb-3 text-lg">3️⃣ بواسطة المهندسين</h4>
						<ul class="list-disc list-inside space-y-2 text-green-700">
							<li>يتم فتح جروبات المناقشة مع المدرس يوميا للاستغسارات عن المادة العلمية</li>
							<li>يتم الاتصال بالطالب من قبل المدرس يومياً بشكل عشواني (٥ طلاب يوميا ) لسؤالة سوال نظري في المنهج</li>
							<li>يتم تقيم الطالب وتدوين ملاحظات من قبل المهندس المسئول حسب رؤيته ( من 1 الي 10 )</li>
						</ul>
					</div>
				</div>
				
				<div class="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
					<h3 class="text-red-800 font-bold mb-4 text-xl">ثانياً: العقاب</h3>
					<p class="text-red-700 mb-3">العقاب يتم تدريجياً من خلال:</p>
					<ul class="list-disc list-inside space-y-2 text-red-700">
						<li>اتصال او رسالة تنبيه</li>
						<li>يتم وضع انزار في التقدير الشهري</li>
						<li>يتم التواصل مع ولي الامر لتوضيح الرؤية</li>
						<li>يتم فصل الطالب جزئياً لمدة ثلاث ايام</li>
						<li>يتم فصل الطالب نهائيا من المنصة و حظره من الدخول مرة اخري</li>
					</ul>
				</div>
				
				<div class="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6 text-center">
					<h3 class="text-purple-800 font-bold mb-2 text-xl">💡 الخلاصة</h3>
					<p class="text-purple-700 text-lg font-semibold">متابعة يعني ابلكيشن</p>
				</div>
			`,
			date: '2026-01-21',
			author: 'فريق المعادلة',
			category: 'أنظمة الأبلكيشن',
			important: true,
			image: '/assets/نظام المتابعة.jpg',
			images: [
				'/assets/نظام المتابعة.jpg'
			]
		},
		'free-week-codes-2025': {
			id: 'free-week-codes-2025',
			title: '7 ايام تجريبية مجاناً لطلاب المعادلة',
			content: `
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-orange-800 font-bold mb-2">🔥 تجربة مجانية لطلاب المعادلة</h3>
					<p class="text-orange-700">فريق أبلكيشن معادلة كلية هندسة بيفتح باب الأكواد المجانية لمدة 7 ايام</p>
				</div>
				
				<p class="text-lg leading-relaxed mb-6 text-gray-700">
					تجربة مجانية لطلاب المعادلة
				</p>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
					<h3 class="text-green-800 font-bold mb-2">📅 الفترة:</h3>
					<p class="text-green-700 text-lg font-semibold">
						من يوم <strong>21</strong> حتى <strong>27</strong>
					</p>
				</div>
				
				<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
					<h3 class="text-blue-800 font-bold mb-2">✨ المميزات:</h3>
					<ul class="list-disc list-inside text-blue-700 space-y-3">
						<li><strong>سجل على المنصة واحصل على كود مجاني</strong></li>
						<li><strong>استمتع بـ دخول مجاني كامل على المنصة خلال فترة العرض</strong></li>
						<li><strong>جرب كل الخدمات بنفسك واستفاد بأقصى قدر ممكن ✨</strong></li>
						<li><strong>هدفنا إن كل طالب يجرب المنصة، ويستفيد منها، ويبدأ طريقه نحو الهندسة بثقة 💪</strong></li>
					</ul>
				</div>
				
				<div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
					<h3 class="text-slate-900 font-bold mb-2 text-xl">لسه معندكش حساب؟</h3>
					<p class="text-slate-600 mb-4 text-lg">
						سجل الآن أو ادخل بحسابك عشان تستفيد من أيام التجربة المجانية على طول.
					</p>
					<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
						<a href="https://app-mo3adlet-handsa.com/register.php"
						   target="_blank"
						   class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow no-underline hover:no-underline">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
							</svg>
							<span>إنشاء حساب جديد</span>
						</a>
						<a href="https://app-mo3adlet-handsa.com/student/index.php"
						   target="_blank"
						   class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-green-700 border border-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-semibold transition-colors shadow no-underline hover:no-underline">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
							</svg>
							<span>تسجيل دخول</span>
						</a>
					</div>
				</div>
				
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-orange-800 font-bold mb-2">📝 كيفية الحصول على الكود:</h3>
					<p class="text-orange-700 mb-3">
						عشان تحصل على الكود المجاني، لازم تسجل في الفورم ده ونبعتلك الكود على الواتساب:
					</p>
					<a href="https://forms.gle/T2nPzcmRJksP4PLg7" target="_blank" 
					   class="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors no-underline hover:no-underline">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						<span>سجل الآن للحصول على الكود المجاني</span>
					</a>
				</div>
				
				<div class="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
					<h3 class="text-purple-800 font-bold mb-2">📢 دعوة للمشاركة:</h3>
					<p class="text-purple-700 text-lg">
						لو عندك صاحب لسه مفعّلش التطبيق، ابعتهاله فورًا قبل ما العرض يخلص 😉
					</p>
				</div>
				
				<div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
					<h3 class="text-red-800 font-bold mb-2">⏰ تنبيه مهم:</h3>
					<p class="text-red-700">
						العرض محدود بوقت معين، فلا تفوت الفرصة! سارع بالتسجيل والحصول على الكود المجاني قبل انتهاء العرض.
					</p>
				</div>
			`,
			date: '2026-01-21',
			author: 'فريق المعادلة',
			category: 'عروض خاصة',
			important: true,
			image: '/assets/news8.jpg',
			images: [
				'/assets/news8.jpg'
			]
		},
		'App-Book-2025': {
			id: 'App-Book-2025',
			title: 'كتاب امتحانات الأبلكيشن',
			content: `
				<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
					<h3 class="text-blue-800 font-bold mb-2">📚 كتاب امتحانات الأبلكيشن</h3>
					<p class="text-blue-700">مجموعة شاملة من الامتحانات التدريبية لمعادلة كلية الهندسة</p>
				</div>
				
				
				<h3 class="text-xl font-bold mb-4 text-gray-800">مميزات الكتاب:</h3>
				<ul class="list-disc list-inside mb-6 space-y-2">
					<li>يضم مجموعة كبيرة من الامتحانات الشاملة</li>
					<li>يساعد الطالب على التدرب على شكل الأسئلة الحقيقية</li>
					<li>يحتوي على إجابات نموذجية لزيادة الفهم والثقة</li>
					<li>مناسب لجميع المستويات الدراسية</li>
					<li>أداة فعّالة للمراجعة قبل الامتحان</li>
					<li>يساعد على إدارة الوقت أثناء الحل والتدريب</li>
					<li>يعزز قدرة الطالب على التركيز والتفكير السريع</li>
					<li>يشمل أسئلة متنوعة تغطي جميع أجزاء المنهج</li>
					<li>ينمي مهارة حل المشكلات عند الطالب</li>
					<li>وسيلة مثالية لتقييم مستوى الاستعداد النهائي</li>
				</ul>
				
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-xl font-bold mb-4 text-orange-800">الفئة المستهدفة:</h3>
					<ul class="list-disc list-inside text-orange-700 space-y-1">
						<li>طلاب معادلة هندسة</li>
						<li>الطلاب الراغبين في التدريب على نماذج محاكاة للامتحانات</li>
						<li>الطلاب اللي عايزين يقيسوا مستوى استعدادهم قبل الامتحان</li>
						<li>الطلاب اللي محتاجين يرفعوا مستواهم بالتمارين التطبيقية</li>
					</ul>
				</div>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
					<h4 class="text-green-800 font-bold mb-2">🚚 الكتاب لحد باب بيتك:</h4>
					<ul class="list-disc list-inside text-green-700 space-y-1">
						<li>إمكانية شراء الكتاب أونلاين بسهولة</li>
						<li>التوصيل متاح لأي مكان</li>
						<li>سرعة في الشحن والاستلام</li>
						<li>دفع آمن وسهل أونلاين</li>
					</ul>
				</div>
			`,
			date: '2025-05-20',
			author: 'فريق المعادلة',
			category: 'الكتب والمراجع',
			important: false,
			image: '/assets/كتاب.jpg',
			images: [
				'/assets/كتاب.jpg'
			]
		},
		'one-chance-only-2025': {
			id: 'one-chance-only-2025',
			title: 'فرصة واحدة فقط لاختبارات المعادلة لدفعة 2025',
			content: `
				<div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
					<h3 class="text-red-800 font-bold mb-2">⚠️ تحديث مهم في شروط المعادلة</h3>
					<p class="text-red-700">اعتباراً من دفعة عام 2025، أصبحت فرص التقدم لاختبارات المعادلة فرصة واحدة فقط</p>
				</div>
				
				<p class="mb-4 text-gray-700 leading-relaxed">
					اعتباراً من دفعة عام 2025 من الطلاب الحاصلين على الدبلومات والمعاهد الفنية والمتقدمين لامتحانات الدبلومات والمعاهد في العام الجامعي 2025/2026 أصبحت فرص التقدم لاختبارات الدبلومات والمعاهد هذا العام ٢٠٢٥ هي فرصة واحدة فقط خلال عامين متتاليين تحسب ابتداء من عام حصول الطالب على المؤهل والعام الذي يليه.
				</p>
				
				<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
					<h3 class="text-yellow-800 font-bold mb-2">📝 ملاحظات مهمة:</h3>
					<ul class="list-disc list-inside text-yellow-700 space-y-1">
						<li>ينطبق هذا الشرط على دفعة 2025 فقط</li>
						<li>الفرصة الواحدة تحسب من عام الحصول على المؤهل والعام التالي</li>
						<li>يجب على الطلاب التحضير جيداً قبل التقدم للامتحان</li>
						<li>لا توجد فرص إضافية بعد استنفاد الفرصة الواحدة</li>
					</ul>
				</div>
			`,
			date: '2025-06-22',
			author: 'فريق المعادلة',
			category: 'شروط المعادلة',
			image: '/assets/success.png',
			images: ['/assets/success.png']
		},
		'tech-schools-acceptance-2025': {
			id: 'tech-schools-acceptance-2025',
			title: 'قبول خريجي مدارس التكنولوجيا التطبيقية في المعادلة',
			content: `
				<div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
					<h3 class="text-green-800 font-bold mb-2">🎓 فرصة جديدة لخريجي التكنولوجيا التطبيقية</h3>
					<p class="text-green-700">السماح لخريجي مدارس التكنولوجيا التطبيقية بأداء امتحانات المعادلة</p>
				</div>
				
				<h3 class="text-xl font-bold mb-4 text-gray-800">المدارس المشمولة:</h3>
				<ul class="list-disc list-inside mb-6 space-y-2 text-gray-700">
					<li>مدرسة تكنولوجيا المعلومات بالإسماعيلية</li>
					<li>مدرسة أي تك (I-TECH)</li>
					<li>مدارس التكنولوجيا التطبيقية تخصص تكنولوجيا المعلومات</li>
					<li>مدارس التكنولوجيا التطبيقية تخصص الذكاء الاصطناعي</li>
					<li>مدارس التكنولوجيا التطبيقية تخصص برمجيات</li>
					<li>مدارس WE للتكنولوجيا التطبيقية</li>
				</ul>
				
				<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
					<h3 class="text-blue-800 font-bold mb-2">📋 شروط القبول:</h3>
					<ul class="list-disc list-inside text-blue-700 space-y-1">
						<li>الحصول على 75% فأكثر من مجموع درجات شهادة الدبلوم</li>
						<li>أداء امتحانات في المواد التالية: رياضة - فيزياء - لغة إنجليزية</li>
						<li>الامتحانات تُعقد بكليات الهندسة المعنية</li>
						<li>الامتحانات تحت إشراف أمانة المجلس الأعلى للجامعات</li>
					</ul>
				</div>
				
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-orange-800 font-bold mb-2">⏰ التوقيت:</h3>
					<p class="text-orange-700">
						هذا القرار ساري اعتباراً من دفعة 2025 فقط.
					</p>
				</div>
			`,
			date: '2025-06-22',
			author: 'فريق المعادلة',
			category: 'قبول خاص',
			image: '/assets/we.jpg',
			images: ['/assets/we.jpg']
		},
		'english-words-group-2025': {
			id: 'english-words-group-2025',
			title: 'جروب كلمات اللغة الإنجليزية',
			content: `
				<div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
					<h3 class="text-green-800 font-bold mb-2">📚 جروب كلمات اللغة الإنجليزية</h3>
					<p class="text-green-700">مجموعة شاملة من أهم الكلمات الشائعة في امتحانات المعادلة</p>
				</div>
				
				<p class="text-lg leading-relaxed mb-6">جروب كلمات اللغة الإنجليزية يضم مجموعة كبيرة من أهم الكلمات الشائعة فى الإمتحانات ويساعد الطالب على بناء حصيلة لغوية قوية.</p>
				
				<h3 class="text-xl font-bold mb-4 text-gray-800">مميزات الجروب:</h3>
				<ul class="list-disc list-inside mb-6 space-y-2">
					<li>يضم مجموعة كبيرة من أهم الكلمات الشائعة فى الإمتحانات</li>
					<li>يساعد الطالب على بناء حصيلة لغوية قوية</li>
					<li>يحتوي على تدريبات وتطبيقات عملية للكلمات</li>
					<li>مناسب لجميع المستويات من المبتدئ للمحترف</li>
					<li>أداة فعّالة لتقوية التحدث والكتابة والترجمة</li>
					<li>يساعد على تحسين النطق والاستخدام الصحيح</li>
					<li>يعزز قدرة الطالب على الفهم السريع لإسئلة الإمتحانات</li>
					<li>وسيلة مثالية لتطوير اللغة خطوة بخطوة</li>
				</ul>
				
				<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
					<h3 class="text-xl font-bold mb-4 text-blue-800">الفئة المستهدفة:</h3>
					<ul class="list-disc list-inside text-blue-700 space-y-1">
						<li>أي شخص عايز يقوي لغته الإنجليزية</li>
						<li>المبتدئين اللي محتاجين يبدأوا من الصفر</li>
						<li>الطلاب اللي بيستعدوا لاختبارات المعادلة</li>
					</ul>
				</div>
				
				<div class="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
					<h4 class="text-purple-800 font-bold mb-2">📖 محتوى الجروب:</h4>
					<ul class="list-disc list-inside text-purple-700 space-y-1">
						<li>كلمات يومية أساسية ومهمة</li>
						<li>تدريبات على كل كلمة</li>
						<li>اختبارات سريعة للتأكد من الحفظ</li>
						<li>مراجعات دورية للطلاب</li>
						<li>متابعة مستمرة من المشرفين</li>
					</ul>
				</div>
			`,
			date: '2025-06-22',
			author: 'فريق المعادلة',
			category: 'أخبار التطبيق',
			important: false,
			image: '/assets/مكثف.jpg',
			images: [
				'/assets/مكثف.jpg'
			]
		},
		'intensive-course-2025': {
			id: 'intensive-course-2025',
			title: 'الكورس المكثف الجديد',
			content: `
				<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
					<h3 class="text-blue-800 font-bold mb-2">📚 الكورس المكثف الجديد</h3>
					<p class="text-blue-700">كورس شامل يغطي المنهج الدراسي بالكامل مع التركيز على النقاط المهمة</p>
				</div>
				
				<h3 class="text-xl font-bold mb-4 text-gray-800">مميزات الكورس:</h3>
				<ul class="list-disc list-inside mb-6 space-y-2">
					<li>يغطي شرحًا كاملًا للمنهج الدراسي</li>
					<li>يركز على أهم النقاط الأساسية في المادة</li>
					<li>يتضمن حل تدريبات متنوعة للتطبيق العملي للإمتحانات</li>
					<li>يوفر مراجعات شاملة قبل الامتحانات</li>
					<li>يساعد الطلاب على تثبيت المعلومات بشكل أفضل</li>
					<li>مصمم خصيصًا للطلاب المتأخرين في متابعة المنهج</li>
					<li>يرفع مستوى الاستعداد للامتحانات النهائية</li>
				</ul>
				
				<div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
					<h3 class="text-green-800 font-bold mb-2">🎯 الفئة المستهدفة:</h3>
					<ul class="list-disc list-inside text-green-700 space-y-1">
						<li>الطلاب المتأخرين في متابعة الدروس</li>
						<li>الطلاب اللي محتاجين مراجعة شاملة قبل الامتحان</li>
						<li>أي طالب بيدور على خطة منظمة للاستعداد</li>
					</ul>
				</div>
				
				<div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
					<h3 class="text-orange-800 font-bold mb-2">📋 محتوى الكورس:</h3>
					<ul class="list-disc list-inside text-orange-700 space-y-2">
						<li><strong>فيديوهات شرح تفصيلي:</strong> للمنهج كامل والتركيز على النقاط المهمة</li>
						<li><strong>مراجعات شاملة:</strong> تغطي أهم الأجزاء</li>
						<li><strong>حل نماذج امتحانات متوقعة:</strong> للتدريب على شكل الأسئلة</li>
						<li><strong>لايف يومي:</strong> لحل تدريبات مباشرة مع الطلاب</li>
						<li><strong>تدريبات تطبيقية مستمرة:</strong> للتأكد من الفهم</li>
					</ul>
				</div>
			`,
			date: '2025-06-22',
			author: 'فريق المعادلة',
			category: 'الكورسات والدورات',
			image: '/assets/news4.png',
			images: ['/assets/news4.png']
		},
		'equation-requirements-2024': {
			id: 'equation-requirements-2024',
			title: 'تحديثات جديدة في شروط المعادلة للعام 2024',
			content: `
				<p>تم الإعلان عن تحديثات مهمة في شروط المعادلة للطلاب الراغبين في الالتحاق بكليات الهندسة. هذه التحديثات تأتي في إطار تطوير النظام التعليمي وتحسين جودة التعليم الهندسي.</p>
				
				<h3>الشروط الجديدة تشمل:</h3>
				<ul>
					<li>تحديث متطلبات الدرجات المطلوبة في المواد الأساسية</li>
					<li>إضافة مواد جديدة للتقييم</li>
					<li>تطوير نظام التقييم ليكون أكثر شمولية</li>
					<li>تحسين آليات المراجعة والاعتماد</li>
				</ul>
				
				<h3>المواعيد المهمة:</h3>
				<ul>
					<li>بداية التسجيل: 1 مارس 2024</li>
					<li>آخر موعد للتسجيل: 30 أبريل 2024</li>
					<li>موعد الامتحانات: يونيو 2024</li>
					<li>إعلان النتائج: يوليو 2024</li>
				</ul>
				
				<p>ننصح جميع الطلاب الراغبين في الالتحاق بكليات الهندسة بمراجعة الشروط الجديدة والتأكد من استيفاء جميع المتطلبات قبل التقديم.</p>
			`,
			date: '2024-01-15',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		},
		'new-approved-schools-2024': {
			id: 'new-approved-schools-2024',
			title: 'قائمة جديدة من المدارس المعتمدة للمعادلة',
			content: `
				<p>تم إضافة 15 مدرسة جديدة إلى قائمة المدارس المعتمدة للمعادلة في مختلف المحافظات. هذه المدارس تم تقييمها بعناية للتأكد من استيفاءها للمعايير المطلوبة.</p>
				
				<h3>المدارس الجديدة تشمل:</h3>
				<ul>
					<li>مدرسة النهضة الثانوية - القاهرة</li>
					<li>مدرسة المستقبل - الإسكندرية</li>
					<li>مدرسة التميز - الجيزة</li>
					<li>مدرسة الأمل - أسيوط</li>
					<li>مدرسة النور - المنيا</li>
				</ul>
				
				<h3>معايير الاعتماد:</h3>
				<p>تم تقييم المدارس بناءً على عدة معايير منها:</p>
				<ul>
					<li>جودة المناهج التعليمية</li>
					<li>كفاءة المدرسين</li>
					<li>المرافق والتجهيزات</li>
					<li>نتائج الطلاب في الامتحانات</li>
				</ul>
				
				<p>هذا التوسع في قائمة المدارس المعتمدة سيساعد في توفير فرص أكثر للطلاب في مختلف المحافظات.</p>
			`,
			date: '2024-01-10',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		},
		'app-update-2-1-0': {
			id: 'app-update-2-1-0',
			title: 'تحديث جديد للتطبيق - إصدار 2.1.0',
			content: `
				<p>نحن سعداء بالإعلان عن إطلاق التحديث الجديد للتطبيق - الإصدار 2.1.0. هذا التحديث يجلب ميزات جديدة وتحسينات مهمة لتجربة المستخدم.</p>
				
				<h3>الميزات الجديدة:</h3>
				<ul>
					<li>واجهة مستخدم محسنة وسهلة الاستخدام</li>
					<li>نظام إشعارات ذكي ومتقدم</li>
					<li>تحسينات في سرعة التطبيق</li>
					<li>إضافة نظام التتبع الذكي للدرجات</li>
					<li>دردشة مباشرة مع المدرسين</li>
				</ul>
				
				<h3>التحسينات التقنية:</h3>
				<ul>
					<li>تقليل وقت التحميل بنسبة 40%</li>
					<li>تحسين استهلاك البطارية</li>
					<li>إصلاح الأخطاء المعروفة</li>
					<li>تحسين الأمان والحماية</li>
				</ul>
				
				<h3>كيفية التحديث:</h3>
				<p>يمكنك تحديث التطبيق من خلال:</p>
				<ul>
					<li>متجر Google Play (أندرويد)</li>
					<li>App Store (iOS)</li>
					<li>الموقع الرسمي للتطبيق</li>
				</ul>
				
				<p>ننصح جميع المستخدمين بتحديث التطبيق للاستفادة من الميزات الجديدة والتحسينات.</p>
			`,
			date: '2024-01-20',
			image: '/assets/logo.png',
			category: 'أخبار التطبيق',
			author: 'فريق التطوير'
		},
		'smart-grades-tracking': {
			id: 'smart-grades-tracking',
			title: 'إضافة نظام التتبع الذكي للدرجات',
			content: `
				<p>نحن متحمسون للإعلان عن إضافة نظام التتبع الذكي للدرجات، والذي سيساعد الطلاب على متابعة تقدمهم الأكاديمي بشكل أفضل.</p>
				
				<h3>مميزات النظام الجديد:</h3>
				<ul>
					<li>تتبع الدرجات في جميع المواد</li>
					<li>رسوم بيانية لتطور الأداء</li>
					<li>تنبيهات عند انخفاض الدرجات</li>
					<li>توصيات للتحسين</li>
					<li>مقارنة الأداء مع المتوسط العام</li>
				</ul>
				
				<h3>كيفية الاستخدام:</h3>
				<ol>
					<li>ادخل إلى قسم "درجاتي" في التطبيق</li>
					<li>اختر المادة التي تريد متابعة درجاتها</li>
					<li>شاهد الرسوم البيانية والإحصائيات</li>
					<li>اتبع التوصيات المقدمة للتحسين</li>
				</ol>
				
				<h3>الفوائد للطلاب:</h3>
				<ul>
					<li>متابعة مستمرة للتقدم الأكاديمي</li>
					<li>تحديد نقاط الضعف مبكراً</li>
					<li>تحفيز للتحسين المستمر</li>
					<li>تنظيم أفضل للدراسة</li>
				</ul>
				
				<p>هذا النظام سيساعد الطلاب على تحقيق أفضل النتائج في دراستهم.</p>
			`,
			date: '2024-01-18',
			image: '/assets/logo.png',
			category: 'أخبار التطبيق',
			author: 'فريق التطوير'
		},
		'exam-schedule-semester-2': {
			id: 'exam-schedule-semester-2',
			title: 'مواعيد امتحانات المعادلة للفصل الدراسي الثاني',
			content: `
				<p>تم الإعلان عن مواعيد امتحانات المعادلة للفصل الدراسي الثاني مع إجراءات التسجيل. هذه المواعيد تم تحديدها بعناية لتناسب جميع الطلاب في مختلف المحافظات.</p>
				
				<h3>مواعيد الامتحانات:</h3>
				<ul>
					<li>الرياضيات العامة: 15 يونيو 2024</li>
					<li>الرياضيات الخاصة: 17 يونيو 2024</li>
					<li>الفيزياء: 19 يونيو 2024</li>
					<li>الكيمياء: 21 يونيو 2024</li>
					<li>اللغة الإنجليزية: 23 يونيو 2024</li>
				</ul>
				
				<h3>إجراءات التسجيل:</h3>
				<ol>
					<li>تسجيل البيانات الشخصية</li>
					<li>رفع المستندات المطلوبة</li>
					<li>دفع الرسوم</li>
					<li>طباعة استمارة التسجيل</li>
					<li>التوجه للمركز المحدد في الموعد</li>
				</ol>
				
				<h3>المستندات المطلوبة:</h3>
				<ul>
					<li>صورة من شهادة الثانوية العامة</li>
					<li>صورة من بطاقة الرقم القومي</li>
					<li>صورة شخصية حديثة</li>
					<li>إيصال دفع الرسوم</li>
				</ul>
				
				<p>ننصح جميع الطلاب بالتسجيل مبكراً لتجنب الازدحام في الأيام الأخيرة.</p>
			`,
			date: '2024-01-05',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		},
		'electronic-application-update': {
			id: 'electronic-application-update',
			title: 'تحديثات في نظام التقديم الإلكتروني',
			content: `
				<p>تم تطوير نظام التقديم الإلكتروني ليكون أكثر سهولة وسرعة للطلاب. هذا التحديث يأتي في إطار تحسين تجربة المستخدم وتسهيل عملية التسجيل.</p>
				
				<h3>المميزات الجديدة:</h3>
				<ul>
					<li>واجهة مستخدم محسنة وسهلة الاستخدام</li>
					<li>حفظ البيانات تلقائياً أثناء التقديم</li>
					<li>نظام إشعارات فوري للتحديثات</li>
					<li>إمكانية تعديل البيانات قبل الإرسال النهائي</li>
					<li>دعم رفع المستندات بجودة عالية</li>
				</ul>
				
				<h3>التحسينات التقنية:</h3>
				<ul>
					<li>تقليل وقت التحميل بنسبة 60%</li>
					<li>تحسين الأمان وحماية البيانات</li>
					<li>دعم جميع أنواع الأجهزة والمتصفحات</li>
					<li>نظام نسخ احتياطي للبيانات</li>
				</ul>
				
				<h3>كيفية الاستخدام:</h3>
				<ol>
					<li>ادخل إلى الموقع الرسمي</li>
					<li>أنشئ حساب جديد أو سجل دخول</li>
					<li>املأ البيانات المطلوبة</li>
					<li>ارفع المستندات المطلوبة</li>
					<li>راجع البيانات وأرسل الطلب</li>
				</ol>
				
				<p>هذا التحديث سيساعد في تسهيل عملية التسجيل للطلاب.</p>
			`,
			date: '2024-01-01',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		},
		'free-workshops-students': {
			id: 'free-workshops-students',
			title: 'ورش عمل مجانية لطلاب المعادلة',
			content: `
				<p>تنظيم ورش عمل مجانية لمساعدة الطلاب في التحضير لامتحانات المعادلة. هذه الورش ستعقد في مختلف المحافظات لتسهيل الوصول للجميع.</p>
				
				<h3>مواعيد الورش:</h3>
				<ul>
					<li>القاهرة: 10-15 فبراير 2024</li>
					<li>الإسكندرية: 17-22 فبراير 2024</li>
					<li>الجيزة: 24-29 فبراير 2024</li>
					<li>أسيوط: 2-7 مارس 2024</li>
					<li>المنيا: 9-14 مارس 2024</li>
				</ul>
				
				<h3>مواضيع الورش:</h3>
				<ul>
					<li>استراتيجيات حل المسائل الرياضية</li>
					<li>تقنيات حل مسائل الفيزياء</li>
					<li>مبادئ الكيمياء العملية</li>
					<li>تحسين مهارات اللغة الإنجليزية</li>
					<li>إدارة الوقت أثناء الامتحان</li>
				</ul>
				
				<h3>المحاضرون:</h3>
				<p>سيقوم بتدريس الورش نخبة من أفضل المدرسين والمهندسين المتخصصين في كل مادة.</p>
				
				<h3>كيفية التسجيل:</h3>
				<ol>
					<li>ادخل إلى الموقع الرسمي</li>
					<li>اختر الورشة المناسبة لك</li>
					<li>املأ بيانات التسجيل</li>
					<li>احضر في الموعد المحدد</li>
				</ol>
				
				<p>هذه الورش مجانية تماماً وتهدف لمساعدة الطلاب في تحقيق أفضل النتائج.</p>
			`,
			date: '2023-12-28',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		},
		'exam-results-semester-1': {
			id: 'exam-results-semester-1',
			title: 'نتائج امتحانات المعادلة للفصل الأول',
			content: `
				<p>تم الإعلان عن نتائج امتحانات المعادلة للفصل الدراسي الأول مع إحصائيات النجاح. النتائج تظهر تحسناً ملحوظاً في الأداء العام للطلاب.</p>
				
				<h3>إحصائيات النجاح:</h3>
				<ul>
					<li>نسبة النجاح العامة: 78%</li>
					<li>الرياضيات العامة: 82%</li>
					<li>الرياضيات الخاصة: 75%</li>
					<li>الفيزياء: 80%</li>
					<li>الكيمياء: 85%</li>
					<li>اللغة الإنجليزية: 70%</li>
				</ul>
				
				<h3>أفضل الطلاب:</h3>
				<ul>
					<li>المركز الأول: أحمد محمد - 98%</li>
					<li>المركز الثاني: فاطمة علي - 96%</li>
					<li>المركز الثالث: محمود حسن - 94%</li>
					<li>المركز الرابع: نورا سعد - 92%</li>
					<li>المركز الخامس: يوسف أحمد - 90%</li>
				</ul>
				
				<h3>كيفية الاستعلام عن النتيجة:</h3>
				<ol>
					<li>ادخل إلى الموقع الرسمي</li>
					<li>اختر "الاستعلام عن النتائج"</li>
					<li>ادخل رقم الجلوس</li>
					<li>شاهد النتيجة التفصيلية</li>
				</ol>
				
				<h3>التقديم على الكليات:</h3>
				<p>يمكن للطلاب الناجحين التقديم على كليات الهندسة المختلفة حسب درجاتهم وتفضيلاتهم.</p>
				
				<p>نهنئ جميع الطلاب الناجحين ونتمنى لهم التوفيق في المرحلة القادمة.</p>
			`,
			date: '2023-12-20',
			image: '/assets/logo.png',
			category: 'أخبار المعادلة',
			author: 'فريق المعادلة'
		}
	};

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.newsId = params['id'];
			// Try direct lookup by slug/key
			this.newsItem = this.newsData[this.newsId];
			// Fallback: try match by item's internal id property
			if (!this.newsItem) {
				const all = Object.values(this.newsData);
				this.newsItem = all.find((n: any) => n.id === this.newsId) as any;
			}
			
			// Update page title and SEO when news item is loaded
			if (this.newsItem) {
				this.updatePageTitle();
			}

			this.monthlyContent.loadPageState('news-equation', { items: [] }).subscribe((state: any) => {
				const items = Array.isArray(state?.items) ? state.items : [];
				const dynamic = items.find((item: any, index: number) => this.getDynamicSlug(item, index) === this.newsId);
				if (!dynamic) return;
				this.newsItem = {
					...dynamic,
					id: this.newsId,
					content: dynamic.content || dynamic.description || dynamic.excerpt || '',
					category: dynamic.category || 'أخبار المعادلة',
					date: dynamic.date || new Date().toISOString(),
					author: dynamic.author || 'فريق المعادلة'
				};
				this.updatePageTitle();
			});
		});
	}

	private getDynamicSlug(item: any, index: number): string {
		const internalSlug = typeof item?.link === 'string' ? item.link.match(/^\/news\/detail\/([^/?#]+)/)?.[1] : '';
		if (internalSlug) return internalSlug;
		if (item?.slug) return item.slug;
		const slug = String(item?.title || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
		return slug || `news-${index + 1}`;
	}

	private updatePageTitle(): void {
		if (this.newsItem && typeof window !== 'undefined') {
			const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
			const title = `${this.newsItem.title} - ابلكيشن معادلة كلية هندسة`;
			const description = this.extractDescription(this.newsItem.content);
			const url = `${siteUrl}/news/detail/${this.newsItem.id}`;
			const image = this.toAbsoluteUrl(this.newsItem.image || '/assets/logo.png', siteUrl);
			
			// Update page title
			this.seo.setTitle(title);
			this.seo.setDescription(description);
			this.seo.setOgTags({ title, description, url, image, imageAlt: this.newsItem.title });
			this.seo.setTwitterTags({ title, description, image });
			this.canonical.setCanonical(url);
		}
	}

	private toAbsoluteUrl(value: string, siteUrl: string): string {
		if (/^https?:\/\//i.test(value)) return value;
		return `${siteUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
	}

	private extractDescription(content: string): string {
		// Extract first paragraph or first 150 characters as description
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = content;
		const firstParagraph = tempDiv.querySelector('p');
		if (firstParagraph) {
			const text = firstParagraph.textContent || firstParagraph.innerText || '';
			return text.length > 150 ? text.substring(0, 150) + '...' : text;
		}
		return 'أحدث أخبار معادلة كلية الهندسة - ابلكيشن معادلة كلية هندسة';
	}

	formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ar-EG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	goBack(): void {
		this.location.back();
	}

	async shareNews(): Promise<void> {
		const url = window.location.href;
		
		if (navigator.share) {
			// استخدام Web Share API إذا كان متاحاً (في الهواتف المحمولة)
			try {
				await navigator.share({
					title: this.newsItem?.title || 'خبر من موقع معادلة كلية الهندسة',
					text: this.newsItem?.content?.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
					url: url
				});
			} catch (err) {
				// إذا ألغى المستخدم المشاركة
				console.log('تم إلغاء المشاركة');
			}
		} else {
			// نسخ الرابط إلى الحافظة
			try {
				await navigator.clipboard.writeText(url);
				alert('تم نسخ الرابط إلى الحافظة!');
			} catch (err) {
				// طريقة بديلة للنسخ
				this.fallbackCopyTextToClipboard(url);
			}
		}
	}

	private fallbackCopyTextToClipboard(text: string): void {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		
		try {
			document.execCommand('copy');
			alert('تم نسخ الرابط إلى الحافظة!');
		} catch (err) {
			alert('حدث خطأ في نسخ الرابط. الرابط: ' + text);
		}
		
		document.body.removeChild(textArea);
	}
}
