export type MonthlyContentPageKey = 'subscription-details' | 'subscription-ab-reviews' | 'subscription-intensive';

export const monthlyContentDefaults = {
	'subscription-details': {
		isEnrollmentClosed: false,
		enrollmentReopenMessage: 'سيتم فتح الاشتراك للمشتركين الجدد مع بداية الشهر القادم بإذن الله.',
		subscriptionDetails: {
			month: ' شهر مايو 2026',
			groupC: {
				name: 'جروب C',
				price: '800',
			},
			currency: 'ج',
			features: [
				'فيديوهات تأسيسية في جميع المواد',
				'فيديوهات شرح تفصيلية للمناهج',
				'فيديوهات حل بنوك المسائل',
				'ملازم وملفات PDF للتحميل',
				'امتحانات إلكترونية تفاعلية',
				'تتبع التقدم والدرجات',
				'دعم فني على مدار الساعة',
				'سيستم متابعة كامل (جديد)'
			],
			offers: [
				'خصم 20% للطلاب الجدد',
				'ضمان استرداد المبلغ خلال 7 أيام',
				'وصول مدى الحياة للمحتوى',
				'شهادة إنجاز معتمدة'
			],
			googleForms: {
				groupC: {
					key: 'groupC',
					label: 'جروب C',
					description: 'للمشتركين الجدد جروب C',
					buttonText: 'سجل فورم جروب C',
					link: 'https://forms.gle/mXzLb7Bnff43GUxK8',
					isClosed: false
				}
			},
			vodafoneNumbers: [
				{ number: '01040490778', owner: 'احمد ع********* س***' },
				{ number: '01040490779', owner: 'سعد ف** ص*** ا***' },
				{ number: '01025326080', owner: 'احمد م**** ا***** ز***' },
				{ number: '01080681865', owner: 'Mona k***** A**' },
			],
			scheduleImages: [
				{
					group: 'جدول جروب C',
					src: '/assets/جروب C.jpeg?v=20260621',
					alt: 'جدول محتوى شهر مايو - جروب C',
					note: '👆 اضغط على الصورة للتكبير'
				}
			],
			requiredInfo: [
				'رقم الموبايل اللي حولت منه 📲',
				'سكرين شوت بالتحويل 🖼',
				'وقت وتاريخ التحويل ⏳'
			],
			whatsappNumber: '201554843745',
			subscriptionWarnings: {
				validity: {
					title: 'مدة صلاحية الاشتراك:',
					points: [
						'الكود شغال لغاية آخر الشهر فقط',
						'مع انتهاء الشهر بيقفل المحتوى تلقائياً',
						'عند تجديد الاشتراك الكود الجديد بيفتحلك كل المحتوى من الأول'
					]
				},
				refund: {
					title: 'سياسة الاسترداد:',
					points: [
						'السحب متاح خلال أسبوع من الاشتراك مع استرداد نصف المبلغ فقط',
						'بعد الأسبوع، لا يُمكن استرداد أي مبلغ'
					]
				}
			},
			subtitle: ' الشهر الثامن لدفعة 2026 — جروب C '
		}
	},
	'subscription-ab-reviews': {
		isEnrollmentClosed: false,
		enrollmentReopenMessage: 'سيتم فتح الاشتراك مع بداية الشهر القادم بإذن الله.',
		enrollmentWindow: { days: 0, hours: 0, minutes: 0, seconds: 0, startedAt: '', expiresAt: '' },
		subscriptionDetails: {
			month: 'الشهر الأول — أكتوبر',
			review: {
				name: 'اشتراك الشهر الأول',
				price: '800'
			},
			currency: 'ج',
			features: [
				'محاضرات تأسيسية من الصفر',
				'محتوى السبورة (PDF)',
				'حل الواجبات بالتفصيل',
				'اختبارات إلكترونية تقييمية أسبوعياً',
				'متابعة مستمرة طوال الشهر'
			],
			googleForm: {
				label: 'اشتراك الشهر الأول — دفعة 2027',
				description: 'فورم اشتراك شهر أكتوبر',
				buttonText: 'سجل فورم الاشتراك',
				link: 'https://forms.gle/yPCxfeX73FmGg2cn8',
				isClosed: false
			},
			vodafoneNumbers: [
				{ number: '01025326080', owner: 'احمد م**** ا***** ز***' },
				{ number: '01040490779', owner: 'سعد ف** ص*** ا***' },
				{ number: '01040490778', owner: 'احمد ع********* س***' },
				{ number: '01080681865', owner: 'Mona k***** A**' }
			],
			scheduleImages: [],
			requiredInfo: [
				'رقم الموبايل اللي حولت منه 📲',
				'سكرين شوت بالتحويل 🖼',
				'وقت وتاريخ التحويل ⏳'
			],
			whatsappNumber: '201554843745',
			subscriptionWarnings: {
				refund: {
					title: 'سياسة الاسترداد',
					points: [
						'⚠️ لا يوجد استرداد أو سحب للاشتراك نهائيًا لأي سبب من الأسباب.'
					]
				},
				validity: {
					title: 'مدة صلاحية الاشتراك:',
					points: [
						'المنصة شغالة لغاية اخر القسط الاول فقط',
						'مع إنتهاء القسط الاول المحتوى بيقفل تلقائي',
						'عند التجديد بيتفتح لك كل المحتوى من الأول',
						'مع التجديد بيتفتح لك محتوى الشهر الجديد بالكامل'
					]
				}
			},
			subtitle: 'أول خطوة في رحلة دفعة 2027 — أكتوبر'
		}
	},
	'subscription-intensive': {
		isEnrollmentClosed: true,
		enrollmentReopenMessage: 'انتظروا التفاصيل قريباً بإذن الله 🔥',
		subscriptionDetails: {
			title: 'الاشتراك المكثف',
			subtitle: 'كورس مكثف لكلية الهندسة - دفعة 2026',
			googleFormLink: 'https://forms.gle/CYS6WCbAeX4W3E6Z7',
			paymentPlans: {
				installment2: { amount: '1600', label: 'القسط الثاني', note: 'ابتداءً من 7 أغسطس' }
			},
			currency: 'ج',
			vodafoneNumbers: [
				{ number: '01080594862', owner: 'Ahmed A*********' },
				{ number: '01001793817', owner: 'Saad F*** S****' },
				{ number: '01021069340', owner: 'Mona k***** A**' },
				{ number: '01021201970', owner: 'Mona k***** A**' }
			],
			requiredInfo: [
				'رقم الموبايل اللي حولت منه 📲',
				'سكرين شوت بالتحويل 🖼',
				'وقت وتاريخ التحويل ⏳'
			],
			whatsappNumber: '201554843745',
			subscriptionWarnings: {
				refund: {
					title: 'سياسة الاسترداد:',
					points: [
						'لا يوجد استرداد أو سحب للاشتراك نهائيًا لأي سبب من الأسباب'
					]
				},
				validity: {
					title: 'مدة صلاحية الاشتراك:',
					points: [
						'الكود شغال لغاية آخر الامتحانات',
						'مع انتهاء الامتحانات بيقفل المحتوى تلقائياً'
					]
				}
			}
		}
	}
} as const;
