import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { AdminApiService, FinanceAuditLog, FinanceTransaction, StudioFinanceResponse } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-studio-finance-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="studio-finance" dir="rtl">
  <style>
    .studio-row{grid-template-columns:1fr 1fr 1.4fr 1fr .8fr 1.05fr!important;min-width:720px!important}
    .lead-actions-cell{white-space:nowrap}
    .lead-actions-menu{position:relative;display:inline-block}
    .lead-actions-menu__trigger{display:grid;place-items:center;width:32px;height:30px;border:1px solid #cfc5ff;border-radius:8px;color:#6241df;background:#f4f1ff;cursor:pointer}
    .lead-actions-menu__trigger:hover{background:#e9e3ff}
    .lead-actions-menu__panel{position:fixed;z-index:3000;top:var(--studio-actions-top,5px);right:auto;left:var(--studio-actions-left,5px);display:grid;width:max-content;min-width:112px;max-width:calc(100vw - 20px);box-sizing:border-box;padding:5px;border:1px solid #e2e5ee;border-radius:10px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.16)}
    .lead-actions-menu__panel button{display:flex;align-items:center;gap:7px;width:100%;padding:8px 9px;border:0;border-radius:7px;color:#526078;background:transparent;font:inherit;font-size:11px;font-weight:800;text-align:right;cursor:pointer}
    .lead-actions-menu__panel button:hover{background:#f4f1ff;color:#6241df}
    .lead-actions-menu__panel .lead-actions-menu__delete{color:#c33f5d}
    .studio-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px}
    .studio-details-grid>div,.studio-details-description{display:grid;gap:6px;padding:13px;border:1px solid #e3e8f1;border-radius:12px;background:#fafbfe}
    .studio-details-grid span,.studio-details-description>span{color:#8993a8;font-size:10px;font-weight:900}
    .studio-details-grid strong{color:#293650;font-size:12px;overflow-wrap:anywhere}
    .studio-details-description{margin-top:10px}.studio-details-description p{margin:0;color:#506078;font-size:12px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}
    .studio-audit-list{display:grid;gap:9px;margin-top:20px}.studio-audit-row{display:grid;grid-template-columns:1fr 1fr auto;gap:6px 10px;padding:12px;border:1px solid #e3e8f1;border-radius:12px;background:#fafbfe}.studio-audit-row strong{color:#5b43c9;font-size:12px}.studio-audit-row span,.studio-audit-row small{color:#8993a8;font-size:10px;font-weight:800}.studio-audit-row p{grid-column:1/-1;margin:2px 0 0;color:#506078;font-size:11px}
    .studio-void-dialog{width:min(480px,100%)}.studio-void-dialog h3{color:#a13e58!important}.studio-void-warning{margin-top:18px;padding:12px;border:1px solid #f0cbd4;border-radius:12px;color:#a13e58;background:#fff5f7;font-size:11px;font-weight:800;line-height:1.8}.studio-void-dialog textarea{width:100%;min-height:90px;box-sizing:border-box;margin-top:14px;padding:11px;border:1px solid #e3b8c2;border-radius:12px;background:#fffafb;color:#273552;font:inherit;font-size:12px;resize:vertical}.studio-void-dialog textarea:focus{outline:0;border-color:#c04d64;box-shadow:0 0 0 4px #c04d6418}.studio-delete-button{color:#c33f5d!important}.studio-delete-button:hover{background:#fff1f4!important;color:#a52e4b!important}
    .studio-pagination{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid #edf0f6}.studio-pagination button{min-width:36px;height:34px;border:1px solid #d9e1ec;border-radius:9px;padding:0 10px;color:#526078;background:#f5f8fc;font:inherit;font-size:11px;font-weight:900;cursor:pointer}.studio-pagination button:hover:not(:disabled),.studio-pagination button.is-active{color:#fff;border-color:#7354f4;background:#7354f4}.studio-pagination button:disabled{opacity:.5;cursor:not-allowed}.studio-pagination__summary{color:#8993a8;font-size:11px;font-weight:800}
    .studio-income{color:#078466!important}.studio-row strong.studio-income{color:#078466!important}.studio-table{overflow-x:auto;overflow-y:visible;padding:0 2px 5px}.studio-row:not(.studio-row--head){min-height:58px;padding:15px 12px;border-radius:10px}.studio-row:not(.studio-row--head):nth-child(even){background:#fcfdff}.studio-editor,.studio-details{max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);overflow:auto}
    @media(max-width:800px){.studio-modal-backdrop{padding:12px}.studio-editor,.studio-details{width:100%;max-width:100%;padding:20px}.lead-actions-menu__panel{max-width:calc(100vw - 20px)}}
    @media(max-width:760px){.studio-table{display:grid;gap:10px;overflow:visible;padding:0}.studio-row.studio-row--head{display:none}.studio-row:not(.studio-row--head){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-width:0!important;min-height:0;margin:0;padding:13px 11px;gap:9px;border:1px solid #e4e8f1;border-radius:15px;background:linear-gradient(145deg,#fff,#fafbff);box-shadow:0 6px 16px #24365d0b}.studio-row:not(.studio-row--head)>span,.studio-row:not(.studio-row--head)>strong{display:flex;min-width:0;flex-direction:column;align-items:flex-start;gap:3px;overflow:hidden;font-size:11px}.studio-row:not(.studio-row--head)>span:before,.studio-row:not(.studio-row--head)>strong:before{color:#8993a8;font-size:9px;font-weight:900}.studio-row:not(.studio-row--head)>span:nth-child(1):before{content:'التاريخ'}.studio-row:not(.studio-row--head)>span:nth-child(2):before{content:'النوع'}.studio-row:not(.studio-row--head)>span:nth-child(3):before{content:'التصنيف'}.studio-row:not(.studio-row--head)>strong:nth-child(4):before{content:'المبلغ'}.studio-row:not(.studio-row--head)>span:nth-child(5):before{content:'الحالة'}.studio-row:not(.studio-row--head)>span:nth-child(5){padding:8px 9px;border-radius:10px;background:#eefbf6;color:#12805d}.studio-row:not(.studio-row--head)>span:nth-child(5).is-voided{background:#fff1f4;color:#b63e58}.studio-row:not(.studio-row--head)>div:nth-child(6){grid-column:1/-1;display:flex;justify-content:flex-start;padding-top:8px;border-top:1px solid #edf0f6}.studio-row:not(.studio-row--head)>div:nth-child(6):before{content:'الإجراءات';margin-left:10px;color:#8993a8;font-size:9px;font-weight:900}.studio-row:not(.studio-row--head)>div:nth-child(6) .lead-actions-menu__trigger{width:38px;height:32px}.studio-details-grid{grid-template-columns:1fr}.studio-audit-row small{grid-column:1/-1}.studio-editor,.studio-details{padding:16px;border-radius:18px}.studio-editor-head h3{font-size:18px}}
    @media(max-width:600px){.studio-pagination{flex-wrap:wrap}.studio-pagination__summary{width:100%;text-align:center;order:-1}}
  </style>
  <section class="studio-hero">
    <div><span class="studio-eyebrow">حساب مستقل</span><h2>{{ pageTitle }}</h2><p>{{ pageDescription }}</p></div>
    <button type="button" class="studio-primary" (click)="openEditor()">+ إضافة حركة</button>
  </section>
  <div class="studio-notice studio-notice--error" *ngIf="error">{{ error }}</div>
  <div class="studio-notice studio-notice--success" *ngIf="success" style="position:fixed;top:18px;left:50%;z-index:2000;width:min(520px,calc(100vw - 32px));box-sizing:border-box;transform:translateX(-50%);text-align:center;box-shadow:0 14px 35px #1d3b532b">{{ success }}</div>
  <section class="studio-filters">
    <div class="studio-filter-heading"><div><span>الفترة</span><h3>ملخص {{ accountLabel }}</h3></div><small>الإيرادات والمصروفات محفوظة في نفس دفتر الحسابات.</small></div>
    <label><span>الشهر</span><input type="month" [(ngModel)]="month" (change)="applyMonth()"></label>
    <button type="button" class="studio-secondary" (click)="load()" [disabled]="loading">{{ loading ? 'جاري التحديث...' : 'تحديث البيانات' }}</button>
  </section>
  <section class="studio-kpis" *ngIf="data as finance">
    <article class="studio-kpi studio-kpi--balance"><span>الرصيد الحالي</span><strong>{{ finance.summary.balance | number:'1.0-2' }} ج</strong><small>{{ finance.account.name }}</small></article>
    <article class="studio-kpi"><span>مصروفات الشهر</span><strong>{{ finance.summary.expense | number:'1.0-2' }} ج</strong><small>الحركات المسجلة خلال الفترة</small></article>
    <article class="studio-kpi"><span>إيرادات الشهر</span><strong>{{ finance.summary.income | number:'1.0-2' }} ج</strong><small>إن وُجدت حركات إيراد</small></article>
    <article class="studio-kpi"><span>صافي الشهر</span><strong>{{ finance.summary.net | number:'1.0-2' }} ج</strong><small>{{ finance.from }} إلى {{ finance.to }}</small></article>
  </section>
  <section class="studio-ledger">
    <div class="studio-section-head"><div><span>دفتر {{ accountLabel }}</span><h3>الحركات المسجلة</h3></div><small *ngIf="data">{{ data.transactions.length }} حركة</small></div>
    <div class="studio-table" *ngIf="data?.transactions?.length; else emptyStudio">
      <div class="studio-row studio-row--head"><span>التاريخ</span><span>النوع</span><span>التصنيف</span><span>المبلغ</span><span>الحالة</span><span>الإجراءات</span></div>
      <div class="studio-row" *ngFor="let item of paginatedStudioTransactions; trackBy: trackById"><span>{{ item.occurredAt }}</span><span [class.studio-income]="item.kind === 'income'">{{ item.kind === 'income' ? 'إيراد' : 'مصروف' }}</span><span>{{ item.category || 'أخرى' }}</span><strong [class.studio-income]="item.kind === 'income'">{{ item.amount | number:'1.0-2' }} ج</strong><span [class.is-voided]="item.status === 'voided'">{{ item.status === 'voided' ? 'ملغاة' : 'مسجلة' }}</span><div class="lead-actions-cell"><div class="lead-actions-menu"><button type="button" class="lead-actions-menu__trigger" (click)="toggleActions(item.id, $event)" [attr.aria-expanded]="actionMenuId === item.id" aria-label="إجراءات" title="الإجراءات"><i class="bi bi-three-dots"></i></button></div></div></div>
    </div>
    <nav class="studio-pagination" *ngIf="studioPages > 1" aria-label="صفحات حركات الاستوديو"><button type="button" (click)="goToStudioPage(studioPage - 1)" [disabled]="studioPage <= 1">السابق</button><button type="button" *ngFor="let page of studioPageNumbers" [class.is-active]="page === studioPage" [attr.aria-current]="page === studioPage ? 'page' : null" (click)="goToStudioPage(page)">{{ page }}</button><span class="studio-pagination__summary">صفحة {{ studioPage }} من {{ studioPages }}</span><button type="button" (click)="goToStudioPage(studioPage + 1)" [disabled]="studioPage >= studioPages">التالي</button></nav>
    <ng-template #emptyStudio><div class="studio-empty">لا توجد حركات في {{ accountLabel }} خلال الشهر المختار.</div></ng-template>
  </section>
  <div *ngIf="actionMenuTransaction as activeAction" class="lead-actions-menu__panel lead-actions-menu__panel--studio"><button type="button" (click)="openDetails(activeAction)"><i class="bi bi-eye"></i> عرض</button><button type="button" *ngIf="activeAction.status !== 'voided'" (click)="openEdit(activeAction)"><i class="bi bi-pencil-square"></i> تعديل</button><button type="button" *ngIf="activeAction.status !== 'voided'" class="studio-delete-button" (click)="openVoidDialog(activeAction)"><i class="bi bi-trash3"></i> حذف</button><button type="button" (click)="openAudit(activeAction)"><i class="bi bi-clock-history"></i> سجل الأنشطة</button></div>
  <div class="studio-modal-backdrop" *ngIf="editorOpen" role="presentation">
    <form class="studio-editor studio-editor--new" role="dialog" aria-modal="true" aria-labelledby="studio-editor-title" (ngSubmit)="save()" novalidate>
      <div class="studio-editor-head"><div><span>{{ editorMode === 'edit' ? 'تعديل الحركة' : 'حركة جديدة' }}</span><h3 id="studio-editor-title">{{ editorMode === 'edit' ? (draft.kind === 'income' ? 'تعديل إيراد ' + accountLabel : 'تعديل مصروف ' + accountLabel) : (draft.kind === 'income' ? 'إضافة إيراد ' + accountLabel : 'إضافة مصروف ' + accountLabel) }}</h3><p>الخزنة محددة تلقائيًا: {{ accountLabel }}</p></div><button type="button" class="studio-close" (click)="closeEditor()" [disabled]="saving" aria-label="إغلاق">×</button></div>
      <div class="studio-form-grid"><label><span>نوع الحركة <b>*</b></span><select name="kind" [(ngModel)]="draft.kind" (change)="onKindChange()" [disabled]="saving || editorMode === 'edit'" required><option value="expense">مصروف</option><option value="income">إيراد</option></select></label><label><span>المبلغ <b>*</b></span><input name="amount" type="number" min="1" max="100000000" step="0.01" [(ngModel)]="draft.amount" placeholder="مثال: 500" [disabled]="saving || editorMode === 'edit'" required></label><label><span>التاريخ <b>*</b></span><input name="occurredAt" type="date" [(ngModel)]="draft.occurredAt" [disabled]="saving" required></label><label><span>التصنيف <b>*</b></span><select name="category" [(ngModel)]="draft.category" [disabled]="saving" required><option value="">اختر التصنيف</option><option *ngFor="let category of activeCategories" [value]="category">{{ category }}</option></select></label><label class="studio-form-wide"><span>السبب / التفاصيل</span><textarea name="description" [(ngModel)]="draft.description" maxlength="500" placeholder="اكتب سبب الحركة وتفاصيلها" [disabled]="saving"></textarea></label></div>
      <div *ngIf="error" class="studio-editor-error" role="alert" aria-live="assertive" style="padding:10px 12px;border:1px solid #f0cbd4;border-radius:11px;color:#b63e58;background:#fff1f4;font-size:12px;font-weight:800">{{ error }}</div>
      <div class="studio-editor-actions"><button type="submit" class="studio-primary studio-save-button" [disabled]="saving">{{ saving ? 'جاري الحفظ...' : (editorMode === 'edit' ? 'حفظ التعديل' : (draft.kind === 'income' ? 'حفظ الإيراد' : 'حفظ المصروف')) }}</button><button type="button" class="studio-secondary" (click)="closeEditor()" [disabled]="saving">إلغاء</button></div>
    </form>
  </div>
  <div class="studio-modal-backdrop" *ngIf="viewingTransaction" (click)="closeDetails()" role="presentation"><section class="studio-details studio-editor" role="dialog" aria-modal="true" aria-labelledby="studio-details-title" (click)="$event.stopPropagation()"><div class="studio-editor-head"><div><span>عرض الحركة</span><h3 id="studio-details-title">تفاصيل حركة {{ accountLabel }}</h3><p>كل البيانات المسجلة لهذه الحركة</p></div><button type="button" class="studio-close" (click)="closeDetails()" aria-label="إغلاق">×</button></div><div class="studio-details-grid"><div><span>نوع الحركة</span><strong>{{ viewingTransaction?.kind === 'income' ? 'إيراد' : 'مصروف' }}</strong></div><div><span>التاريخ</span><strong>{{ viewingTransaction?.occurredAt }}</strong></div><div><span>التصنيف</span><strong>{{ viewingTransaction?.category || 'أخرى' }}</strong></div><div><span>المبلغ</span><strong>{{ viewingTransaction?.amount | number:'1.0-2' }} ج</strong></div><div><span>الحالة</span><strong>{{ viewingTransaction?.status === 'voided' ? 'ملغاة' : 'مسجلة' }}</strong></div><div><span>أنشأها</span><strong>{{ viewingTransaction?.createdBy || 'غير معروف' }}</strong></div><div><span>تاريخ الإنشاء</span><strong>{{ viewingTransaction?.createdAt | date:'medium' }}</strong></div></div><div class="studio-details-description"><span>السبب والتفاصيل</span><p>{{ viewingTransaction?.description || 'بدون وصف' }}</p></div></section></div>
  <div class="studio-modal-backdrop" *ngIf="auditOpen" (click)="closeAudit()" role="presentation"><section class="studio-details studio-editor" role="dialog" aria-modal="true" aria-labelledby="studio-audit-title" (click)="$event.stopPropagation()"><div class="studio-editor-head"><div><span>سجل الأنشطة</span><h3 id="studio-audit-title">سجل نشاط الحركة</h3><p>{{ auditTransaction?.description || 'حركة مالية' }}</p></div><button type="button" class="studio-close" (click)="closeAudit()" aria-label="إغلاق">×</button></div><div class="studio-audit-list"><div class="studio-audit-row" *ngFor="let log of auditLogs"><strong>{{ auditLabel(log.action) }}</strong><span>{{ log.actor || 'غير معروف' }}</span><small>{{ log.createdAt | date:'medium' }}</small><p>{{ log.reason || 'تم تسجيل العملية' }}</p></div><div class="studio-empty" *ngIf="!auditLogs.length">{{ auditLoading ? 'جاري تحميل سجل الأنشطة...' : 'لا يوجد سجل نشاط لهذه الحركة.' }}</div></div></section></div>
  <div class="studio-modal-backdrop" *ngIf="voidingTransaction" (click)="closeVoidDialog()" role="presentation"><section class="studio-editor studio-void-dialog" role="dialog" aria-modal="true" aria-labelledby="studio-void-title" (click)="$event.stopPropagation()"><div class="studio-editor-head"><div><span>حذف آمن</span><h3 id="studio-void-title">إلغاء حركة {{ accountLabel }}</h3><p>{{ voidingTransaction.description || 'حركة مالية' }}</p></div><button type="button" class="studio-close" (click)="closeVoidDialog()" [disabled]="voiding" aria-label="إغلاق">×</button></div><div class="studio-void-warning">سيتم إخفاء الحركة من إجمالي الحسابات مع الاحتفاظ بها في سجل الأنشطة. لا يوجد حذف نهائي للبيانات المالية.</div><textarea [(ngModel)]="voidReasonDraft" maxlength="300" placeholder="اكتب سبب الإلغاء (مطلوب)"></textarea><div *ngIf="voidError" class="studio-editor-error" role="alert" style="margin-top:10px;padding:10px 12px;border:1px solid #f0cbd4;border-radius:11px;color:#b63e58;background:#fff1f4;font-size:12px;font-weight:800">{{ voidError }}</div><div class="studio-editor-actions"><button type="button" class="studio-primary studio-delete-button" (click)="confirmVoid()" [disabled]="voiding">{{ voiding ? 'جاري الحذف...' : 'تأكيد الحذف' }}</button><button type="button" class="studio-secondary" (click)="closeVoidDialog()" [disabled]="voiding">إلغاء</button></div></section></div>
</div>`,
  styles: [`
:host{display:block;min-width:0;max-width:100%;overflow-x:hidden}.studio-finance{display:grid;gap:18px;width:100%;min-width:0;max-width:1180px;box-sizing:border-box;margin:0 auto;padding:4px 2px 34px;color:#263451;overflow-x:hidden}.studio-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;width:100%;min-width:0;box-sizing:border-box;min-height:170px;padding:30px 34px;border-radius:28px;background:linear-gradient(120deg,#10233e,#16475a 58%,#087f74);color:#fff;box-shadow:0 20px 45px #12334a25}.studio-eyebrow{display:inline-flex;padding:6px 10px;border-radius:999px;background:#ffffff1c;color:#c5fff3;font-size:10px;font-weight:900}.studio-hero h2{margin:13px 0 7px;font-size:31px}.studio-hero p{margin:0;color:#cbe4e6;font-size:13px}.studio-primary,.studio-secondary{border:0;border-radius:12px;padding:12px 18px;font:inherit;font-size:12px;font-weight:900;cursor:pointer;transition:.18s}.studio-primary{color:#fff;background:linear-gradient(135deg,#7354f4,#5136c8);box-shadow:0 9px 18px #6548dc2b}.studio-hero .studio-primary{color:#16424c;background:#fff}.studio-secondary{border:1px solid #d9e1ec;background:#f5f8fc;color:#43536e}.studio-primary:hover,.studio-secondary:hover{transform:translateY(-1px)}button:disabled{opacity:.55;cursor:wait;transform:none}.studio-notice{padding:11px 14px;border-radius:12px;font-size:12px;font-weight:800}.studio-notice--error{border:1px solid #f0cbd4;background:#fff1f4;color:#b63e58}.studio-notice--success{border:1px solid #c7eddf;background:#edfbf5;color:#12805d}.studio-filters,.studio-ledger{width:100%;min-width:0;box-sizing:border-box;padding:22px;border:1px solid #dfe6f1;border-radius:23px;background:#fff;box-shadow:0 12px 30px #26365d0a}.studio-filters{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:14px}.studio-filter-heading,.studio-section-head{grid-column:1/-1;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-width:0;padding-bottom:15px;border-bottom:1px solid #edf1f6}.studio-filter-heading span,.studio-section-head span{color:#7354f4;font-size:10px;font-weight:900}.studio-filter-heading h3,.studio-section-head h3{margin:5px 0 0;color:#1e2c49;font-size:18px}.studio-filter-heading small,.studio-section-head small{color:#8994a8;font-size:11px;font-weight:700}.studio-filter-heading small{overflow-wrap:anywhere}.studio-filters label{display:grid;gap:7px;color:#63718a;font-size:11px;font-weight:900;min-width:0}.studio-filters input{width:100%;min-height:46px;box-sizing:border-box;border:1px solid #dce4f0;border-radius:12px;padding:0 12px;background:#f9fbfe;color:#263653;font:inherit;font-weight:800}.studio-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%;min-width:0;box-sizing:border-box}.studio-kpi{display:grid;gap:7px;min-width:0;min-height:108px;padding:18px 20px;border:1px solid #e0e6f1;border-top:4px solid #7354f4;border-radius:18px;background:#fff;box-shadow:0 12px 25px #26365d0c}.studio-kpi--balance{border-top-color:#079b87;background:linear-gradient(145deg,#f0fffb,#fff)}.studio-kpi span{color:#7b879c;font-size:11px;font-weight:850}.studio-kpi strong{color:#1d2b49;font-size:22px}.studio-kpi--balance strong{color:#087f74}.studio-kpi small{color:#9aa4b5;font-size:10px;font-weight:700;overflow-wrap:anywhere}.studio-table{overflow:auto;margin-top:18px}.studio-row{display:grid;grid-template-columns:1fr 1.1fr 2.2fr 1fr .8fr;align-items:center;gap:12px;min-width:700px;padding:13px 10px;border-bottom:1px solid #edf0f5;color:#506078;font-size:12px}.studio-row--head{border-radius:10px;color:#8a95a9;background:#fafbfe;font-size:10px;font-weight:900}.studio-row strong{color:#b64b5e}.studio-description{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.is-voided{color:#b63e58}.studio-empty{padding:36px 15px;text-align:center;color:#8792a6}.studio-modal-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:18px;background:#101a31a6;backdrop-filter:blur(7px)}.studio-editor{width:min(620px,100%);box-sizing:border-box;padding:25px;border:1px solid #e1e6f2;border-radius:24px;background:#fff;box-shadow:0 30px 90px #111a3350}.studio-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding-bottom:17px;border-bottom:1px solid #edf0f6}.studio-editor-head span{color:#7354f4;font-size:10px;font-weight:900}.studio-editor-head h3{margin:6px 0;color:#202d4b;font-size:20px}.studio-editor-head p{margin:0;color:#8993a8;font-size:11px}.studio-close{width:38px;height:38px;border:1px solid #ddd8ff;border-radius:12px;color:#5b43c9;background:#f8f6ff;font:inherit;font-size:20px;cursor:pointer}.studio-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-top:20px}.studio-form-grid label{display:grid;gap:7px;color:#52617a;font-size:11px;font-weight:900}.studio-form-grid label span b{color:#d35d70}.studio-form-grid input,.studio-form-grid select,.studio-form-grid textarea{width:100%;box-sizing:border-box;min-height:46px;border:1px solid #dfe5f0;border-radius:12px;padding:0 12px;background:#fbfcff;color:#273552;font:inherit;font-size:12px}.studio-form-grid textarea{min-height:100px;padding-top:11px;resize:vertical}.studio-form-wide{grid-column:1/-1}.studio-editor-actions{display:flex;gap:9px;margin-top:20px;padding-top:18px;border-top:1px solid #edf0f6}.studio-editor-actions button{min-width:130px}.studio-editor-actions .studio-secondary{order:2}@media(max-width:800px){.studio-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.studio-finance{gap:13px;padding:0 0 20px}.studio-hero{align-items:stretch;flex-direction:column;min-height:0;padding:23px 20px;border-radius:20px}.studio-hero h2{font-size:25px}.studio-hero .studio-primary{width:100%}.studio-filters{grid-template-columns:1fr;padding:16px}.studio-filters .studio-secondary{width:100%}.studio-filter-heading,.studio-section-head{align-items:flex-start;flex-direction:column;gap:5px}.studio-kpis{grid-template-columns:1fr 1fr;gap:8px}.studio-kpi{min-height:94px;padding:14px}.studio-kpi strong{font-size:17px}.studio-ledger{padding:14px}.studio-editor{max-height:calc(100dvh - 24px);overflow:auto;padding:20px;border-radius:20px}.studio-form-grid{grid-template-columns:1fr}.studio-form-wide{grid-column:auto}.studio-editor-actions{flex-direction:column}.studio-editor-actions button{width:100%}.studio-editor-actions .studio-secondary{order:0}}
`]
})
export class StudioFinanceFormComponent implements OnInit, OnDestroy {
  @Input() accountId: 'application' | 'studio' = 'studio';
  @Input() accountLabel = 'الاستوديو';
  @Input() pageTitle = 'حسابات الاستوديو';
  @Input() pageDescription = 'أضف إيرادات ومصروفات الاستوديو، وستظهر تلقائيًا في دفتر الحسابات الرئيسي.';
  private readonly api = inject(AdminApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  data: StudioFinanceResponse | null = null;
  loading = false;
  saving = false;
  error = '';
  success = '';
  editorOpen = false;
  editorMode: 'create' | 'edit' = 'create';
  editingTransaction: FinanceTransaction | null = null;
  actionMenuId = '';
  viewingTransaction: FinanceTransaction | null = null;
  auditTransaction: FinanceTransaction | null = null;
  auditLogs: FinanceAuditLog[] = [];
  auditOpen = false;
  auditLoading = false;
  voidingTransaction: FinanceTransaction | null = null;
  voidReasonDraft = '';
  voidError = '';
  voiding = false;
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  month = '';
  studioPage = 1;
  readonly studioPageSize = 10;
  draft = { kind: 'expense' as 'income' | 'expense', amount: null as number | null, occurredAt: '', category: '', description: '' };
  readonly studioExpenseCategories = ['إيجار', 'أدوات ومستلزمات', 'مصاريف إدارية'];
  readonly studioIncomeCategories = ['اشتراكات ومبيعات', 'خدمات الاستوديو', 'أخرى'];
  readonly applicationExpenseCategories = ['الأكواد', 'تسويق', 'المهندسين', 'مصروفات تشغيلية', 'رواتب', 'اشتراكات خدمات', 'مواصلات', 'أخرى'];
  readonly applicationIncomeCategories = ['اشتراكات ومبيعات', 'أخرى'];
  get expenseCategories(): string[] { return this.accountId === 'application' ? this.applicationExpenseCategories : this.studioExpenseCategories; }
  get incomeCategories(): string[] { return this.accountId === 'application' ? this.applicationIncomeCategories : this.studioIncomeCategories; }
  get activeCategories(): string[] { return this.draft.kind === 'income' ? this.incomeCategories : this.expenseCategories; }
  get studioTransactions(): FinanceTransaction[] { return this.data?.transactions || []; }
  get studioPages(): number { return Math.max(1, Math.ceil(this.studioTransactions.length / this.studioPageSize)); }
  get studioPageNumbers(): number[] { return Array.from({ length: this.studioPages }, (_, index) => index + 1); }
  get paginatedStudioTransactions(): FinanceTransaction[] {
    const page = Math.min(Math.max(this.studioPage, 1), this.studioPages);
    const start = (page - 1) * this.studioPageSize;
    return this.studioTransactions.slice(start, start + this.studioPageSize);
  }
  get actionMenuTransaction(): FinanceTransaction | null { return this.data?.transactions.find(item => item.id === this.actionMenuId) || null; }

  ngOnInit(): void {
    const now = new Date();
    this.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.load();
  }

  ngOnDestroy(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  private showSuccess(message: string): void {
    if (this.successTimer) clearTimeout(this.successTimer);
    this.success = message;
    this.successTimer = setTimeout(() => {
      this.success = '';
      this.successTimer = null;
      this.cdr.detectChanges();
    }, 4500);
    this.cdr.detectChanges();
  }

  applyMonth(): void { this.studioPage = 1; this.actionMenuId = ''; this.load(); }

  goToStudioPage(page: number): void {
    const nextPage = Math.min(Math.max(Math.trunc(page) || 1, 1), this.studioPages);
    if (nextPage === this.studioPage) return;
    this.studioPage = nextPage;
    this.actionMenuId = '';
    this.cdr.detectChanges();
  }

  load(): void {
    const [year, month] = this.month.split('-').map(Number);
    if (!year || !month) return;
    const from = `${this.month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    this.loading = true;
    this.error = '';
    (this.accountId === 'studio' ? this.api.getStudioFinance(from, to) : this.api.getApplicationFinance(from, to)).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: value => {
        this.data = value;
        this.studioPage = Math.min(this.studioPage, this.studioPages);
        this.actionMenuId = '';
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = err?.error?.message || `تعذر تحميل ${this.accountLabel}.`;
        this.cdr.detectChanges();
      }
    });
  }

  openEditor(): void { this.error = ''; this.success = ''; this.editorMode = 'create'; this.editingTransaction = null; this.draft = { kind: 'expense', amount: null, occurredAt: this.localDateInput(), category: '', description: '' }; this.editorOpen = true; }
  openEdit(item: FinanceTransaction): void { this.actionMenuId = ''; this.error = ''; this.success = ''; this.editorMode = 'edit'; this.editingTransaction = item; this.draft = { kind: item.kind === 'income' ? 'income' : 'expense', amount: item.amount, occurredAt: item.occurredAt, category: item.category || '', description: item.description || '' }; this.editorOpen = true; }
  onKindChange(): void { if (!this.activeCategories.includes(this.draft.category)) this.draft.category = ''; }
  closeEditor(): void { if (!this.saving) { this.editorOpen = false; this.editorMode = 'create'; this.editingTransaction = null; } }
  toggleActions(id: string, event: MouseEvent): void {
    if (this.actionMenuId === id) { this.actionMenuId = ''; return; }
    this.actionMenuId = id;
    this.cdr.detectChanges();
    this.positionActionMenu(event.currentTarget as HTMLElement | null);
  }
  @HostListener('document:click', ['$event'])
  closeActionsOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.lead-actions-menu__trigger, .lead-actions-menu__panel--studio')) return;
    this.closeActionMenu();
  }
  @HostListener('window:scroll')
  @HostListener('document:scroll')
  @HostListener('document:wheel')
  @HostListener('document:touchmove')
  @HostListener('window:resize')
  closeActionsOnViewportMove(): void { this.closeActionMenu(); }
  private closeActionMenu(): void {
    if (!this.actionMenuId) return;
    this.actionMenuId = '';
    this.cdr.detectChanges();
  }
  private positionActionMenu(trigger: HTMLElement | null): void {
    if (!trigger) return;
    const triggerRectAtClick = trigger.getBoundingClientRect();
    const applyPosition = (): void => {
      const rect = trigger.isConnected ? trigger.getBoundingClientRect() : triggerRectAtClick;
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
      const edge = 10;
      const renderedMenu = document.querySelector('.lead-actions-menu__panel--studio') as HTMLElement | null;
      if (renderedMenu && renderedMenu.parentElement !== document.body) document.body.appendChild(renderedMenu);
      const renderedRect = renderedMenu?.getBoundingClientRect();
      const menuWidth = Math.min(renderedRect?.width || 140, Math.max(112, viewportWidth - edge * 2));
      const menuHeight = Math.min(renderedRect?.height || 125, Math.max(96, viewportHeight - edge * 2));
      const rawTop = rect.top;
      const rawLeft = rect.right + menuWidth + edge <= viewportWidth ? rect.right + 6 : rect.left - menuWidth - 6;
      const top = Math.min(Math.max(edge, rawTop), Math.max(edge, viewportHeight - menuHeight - edge));
      const left = Math.min(Math.max(edge, rawLeft), Math.max(edge, viewportWidth - menuWidth - edge));
      document.documentElement.style.setProperty('--studio-actions-top', `${top}px`);
      document.documentElement.style.setProperty('--studio-actions-left', `${left}px`);
    };
    applyPosition();
    requestAnimationFrame(applyPosition);
    setTimeout(applyPosition, 0);
  }
  openDetails(item: FinanceTransaction): void { this.actionMenuId = ''; this.viewingTransaction = item; }
  closeDetails(): void { this.viewingTransaction = null; }
  openAudit(item: FinanceTransaction): void { this.actionMenuId = ''; this.auditTransaction = item; this.auditLogs = []; this.auditLoading = true; this.auditOpen = true; const request = this.accountId === 'studio' ? this.api.listStudioFinanceAuditLogs(item.id) : this.api.listApplicationFinanceAuditLogs(item.id); request.subscribe({ next: value => { this.auditLogs = value.data; this.auditLoading = false; this.cdr.detectChanges(); }, error: err => { this.auditLoading = false; this.error = err?.error?.message || 'تعذر تحميل سجل الأنشطة.'; this.cdr.detectChanges(); } }); }
  closeAudit(): void { this.auditOpen = false; this.auditTransaction = null; }
  auditLabel(action: string): string { return action === 'created' ? 'إنشاء' : action === 'updated' ? 'تعديل' : action === 'voided' ? 'إلغاء' : action; }
  openVoidDialog(item: FinanceTransaction): void { this.actionMenuId = ''; this.voidingTransaction = item; this.voidReasonDraft = ''; this.voidError = ''; }
  closeVoidDialog(): void { if (this.voiding) return; this.voidingTransaction = null; this.voidReasonDraft = ''; this.voidError = ''; }
  confirmVoid(): void {
    if (!this.voidingTransaction) return;
    const reason = this.voidReasonDraft.trim();
    if (reason.length < 3) { this.voidError = 'اكتب سبب الإلغاء أولًا.'; return; }
    this.voiding = true;
    this.voidError = '';
    (this.accountId === 'studio' ? this.api.voidStudioFinanceTransaction(this.voidingTransaction.id, reason) : this.api.voidApplicationFinanceTransaction(this.voidingTransaction.id, reason)).pipe(
      timeout({ first: 15000 }),
      finalize(() => { this.voiding = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.voidingTransaction = null;
        this.voidReasonDraft = '';
        this.showSuccess(`تم إلغاء الحركة من ${this.accountLabel} وتسجيل السبب في سجل الأنشطة.`);
        this.load();
      },
      error: err => {
        this.voidError = err?.name === 'TimeoutError' ? 'استغرق الحذف وقتًا طويلًا. حاول مرة أخرى.' : (err?.error?.message || 'تعذر إلغاء الحركة.');
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    const amount = Number(this.draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) { this.error = 'اكتب مبلغًا صحيحًا أكبر من صفر.'; return; }
    if (amount > 100000000) { this.error = 'المبلغ لا يمكن أن يتجاوز 100,000,000 جنيه.'; return; }
    if (!this.draft.occurredAt || !this.draft.category) { this.error = 'التاريخ والتصنيف مطلوبان.'; return; }
    if (this.draft.description.length > 500) { this.error = 'التفاصيل طويلة جدًا.'; return; }
    this.saving = true;
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();
    const request = this.editorMode === 'edit' && this.editingTransaction
      ? (this.accountId === 'studio' ? this.api.updateStudioFinanceTransaction(this.editingTransaction.id, { occurredAt: this.draft.occurredAt, category: this.draft.category, description: this.draft.description.trim() }) : this.api.updateApplicationFinanceTransaction(this.editingTransaction.id, { occurredAt: this.draft.occurredAt, category: this.draft.category, description: this.draft.description.trim() }))
      : (this.accountId === 'studio' ? this.api.createStudioFinanceTransaction({ kind: this.draft.kind, amount, occurredAt: this.draft.occurredAt, category: this.draft.category, description: this.draft.description.trim() }) : this.api.createApplicationFinanceTransaction({ kind: this.draft.kind, amount, occurredAt: this.draft.occurredAt, category: this.draft.category, description: this.draft.description.trim() }));
    request.pipe(
      timeout({ first: 15000 }),
      finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.editorOpen = false;
        this.showSuccess(this.editorMode === 'edit' ? `تم تعديل الحركة في ${this.accountLabel} بنجاح.` : `تم حفظ الحركة في ${this.accountLabel} وتسجيلها في دفتر الحسابات الرئيسي.`);
        this.cdr.detectChanges();
        this.load();
      },
      error: err => {
        this.editorOpen = true;
        this.success = '';
        this.error = err?.name === 'TimeoutError'
          ? 'استغرق الحفظ وقتًا طويلًا. تحقق من الاتصال ثم حاول مرة أخرى.'
          : (err?.error?.message || 'تعذر حفظ المصروف.');
        this.cdr.detectChanges();
      }
    });
  }

  private localDateInput(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  trackById(_index: number, item: FinanceTransaction): string { return item.id; }
}
