import { animate, query, stagger, state, style, transition, trigger, group, keyframes } from '@angular/animations';

// انيميشن التنقلات بين الصفحات - محسن مع تأثيرات سلسة
export const pageTransition = trigger('pageTransition', [
  transition('* => *', [
    // إخفاء الصفحة الحالية
    query(':leave', [
      style({ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 1,
        transform: 'translateX(0) scale(1)'
      })
    ], { optional: true }),
    
    // إظهار الصفحة الجديدة
    query(':enter', [
      style({ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'translateX(30px) scale(0.95)'
      })
    ], { optional: true }),
    
    // تنفيذ الانيميشن
    group([
      // إخفاء الصفحة الحالية
      query(':leave', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
          opacity: 0,
          transform: 'translateX(-30px) scale(0.95)'
        }))
      ], { optional: true }),
      
      // إظهار الصفحة الجديدة
      query(':enter', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
          opacity: 1,
          transform: 'translateX(0) scale(1)'
        }))
      ], { optional: true })
    ])
  ])
]);

// انيميشن للصفحة الرئيسية - تأثير خاص
export const homePageTransition = trigger('homePageTransition', [
  transition('* => home', [
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateY(50px) scale(0.9)'
      }),
      animate('600ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      }))
    ], { optional: true })
  ])
]);

// انيميشن للصفحات الفرعية - تأثير انزلاق
export const subPageTransition = trigger('subPageTransition', [
  transition('* => *', [
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateY(40px)'
      }),
      animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
        opacity: 1,
        transform: 'translateY(0)'
      }))
    ], { optional: true })
  ])
]);

// انيميشن للبطاقات - تأثير bounce لطيف
export const cardAnimation = trigger('cardAnimation', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'translateY(30px) scale(0.9)'
    }),
    animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({
      opacity: 1,
      transform: 'translateY(0) scale(1)'
    }))
  ])
]);

// انيميشن للروابط - تأثير hover محسن
export const linkHoverAnimation = trigger('linkHoverAnimation', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'scale(0.95)'
    }),
    animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
      opacity: 1,
      transform: 'scale(1)'
    }))
  ])
]);

// انيميشن للعناصر المتتالية - تأثير cascade
export const cascadeAnimation = trigger('cascadeAnimation', [
  transition(':enter', [
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateY(20px)'
      }),
      stagger(150, [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ])
    ], { optional: true })
  ])
]);

// انيميشن للعناصر الأساسية - محسن للأداء
export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ 
      opacity: 0, 
      transform: 'translateY(20px)',
      ['will-change']: 'opacity, transform'
    }),
    animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ 
      opacity: 1, 
      transform: 'translateY(0)',
      ['will-change']: 'auto'
    })),
  ]),
]);

// انيميشن للقوائم - محسن للأداء مع تقليل التأخير
export const staggerList = trigger('staggerList', [
  transition(':enter', [
    query(':enter', [
      style({ 
        opacity: 0, 
        transform: 'translateY(15px)',
        ['will-change']: 'opacity, transform'
      }),
      stagger(80, animate('350ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ 
        opacity: 1, 
        transform: 'translateY(0)',
        ['will-change']: 'auto'
      }))),
    ], { optional: true })
  ])
]);

// انيميشن للتوسع والانكماش - محسن للأداء
export const expandCollapse = trigger('expandCollapse', [
  state('void', style({ 
    height: '0px', 
    opacity: 0, 
    overflow: 'hidden',
    ['will-change']: 'height, opacity'
  })),
  state('*', style({ 
    height: '*', 
    opacity: 1, 
    overflow: 'hidden',
    ['will-change']: 'auto'
  })),
  transition('void <=> *', animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
]);

// انيميشن للأزرار - تأثير الضغط
export const buttonPress = trigger('buttonPress', [
  transition(':enter', [
    style({ transform: 'scale(1)' }),
    animate('100ms ease-in', style({ transform: 'scale(0.95)' })),
    animate('100ms ease-out', style({ transform: 'scale(1)' }))
  ])
]);

// انيميشن للصور - تأثير zoom
export const imageZoom = trigger('imageZoom', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'scale(1.1)'
    }),
    animate('600ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
      opacity: 1,
      transform: 'scale(1)'
    }))
  ])
]);

// انيميشن للنصوص - تأثير typing
export const textReveal = trigger('textReveal', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'translateY(10px)'
    }),
    animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
      opacity: 1,
      transform: 'translateY(0)'
    }))
  ])
]);

// انيميشن للشريط التقدم
export const progressBar = trigger('progressBar', [
  transition(':enter', [
    style({ width: '0%' }),
    animate('800ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ width: '*' }))
  ])
]);

// انيميشن للتنبيهات
export const notification = trigger('notification', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'translateX(100%) scale(0.8)'
    }),
    animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({
      opacity: 1,
      transform: 'translateX(0) scale(1)'
    }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({
      opacity: 0,
      transform: 'translateX(100%) scale(0.8)'
    }))
  ])
]);

// انيميشن للموجة
export const waveAnimation = trigger('waveAnimation', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'translateY(20px) scale(0.9)'
    }),
    animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
      opacity: 1,
      transform: 'translateY(0) scale(1)'
    }))
  ])
]);


