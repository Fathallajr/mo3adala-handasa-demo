import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

interface EmployeeNote { id: number; text: string; createdAt: string; }
interface PayrollAdjustment { id: number; kind: 'bonus' | 'discount'; amount: number; reason: string; }
interface EmployeeMonth { month: string; salary: number | null; notes: EmployeeNote[]; adjustments: PayrollAdjustment[]; }
type EmployeeType = 'employee' | 'manager' | 'general_manager';
interface Employee { id: number; name: string; titles: string[]; whatsapp?: string; email?: string; description?: string; baseSalary?: number | null; department?: string; employeeType?: EmployeeType; managerId?: number | null; monthlyRecords?: EmployeeMonth[]; job?: string; }
interface EmployeeDraft { name: string; titleInput: string; titles: string[]; whatsapp: string; email: string; password: string; description: string; baseSalary: number | null; department: string; employeeType: EmployeeType; managerId: number | null; }

@Component({
	selector: 'app-employees-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [`
		:host{display:block;color:#202b42}.wrap{display:grid;gap:20px}.intro{margin:0;color:#758098;line-height:1.8}.form-card,.employee-card,.payroll-summary{padding:18px;border:1px solid #e5e9f2;border-radius:16px;background:#fff}.form-card h3{margin:0 0 14px;font-size:16px}.fields{display:grid;grid-template-columns:1fr 1fr 1fr auto;align-items:end;gap:12px}.field{display:grid;gap:7px;color:#65718b;font-size:12px;font-weight:800}.field input,.field select{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #dfe4ed;border-radius:10px;padding:0 12px;font:inherit;color:#202b42;background:#fff}.add,.save-edit{min-height:42px;border:0;border-radius:10px;padding:0 18px;background:#6d4aff;color:#fff;font:inherit;font-weight:900;cursor:pointer}.employee-toolbar{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}.employee-toolbar>.add{flex:0 0 auto}.employee-filters{display:flex;align-items:flex-end;gap:9px;flex:1;flex-wrap:wrap}.employee-filters .field{min-width:190px;flex:1}.clear-filters{min-height:42px;border:1px solid #ddd7ff;border-radius:10px;padding:0 13px;color:#5b43c9;background:#f7f5ff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.draft-titles,.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.title-chip,.tag{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#f0edff;color:#5b43c9;font-size:11px;font-weight:900}.chip-remove{border:0;padding:0;color:#7465b8;background:transparent;font-size:14px;line-height:1;cursor:pointer}.error{margin:10px 0 0;color:#b63e58;font-size:12px;font-weight:800}.head{display:flex;align-items:center;justify-content:space-between;gap:12px}.head h3{margin:0;font-size:16px}.count{color:#8172c8;font-size:12px;font-weight:900}.month-picker{display:flex;align-items:center;gap:9px;color:#65718b;font-size:12px;font-weight:900}.month-picker input{min-height:38px;border:1px solid #dfe4ed;border-radius:9px;padding:0 9px;font:inherit;color:#202b42;background:#fff}.payroll-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px;background:#f8f9fd}.summary-card{display:grid;gap:6px;padding:12px;border:1px solid #e8ebf2;border-radius:12px;background:#fff}.summary-card span{color:#7b869b;font-size:11px;font-weight:800}.summary-card strong{color:#293650;font-size:15px}.summary-card--net{border-color:#d9d1ff;background:#f7f5ff}.summary-card--net strong{color:#5b43c9}.list{display:grid;gap:10px}.employee-table-head,.employee-card{display:grid;grid-template-columns:minmax(150px,1.25fr) minmax(80px,.65fr) minmax(160px,1.35fr) minmax(120px,1fr) minmax(120px,1fr) minmax(130px,auto) auto;align-items:center;gap:14px}.employee-table-head{padding:0 15px;color:#8993a8;font-size:11px;font-weight:900}.employee-card{padding:13px 15px;border:1px solid #e5e9f2;border-radius:16px;background:#fff}.identity{display:grid;gap:8px}.employee-name{justify-self:start;border:0;padding:0;color:#202b42;background:none;text-align:right;font:inherit;font-weight:900;cursor:pointer}.employee-name:hover{color:#5b43c9}.employee-tasks{display:flex;flex-wrap:wrap;gap:6px}.employee-column-label{display:none;color:#8993a8;font-size:10px;font-weight:800}.employee-contact{display:grid;gap:5px;min-width:130px}.contact-label{color:#8993a8;font-size:10px;font-weight:800}.contact-value{color:#34415b;font-size:12px;font-weight:800;direction:ltr;text-align:right}.contact-value--empty{color:#a1a9b8;font-weight:600}.actions{display:flex;align-items:center;gap:7px}.edit,.delete,.cancel-edit{border:0;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.edit{background:#f0edff;color:#5b43c9}.delete{background:#fff0f3;color:#ae3f59}.cancel-edit{background:#f1f3f7;color:#59657a}.employee-month-total{color:#4f3bc0;font-size:12px;font-weight:900}.edit-panel{grid-column:1/-1;display:grid;gap:12px;padding-top:13px;border-top:1px solid #edf0f5}.details{grid-column:1/-1;display:grid;gap:14px;padding-top:15px;border-top:1px solid #edf0f5}.details-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.details-head h4{margin:0;font-size:15px}.details-month{color:#6d4aff;font-size:12px;font-weight:900}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-section{display:grid;align-content:start;gap:10px;padding:14px;border:1px solid #edf0f5;border-radius:13px;background:#fbfcff}.detail-section h5{margin:0;font-size:13px}.detail-section .fields{grid-template-columns:minmax(0,1fr) auto}.note-list,.adjustment-list{display:grid;gap:7px}.note-item,.adjustment-item{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:9px;background:#fff;border:1px solid #edf0f5}.note-text{line-height:1.6;font-size:12px}.note-date{display:block;margin-top:3px;color:#929bad;font-size:10px}.adjustment-info{display:grid;gap:3px;font-size:12px}.adjustment-kind{font-weight:900}.adjustment-kind--bonus{color:#13825f}.adjustment-kind--discount{color:#b64d62}.adjustment-amount{white-space:nowrap;font-size:12px;font-weight:900}.remove-small{flex:0 0 auto;border:0;background:none;color:#b64d62;font-size:16px;cursor:pointer}.empty{padding:20px;text-align:center;border:1px dashed #dfe4ed;border-radius:11px;color:#8993a8;font-size:12px}.details-total{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:11px;background:#f0edff;color:#5b43c9;font-size:13px;font-weight:900}
		@media(max-width:850px){.fields{grid-template-columns:1fr 1fr}.payroll-summary{grid-template-columns:1fr 1fr}.employee-table-head{display:none}.employee-card{grid-template-columns:1fr auto}.employee-column-label{display:block}.employee-contact{grid-column:1;grid-row:2}.detail-grid{grid-template-columns:1fr}}
		@media(max-width:650px){.fields,.detail-section .fields{grid-template-columns:1fr}.add{width:100%}.employee-card{align-items:flex-start}.employee-contact{grid-column:1;grid-row:auto}.actions{flex-direction:column;align-items:stretch}.month-picker{align-items:flex-start;flex-direction:column}.payroll-summary{grid-template-columns:1fr 1fr}}
		.action-menu-trigger{width:38px;height:38px;border:1px solid #ddd7ff;border-radius:10px;background:#f7f5ff;color:#5b43c9;font-size:23px;font-weight:900;line-height:1;cursor:pointer}.action-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:20;display:grid;min-width:130px;gap:5px;padding:7px;border:1px solid #e5e9f2;border-radius:11px;background:#fff;box-shadow:0 12px 30px #202b4225}.action-menu button{width:100%;white-space:nowrap}.actions{position:relative;justify-content:center}.monthly-save-row{display:flex;align-items:center;justify-content:flex-start;gap:10px;margin-top:12px}.monthly-save-message{color:#13825f;font-size:12px;font-weight:900}.monthly-save-error{color:#b63e58;font-size:12px;font-weight:800}.field textarea{width:100%;min-height:90px;box-sizing:border-box;resize:vertical;border:1px solid #dfe4ed;border-radius:10px;padding:10px 12px;font:inherit;color:#202b42;background:#fff}.salary-readonly{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #e5e9f2;border-radius:10px;background:#fff}.salary-readonly span{color:#8993a8;font-size:11px;font-weight:800}.salary-readonly strong{color:#293650;font-size:15px}.view-field{display:grid;align-content:center;gap:7px;min-height:42px;padding:0 12px;color:#65718b;font-size:12px;font-weight:800}.view-field strong{color:#293650;font-size:13px;line-height:1.6;white-space:pre-wrap}.view-field--wide{min-height:90px;align-content:start;padding-top:10px}
		.employee-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(15,22,42,.62);backdrop-filter:blur(4px)}.employee-modal{display:grid;gap:18px;width:min(1100px,100%);max-height:min(92vh,940px);overflow:auto;box-sizing:border-box;padding:24px;border:1px solid #e3e7f0;border-radius:20px;background:#fff;box-shadow:0 24px 80px #11182b50}.employee-add-modal{width:min(760px,100%)}.modal-header{position:sticky;top:-24px;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin:-24px -24px 0;padding:20px 24px 15px;border-bottom:1px solid #edf0f5;background:#fff}.modal-header h3{margin:0 0 5px;font-size:20px}.modal-subtitle{margin:0;color:#7b869b;font-size:12px}.modal-close{width:38px;height:38px;border:0;border-radius:11px;background:#f1f3f7;color:#45516a;font-size:23px;cursor:pointer}.profile-section{display:grid;gap:13px;padding:16px;border:1px solid #edf0f5;border-radius:15px;background:#fbfcff}.profile-section h4{margin:0;font-size:14px}.profile-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.modal-save-row{display:flex;justify-content:flex-start;gap:8px}.modal-month-pill{padding:7px 10px;border-radius:9px;background:#f0edff;color:#5b43c9;font-size:12px;font-weight:900}
		.employee-detail-page-backdrop{position:static;display:block;padding:0;background:transparent;backdrop-filter:none}.employee-detail-page{width:100%;max-height:none;box-shadow:none;border-radius:16px}.employee-detail-page .modal-header{position:static;margin:-24px -24px 0}.wrap>.payroll-summary{display:none}
		@media(max-width:650px){.employee-modal-backdrop{padding:8px}.employee-modal{max-height:96vh;padding:15px;border-radius:15px}.modal-header{top:-15px;margin:-15px -15px 0;padding:15px}.profile-fields{grid-template-columns:1fr}.modal-header h3{font-size:17px}}
		.employee-detail-page .profile-fields{gap:14px}.employee-detail-page .view-field{min-height:64px;padding:11px 14px;border:1px solid #e8ebf2;border-radius:12px;background:#fff;box-sizing:border-box}.employee-detail-page .view-field--wide{grid-column:1/-1;min-height:86px}.employee-detail-page .view-field span{color:#8993a8;font-size:11px}.employee-detail-page .view-field strong{color:#293650;font-size:13px}.employee-detail-page .draft-titles{margin-top:2px}.employee-detail-page .title-chip{background:#f0edff}.employee-detail-page .profile-section h4{padding-bottom:2px}
	`],
	template: `
		<div class="wrap" *ngIf="content">
			<p class="intro" *ngIf="!employeePageEmployee">سجّل الموظفين ومسمياتهم، وافتح ملف الموظف لإدارة ملاحظاته وراتبه والبونص والخصومات لكل شهر. كل البيانات داخل لوحة الإدارة فقط.</p>
			<div class="employee-toolbar" *ngIf="!isEmployeeAccount && !employeePageEmployee">
				<button type="button" class="add" (click)="openAddEmployee()">+ إضافة موظف</button>
				<div class="employee-filters">
					<label class="field"><span>بحث في الموظفين</span><input [(ngModel)]="employeeSearch" placeholder="الاسم، الواتساب أو المسمى"></label>
					<label class="field"><span>المسمى الوظيفي</span><select [(ngModel)]="employeeTitleFilter"><option value="">كل المسميات</option><option *ngFor="let title of employeeTitles" [value]="title">{{ title }}</option></select></label>
					<label class="field"><span>نوع الإدارة</span><select [(ngModel)]="employeeDepartmentFilter"><option value="">كل الإدارات</option><option *ngFor="let department of employeeDepartments" [value]="department">{{ department }}</option></select></label>
					<label class="field"><span>نوع الموظف</span><select [(ngModel)]="employeeTypeFilter"><option value="">الكل</option><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
					<label class="field"><span>المدير المباشر</span><select [(ngModel)]="employeeManagerFilter"><option [ngValue]="null">كل المديرين</option><option *ngFor="let manager of employeeManagers" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
					<button type="button" class="clear-filters" *ngIf="employeeSearch || employeeTitleFilter || employeeDepartmentFilter || employeeTypeFilter || employeeManagerFilter" (click)="clearEmployeeFilters()">مسح الفلاتر</button>
				</div>
			</div>
			<div class="employee-modal-backdrop" *ngIf="showAddEmployee && !employeePageEmployee" (click)="closeAddEmployee()">
				<section class="employee-modal employee-add-modal" role="dialog" aria-modal="true" aria-label="إضافة موظف" (click)="$event.stopPropagation()">
					<header class="modal-header"><div><h3>إضافة موظف جديد</h3><p class="modal-subtitle">أدخل البيانات الأساسية للموظف ثم احفظها.</p></div><button type="button" class="modal-close" aria-label="إغلاق" (click)="closeAddEmployee()">×</button></header>
					<section class="profile-section"><h4>البيانات الأساسية</h4><div class="profile-fields">
						<label class="field"><span>اسم الموظف</span><input [(ngModel)]="draft.name" placeholder="اكتب الاسم"></label>
						<label class="field"><span>رقم الواتساب</span><input type="tel" inputmode="tel" [(ngModel)]="draft.whatsapp" placeholder="مثال: 2010xxxxxxxx"></label>
						<label class="field"><span>البريد الإلكتروني</span><input type="email" [(ngModel)]="draft.email" placeholder="employee@example.com"></label>
						<label class="field"><span>كلمة السر</span><input type="password" [(ngModel)]="draft.password" placeholder="10 أحرف على الأقل"></label>
						<label class="field"><span>وصف الوظيفة</span><textarea [(ngModel)]="draft.description" placeholder="اكتب وصفًا مختصرًا لمهام الوظيفة"></textarea></label>
						<label class="field"><span>الراتب الأساسي</span><input type="number" min="0" step="0.01" [(ngModel)]="draft.baseSalary" placeholder="الراتب الشهري"></label>
						<label class="field"><span>نوع الموظف</span><select [(ngModel)]="draft.employeeType" (ngModelChange)="onDraftTypeChange($event)"><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
						<label class="field"><span>نوع الإدارة</span><select [(ngModel)]="draft.department"><option value="">اختر نوع الإدارة</option><option *ngFor="let department of employeeDepartmentOptions" [value]="department">{{ department }}</option></select></label>
						<label class="field" *ngIf="draft.employeeType !== 'general_manager'"><span>{{ draft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }}</span><select [(ngModel)]="draft.managerId"><option [ngValue]="null">اختر المسؤول</option><option *ngFor="let manager of employeeManagersFor(draft.employeeType, null)" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
						<label class="field"><span>مسمى وظيفي</span><input [(ngModel)]="draft.titleInput" (keyup.enter)="addDraftTitle()" placeholder="مثال: خدمة عملاء"></label>
						<button type="button" class="edit" (click)="addDraftTitle()">+ إضافة مسمى</button>
					</div>
					<div class="draft-titles" *ngIf="draft.titles.length"><span class="title-chip" *ngFor="let title of draft.titles; let i = index">{{ title }}<button type="button" class="chip-remove" aria-label="حذف المسمى" (click)="removeDraftTitle(i)">×</button></span></div>
					<p class="error" *ngIf="errorMessage">{{ errorMessage }}</p><div class="modal-save-row"><button type="button" class="add" [disabled]="isSavingEmployee" (click)="addEmployee()">{{ isSavingEmployee ? 'جاري الحفظ...' : 'حفظ الموظف' }}</button></div></section>
				</section>
			</div>
			<section class="wrap">
				<div class="head" *ngIf="!employeePageEmployee"><h3>الموظفون</h3><span class="count">{{ filteredEmployees.length }} من {{ employees.length }} موظف</span></div>
				<div class="payroll-summary" *ngIf="!employeePageEmployee">
					<div class="summary-card"><span>إجمالي الرواتب الأساسية</span><strong>{{ formatMoney(monthlySalaryTotal) }}</strong></div>
					<div class="summary-card"><span>إجمالي البونص</span><strong>{{ formatMoney(monthlyBonusTotal) }}</strong></div>
					<div class="summary-card"><span>إجمالي الخصومات</span><strong>{{ formatMoney(monthlyDiscountTotal) }}</strong></div>
					<div class="summary-card summary-card--net"><span>إجمالي المستحق للشهر</span><strong>{{ formatMoney(monthlyNetTotal) }}</strong></div>
				</div>
				<div class="employee-table-head" *ngIf="!employeePageEmployee && filteredEmployees.length"><span>الموظف</span><span>النوع</span><span>المهام</span><span>نوع الإدارة</span><span>المدير المباشر</span><span>رقم الواتساب</span><span>الإجراءات</span></div>
				<div class="list" *ngIf="!employeePageEmployee && filteredEmployees.length; else emptyState">
					<article class="employee-card" *ngFor="let employee of filteredEmployees; let i = index">
						<div class="identity">
							<button type="button" class="employee-name" (click)="openEmployeePage(employee)">{{ employee.name }}</button>
							<span class="employee-month-total" *ngIf="false">صافي الشهر: {{ formatMoney(employeeMonthlyTotal(employee)) }}</span>
						</div>
						<div><span class="employee-column-label">النوع</span><span class="tag tag--type">{{ employeeTypeLabel(employee) }}</span></div>
						<div class="employee-tasks"><span class="employee-column-label">المهام</span><span class="tag" *ngFor="let title of employee.titles">{{ title }}</span><span class="contact-value contact-value--empty" *ngIf="!employee.titles.length">غير محددة</span></div>
						<div><span class="employee-column-label">نوع الإدارة</span><span class="contact-value">{{ employee.department || 'غير محدد' }}</span></div>
						<div><span class="employee-column-label">المدير المباشر</span><span class="contact-value">{{ managerName(employee) || 'بدون مدير' }}</span></div>
						<div class="employee-contact"><span class="contact-label">رقم الواتساب</span><span class="contact-value" [class.contact-value--empty]="!employee.whatsapp">{{ employee.whatsapp || 'غير مسجل' }}</span></div>
						<div class="actions"><button type="button" class="action-menu-trigger" aria-label="إجراءات الموظف" (click)="toggleActionMenu(employee.id)">⋮</button><div class="action-menu" *ngIf="actionMenuEmployeeId === employee.id"><button type="button" class="edit" (click)="openEmployeePage(employee)">فتح الملف</button><button type="button" class="edit" (click)="editEmployee(employee)">تعديل</button><button *ngIf="!isEmployeeAccount" type="button" class="delete" (click)="removeEmployee(i)">حذف</button></div></div>
					</article>
				</div>
				<div class="employee-modal-backdrop" *ngIf="selectedEmployee as employee" [class.employee-detail-page-backdrop]="employeePageEmployee" (click)="employeePageEmployee ? null : closeDetails()">
					<section class="employee-modal" [class.employee-detail-page]="employeePageEmployee" role="region" [attr.aria-label]="'ملف الموظف ' + employee.name" (click)="$event.stopPropagation()">
						<header class="modal-header"><div><h3>ملف {{ employee.name }}</h3><p class="modal-subtitle">بيانات الموظف ومتابعة الراتب والملاحظات</p></div><button type="button" class="modal-close" aria-label="العودة للموظفين" (click)="closeEmployeePage()">×</button></header>
						<section class="profile-section"><h4>البيانات الأساسية</h4><div class="profile-fields">
							<div class="view-field" *ngIf="!isEditingEmployee"><span>اسم الموظف</span><strong>{{ editDraft.name || 'غير محدد' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>اسم الموظف</span><input [(ngModel)]="editDraft.name" placeholder="اكتب الاسم"></label>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>رقم الواتساب</span><strong>{{ editDraft.whatsapp || 'غير مسجل' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>رقم الواتساب</span><input type="tel" inputmode="tel" [(ngModel)]="editDraft.whatsapp" placeholder="رقم الواتساب"></label>
							<div class="view-field view-field--wide" *ngIf="!isEditingEmployee"><span>وصف الوظيفة</span><strong>{{ editDraft.description || 'غير محدد' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>وصف الوظيفة</span><textarea [(ngModel)]="editDraft.description" placeholder="وصف مختصر لمهام الوظيفة"></textarea></label>
							<div class="view-field" *ngIf="!isEditingEmployee && canViewSalary"><span>الراتب الأساسي</span><strong>{{ editDraft.baseSalary === null ? 'غير محدد' : formatMoney(editDraft.baseSalary) }}</strong></div><label class="field" *ngIf="isEditingEmployee && canViewSalary"><span>الراتب الأساسي</span><input type="number" min="0" step="0.01" [(ngModel)]="editDraft.baseSalary" placeholder="الراتب الشهري"></label>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>نوع الموظف</span><strong>{{ employeeTypeLabel(employee) }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>نوع الموظف</span><select [(ngModel)]="editDraft.employeeType" (ngModelChange)="onEditTypeChange($event)"><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>نوع الإدارة</span><strong>{{ editDraft.department || 'غير محدد' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>نوع الإدارة</span><select [(ngModel)]="editDraft.department"><option value="">اختر نوع الإدارة</option><option *ngFor="let department of employeeDepartmentOptions" [value]="department">{{ department }}</option></select></label>
							<div class="view-field" *ngIf="!isEditingEmployee && editDraft.employeeType !== 'general_manager'"><span>{{ editDraft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }}</span><strong>{{ managerName(employee) || 'بدون مدير' }}</strong></div><label class="field" *ngIf="isEditingEmployee && editDraft.employeeType !== 'general_manager'"><span>{{ editDraft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }}</span><select [(ngModel)]="editDraft.managerId"><option [ngValue]="null">اختر المسؤول</option><option *ngFor="let manager of employeeManagersFor(editDraft.employeeType, employee.id)" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
							<label class="field" *ngIf="isEditingEmployee"><span>إضافة مسمى وظيفي</span><input [(ngModel)]="editDraft.titleInput" (keyup.enter)="addEditTitle()" placeholder="اكتب المسمى واضغط إضافة"></label>
							<button *ngIf="isEditingEmployee" type="button" class="edit" (click)="addEditTitle()">+ إضافة مسمى</button>
						</div>
						<div class="draft-titles" *ngIf="editDraft.titles.length"><span class="title-chip" *ngFor="let title of editDraft.titles; let titleIndex = index">{{ title }}<button *ngIf="isEditingEmployee" type="button" class="chip-remove" aria-label="حذف المسمى" (click)="removeEditTitle(titleIndex)">×</button></span></div>
						<p class="error" *ngIf="editError">{{ editError }}</p><div class="modal-save-row profile-save-row"><button *ngIf="isEditingEmployee" type="button" class="save-edit" (click)="saveEdit(employee)">حفظ البيانات الأساسية</button><button *ngIf="!isEditingEmployee" type="button" class="edit" (click)="startEmployeeEditing()">تعديل</button></div></section>
						<div class="details-head"><h4>البيانات الشهرية</h4><label class="month-picker"><span>الشهر</span><input type="month" [(ngModel)]="selectedMonth" (ngModelChange)="onMonthChange()"></label></div>
						<div class="detail-grid">
							<section class="detail-section"><h5>الملاحظات</h5>
								<div class="fields"><label class="field"><span>ملاحظة جديدة لهذا الشهر</span><input [(ngModel)]="noteDraft" (keyup.enter)="addNote(employee)" placeholder="اكتب الملاحظة"></label><button type="button" class="edit" (click)="addNote(employee)">إضافة ملاحظة</button></div>
								<div class="note-list" *ngIf="getMonthRecord(employee).notes.length"><div class="note-item" *ngFor="let note of getMonthRecord(employee).notes; let noteIndex = index"><div class="note-text">{{ note.text }}<span class="note-date">{{ note.createdAt | date:'short' }}</span></div><button type="button" class="remove-small" aria-label="حذف الملاحظة" (click)="removeNote(employee, noteIndex)">×</button></div></div>
								<div class="empty" *ngIf="!getMonthRecord(employee).notes.length">لا توجد ملاحظات لهذا الشهر.</div>
							</section>
							<section class="detail-section"><h5>بونص وخصومات هذا الشهر</h5><div class="fields">
								<label class="field"><span>النوع</span><select [(ngModel)]="adjustmentDraft.kind"><option value="bonus">بونص يضاف للراتب</option><option value="discount">خصم من الراتب</option></select></label>
								<label class="field"><span>المبلغ</span><input type="number" min="0.01" step="0.01" [(ngModel)]="adjustmentDraft.amount" placeholder="المبلغ"></label>
								<label class="field"><span>السبب</span><input [(ngModel)]="adjustmentDraft.reason" placeholder="سبب البونص أو الخصم"></label>
								<button type="button" class="edit" (click)="addAdjustment(employee)">إضافة</button>
							</div>
							<div class="adjustment-list" *ngIf="getMonthRecord(employee).adjustments.length"><div class="adjustment-item" *ngFor="let item of getMonthRecord(employee).adjustments; let adjustmentIndex = index"><div class="adjustment-info"><span class="adjustment-kind" [class.adjustment-kind--bonus]="item.kind === 'bonus'" [class.adjustment-kind--discount]="item.kind === 'discount'">{{ item.kind === 'bonus' ? 'بونص' : 'خصم' }} — {{ item.reason }}</span><span class="note-date">{{ selectedMonth }}</span></div><span class="adjustment-amount">{{ item.kind === 'bonus' ? '+' : '−' }}{{ formatMoney(item.amount) }}</span><button type="button" class="remove-small" aria-label="حذف البند" (click)="removeAdjustment(employee, adjustmentIndex)">×</button></div></div>
							<div class="empty" *ngIf="!getMonthRecord(employee).adjustments.length">لا توجد إضافات أو خصومات لهذا الشهر.</div></section>
						</div>
						<div class="monthly-save-row" *ngIf="monthlyDirty || monthlySaveMessage || monthlySaveError"><button type="button" class="save-edit" [disabled]="isSavingMonthly" (click)="saveMonthlyChanges()">{{ isSavingMonthly ? 'جاري الحفظ...' : 'حفظ التعديلات الشهرية' }}</button><span class="monthly-save-message" *ngIf="monthlySaveMessage">{{ monthlySaveMessage }}</span><span class="monthly-save-error" *ngIf="monthlySaveError">{{ monthlySaveError }}</span></div>
						<div class="details-total"><span>صافي مستحقات {{ employee.name }} في {{ selectedMonth }}</span><strong>{{ formatMoney(employeeMonthlyTotal(employee)) }}</strong></div>
					</section>
				</div>
				<ng-template #emptyState><div class="empty" *ngIf="!employeePageEmployee">{{ employees.length ? 'لا توجد نتائج مطابقة للفلاتر.' : 'لم تتم إضافة موظفين بعد.' }}</div></ng-template>
			</section>
		</div>
	`
})
export class EmployeesFormComponent implements OnChanges {
	@Input() content: any;
	private readonly contentService = inject(MonthlyContentService);
	private readonly adminApi = inject(AdminApiService);
	private readonly auth = inject(AdminAuthService);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	employees: Employee[] = [];
	showAddEmployee = false;
	isSavingEmployee = false;
	employeePageId: number | null = null;
	readonly employeeDepartmentOptions = ['صناعة محتوى', 'محتوى ومنصة', 'ميديا باير', 'محتوى تعليمي', 'كول سنتر', 'دعم فني', 'انتشار ميديا', 'متابعة طلاب'];
	draft: EmployeeDraft = this.emptyDraft();
	editDraft: EmployeeDraft = this.emptyDraft();
	editingId: number | null = null;
	isEditingEmployee = false;
	selectedEmployeeId: number | null = null;
	employeeSearch = '';
	employeeTitleFilter = '';
	employeeDepartmentFilter = '';
	employeeTypeFilter: EmployeeType | '' = '';
	employeeManagerFilter: number | null = null;
	actionMenuEmployeeId: number | null = null;
	selectedMonth = this.currentMonth();
	noteDraft = '';
	adjustmentDraft: { kind: 'bonus' | 'discount'; amount: number | null; reason: string } = this.emptyAdjustmentDraft();
	monthlyDirty = false;
	isSavingMonthly = false;
	monthlySaveMessage = '';
	monthlySaveError = '';
	errorMessage = '';
	editError = '';

	ngOnChanges(): void {
		if (!this.content || typeof this.content !== 'object') return;
		if (!Array.isArray(this.content.items)) this.content.items = [];
		this.employees = this.content.items;
		for (const employee of this.employees) {
			if (!Array.isArray(employee.titles)) employee.titles = employee.job?.trim() ? [employee.job.trim()] : [];
			if (!['employee', 'manager', 'general_manager'].includes(employee.employeeType || '')) employee.employeeType = 'employee';
			if (employee.employeeType === 'general_manager') employee.managerId = null;
			if (!Array.isArray(employee.monthlyRecords)) employee.monthlyRecords = [];
		}
		this.draft = this.emptyDraft();
		if (this.isEmployeeAccount && this.employees.length && this.employeePageId === null) {
			this.employeePageId = this.employees[0].id;
			this.selectEmployeeForPage(this.employees[0]);
		}
	}

	ngOnInit(): void {
		this.route.fragment.subscribe(fragment => {
			const match = String(fragment || '').match(/^employee-(\d+)$/);
			const requestedId = match ? Number(match[1]) : null;
			this.employeePageId = requestedId || (this.isEmployeeAccount ? this.employees[0]?.id ?? null : null);
			const employee = this.employeePageEmployee;
			if (employee) this.selectEmployeeForPage(employee);
		});
	}

	get monthlySalaryTotal(): number { return this.employees.reduce((total, employee) => total + this.employeeBaseSalary(employee), 0); }
	get monthlyBonusTotal(): number { return this.employees.reduce((total, employee) => total + this.adjustmentTotal(employee, 'bonus'), 0); }
	get monthlyDiscountTotal(): number { return this.employees.reduce((total, employee) => total + this.adjustmentTotal(employee, 'discount'), 0); }
	get monthlyNetTotal(): number { return this.monthlySalaryTotal + this.monthlyBonusTotal - this.monthlyDiscountTotal; }
	get selectedEmployee(): Employee | null { return this.employees.find(employee => employee.id === this.selectedEmployeeId) || null; }
	get isEmployeeAccount(): boolean { return this.auth.getRole() === 'employee'; }
	get canViewSalary(): boolean { return this.auth.getRole() === 'admin' || this.isEmployeeAccount; }
	get employeePageEmployee(): Employee | null { return this.employees.find(employee => employee.id === this.employeePageId) || null; }
	get employeeDepartments(): string[] { return [...new Set(this.employees.map(employee => employee.department).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'ar')); }
	get employeeManagers(): Employee[] { return this.employees.filter(employee => employee.name.trim() && (employee.employeeType === 'manager' || employee.employeeType === 'general_manager')).sort((a, b) => a.name.localeCompare(b.name, 'ar')); }
	get employeeTitles(): string[] { return [...new Set(this.employees.flatMap(employee => employee.titles || []))].sort((a, b) => a.localeCompare(b, 'ar')); }
	employeeManagersFor(employeeType: EmployeeType, employeeId: number | null): Employee[] {
		if (employeeType === 'general_manager') return [];
		const allowedTypes: EmployeeType[] = employeeType === 'manager' ? ['general_manager'] : ['manager', 'general_manager'];
		return this.employees.filter(employee => employee.name.trim() && allowedTypes.includes(employee.employeeType || 'employee') && employee.id !== employeeId).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
	}
	managerName(employee: Employee): string { return this.employees.find(manager => manager.id === employee.managerId)?.name || ''; }
	employeeTypeLabel(employee: Employee): string { return employee.employeeType === 'general_manager' ? 'مدير عام' : employee.employeeType === 'manager' ? 'مدير مباشر' : 'موظف'; }
	get filteredEmployees(): Employee[] {
		const query = this.employeeSearch.trim().toLocaleLowerCase();
		return this.employees.filter(employee => {
			const matchesQuery = !query || [employee.name, employee.whatsapp || '', employee.department || '', this.managerName(employee), this.employeeTypeLabel(employee), ...(employee.titles || [])].join(' ').toLocaleLowerCase().includes(query);
			const matchesTitle = !this.employeeTitleFilter || (employee.titles || []).includes(this.employeeTitleFilter);
			const matchesDepartment = !this.employeeDepartmentFilter || employee.department === this.employeeDepartmentFilter;
			const matchesType = !this.employeeTypeFilter || (employee.employeeType || 'employee') === this.employeeTypeFilter;
			const matchesManager = this.employeeManagerFilter === null || employee.managerId === this.employeeManagerFilter;
			return matchesQuery && matchesTitle && matchesDepartment && matchesType && matchesManager;
		});
	}
	clearEmployeeFilters(): void { this.employeeSearch = ''; this.employeeTitleFilter = ''; this.employeeDepartmentFilter = ''; this.employeeTypeFilter = ''; this.employeeManagerFilter = null; }
	toggleActionMenu(employeeId: number): void { this.actionMenuEmployeeId = this.actionMenuEmployeeId === employeeId ? null : employeeId; }
	openEmployeePage(employee: Employee): void {
		this.actionMenuEmployeeId = null;
		this.isEditingEmployee = false;
		this.employeePageId = employee.id;
		this.selectEmployeeForPage(employee);
		void this.router.navigate([], { relativeTo: this.route, fragment: `employee-${employee.id}` });
	}
	editEmployee(employee: Employee): void { this.openEmployeePage(employee); this.isEditingEmployee = true; }
	startEmployeeEditing(): void { this.isEditingEmployee = true; this.editError = ''; }
	closeEmployeePage(): void {
		this.employeePageId = null;
		this.closeDetails();
		void this.router.navigate([], { relativeTo: this.route, fragment: undefined });
	}
	private selectEmployeeForPage(employee: Employee): void {
		this.selectedEmployeeId = employee.id;
		this.editingId = employee.id;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, department: employee.department || '', employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
	}

	openAddEmployee(): void { this.errorMessage = ''; this.draft = this.emptyDraft(); this.showAddEmployee = true; }
	closeAddEmployee(): void { this.errorMessage = ''; this.showAddEmployee = false; }

	addDraftTitle(): void { this.pushTitle(this.draft); }
	removeDraftTitle(index: number): void { this.draft.titles.splice(index, 1); }
	onDraftTypeChange(type: EmployeeType): void { if (type === 'general_manager' || (type === 'manager' && !this.employeeManagersFor(type, null).some(manager => manager.id === this.draft.managerId))) this.draft.managerId = null; }
	onEditTypeChange(type: EmployeeType): void { if (type === 'general_manager' || (type === 'manager' && !this.employeeManagersFor(type, this.selectedEmployeeId).some(manager => manager.id === this.editDraft.managerId))) this.editDraft.managerId = null; }

	addEmployee(): void {
		this.pushTitle(this.draft);
		const name = this.draft.name.trim();
		if (!name || !this.draft.titles.length) { this.errorMessage = 'اكتب اسم الموظف وأضف مسمى وظيفيًا واحدًا على الأقل.'; return; }
		if (!this.draft.department) { this.errorMessage = 'اختر نوع الإدارة.'; return; }
		const email = this.draft.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.errorMessage = 'اكتب بريدًا إلكترونيًا صحيحًا.'; return; }
		if (this.draft.password.length < 10) { this.errorMessage = 'كلمة السر يجب ألا تقل عن 10 أحرف.'; return; }
		const id = this.employees.reduce((max, employee) => Math.max(max, Number(employee.id) || 0), 0) + 1;
		this.employees.push({ id, name, titles: [...this.draft.titles], whatsapp: this.draft.whatsapp.trim(), email, description: this.draft.description.trim(), baseSalary: this.normalizeSalary(this.draft.baseSalary), department: this.draft.department, employeeType: this.draft.employeeType, managerId: this.draft.managerId, monthlyRecords: [] });
		this.content.items = this.employees;
		this.isSavingEmployee = true;
		this.contentService.savePageState('employees', this.content).pipe(
			switchMap(saved => { this.content = saved; this.employees = saved.items || this.employees; return this.adminApi.createEmployeeAccount(id, email, this.draft.password); }),
			finalize(() => { this.isSavingEmployee = false; })
		).subscribe({
			next: () => { this.draft = this.emptyDraft(); this.errorMessage = ''; this.showAddEmployee = false; },
			error: err => { this.errorMessage = err?.error?.message || 'تعذر إنشاء الموظف أو حساب الدخول.'; }
		});
	}

	startEditing(employee: Employee): void {
		if (this.editingId === employee.id) { this.cancelEdit(); return; }
		this.editingId = employee.id;
		this.isEditingEmployee = true;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, department: employee.department || '', employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
		this.editError = '';
	}

	addEditTitle(): void { this.pushTitle(this.editDraft); this.editError = ''; }
	removeEditTitle(index: number): void { this.editDraft.titles.splice(index, 1); }

	saveEdit(employee: Employee): void {
		this.pushTitle(this.editDraft);
		const name = this.editDraft.name.trim();
		if (!name || !this.editDraft.titles.length) { this.editError = 'الاسم ومسمى وظيفي واحد على الأقل مطلوبان.'; return; }
		employee.name = name;
		employee.titles = [...this.editDraft.titles];
		employee.whatsapp = this.editDraft.whatsapp.trim();
		employee.description = this.editDraft.description.trim();
		employee.baseSalary = this.normalizeSalary(this.editDraft.baseSalary);
		employee.department = this.editDraft.department;
		employee.employeeType = this.editDraft.employeeType;
		employee.managerId = this.editDraft.employeeType === 'general_manager' ? null : this.editDraft.managerId;
		delete employee.job;
		this.content.items = this.employees;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, department: employee.department || '', employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
		this.isEditingEmployee = false;
		this.editError = '';
	}

	cancelEdit(): void {
		const employee = this.selectedEmployee;
		this.editDraft = employee ? { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, department: employee.department || '', employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null } : this.emptyDraft();
		this.editingId = employee?.id ?? null;
		this.editError = '';
	}

	removeEmployee(index: number): void {
		this.actionMenuEmployeeId = null;
		if (this.editingId === this.employees[index]?.id) this.cancelEdit();
		if (this.selectedEmployeeId === this.employees[index]?.id) this.selectedEmployeeId = null;
		this.employees.splice(index, 1);
	}

	toggleDetails(employee: Employee): void {
		if (this.selectedEmployeeId === employee.id) { this.closeDetails(); return; }
		this.selectedEmployeeId = employee.id;
		this.editingId = employee.id;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, department: employee.department || '', employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
		this.noteDraft = '';
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.editError = '';
	}

	closeDetails(): void {
		this.selectedEmployeeId = null;
		this.editingId = null;
		this.isEditingEmployee = false;
		this.editDraft = this.emptyDraft();
		this.noteDraft = '';
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.editError = '';
	}

	onMonthChange(): void {
		this.noteDraft = '';
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.monthlyDirty = false;
		this.monthlySaveMessage = '';
		this.monthlySaveError = '';
	}

	getMonthRecord(employee: Employee): EmployeeMonth {
		if (!Array.isArray(employee.monthlyRecords)) employee.monthlyRecords = [];
		let record = employee.monthlyRecords.find(item => item.month === this.selectedMonth);
		if (!record) {
			record = { month: this.selectedMonth, salary: null, notes: [], adjustments: [] };
			employee.monthlyRecords.push(record);
		}
		if (!Array.isArray(record.notes)) record.notes = [];
		if (!Array.isArray(record.adjustments)) record.adjustments = [];
		return record;
	}

	setSalary(employee: Employee, value: string | number | null): void {
		const record = this.getMonthRecord(employee);
		const salary = value === '' || value === null ? null : Number(value);
		record.salary = salary !== null && Number.isFinite(salary) && salary >= 0 ? salary : null;
		this.markMonthlyDirty();
	}

	addNote(employee: Employee): void {
		const text = this.noteDraft.trim();
		if (!text) return;
		const notes = this.getMonthRecord(employee).notes;
		notes.push({ id: this.nextId(notes), text, createdAt: new Date().toISOString() });
		this.noteDraft = '';
		this.markMonthlyDirty();
	}

	removeNote(employee: Employee, index: number): void { this.getMonthRecord(employee).notes.splice(index, 1); this.markMonthlyDirty(); }

	addAdjustment(employee: Employee): void {
		const amount = Number(this.adjustmentDraft.amount);
		const reason = this.adjustmentDraft.reason.trim();
		if (!Number.isFinite(amount) || amount <= 0 || !reason) return;
		const adjustments = this.getMonthRecord(employee).adjustments;
		adjustments.push({ id: this.nextId(adjustments), kind: this.adjustmentDraft.kind, amount, reason });
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.markMonthlyDirty();
	}

	removeAdjustment(employee: Employee, index: number): void { this.getMonthRecord(employee).adjustments.splice(index, 1); this.markMonthlyDirty(); }

	saveMonthlyChanges(): void {
		if (this.isSavingMonthly || !this.content) return;
		this.isSavingMonthly = true;
		this.monthlySaveMessage = '';
		this.monthlySaveError = '';
		this.content.items = this.employees;
		this.contentService.savePageState('employees', this.content).pipe(finalize(() => { this.isSavingMonthly = false; })).subscribe({
			next: saved => { this.content = saved; this.employees = saved.items || this.employees; this.monthlyDirty = false; this.monthlySaveMessage = 'تم حفظ التعديلات الشهرية.'; },
			error: err => { this.monthlySaveError = err?.error?.message || 'تعذر حفظ التعديلات الشهرية.'; }
		});
	}

	employeeMonthlyTotal(employee: Employee): number {
		return this.employeeBaseSalary(employee) + this.adjustmentTotal(employee, 'bonus') - this.adjustmentTotal(employee, 'discount');
	}
	employeeBaseSalary(employee: Employee): number {
		const configured = Number(employee.baseSalary);
		if (Number.isFinite(configured) && configured >= 0) return configured;
		return Number(this.getMonthRecord(employee).salary) || 0;
	}

	formatMoney(value: number): string { return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value); }

	private adjustmentTotal(employee: Employee, kind: PayrollAdjustment['kind']): number {
		return this.getMonthRecord(employee).adjustments.filter(item => item.kind === kind).reduce((total, item) => total + (Number(item.amount) || 0), 0);
	}

	private nextId(items: Array<{ id: number }>): number { return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1; }
	private normalizeSalary(value: string | number | null): number | null { const salary = value === '' || value === null ? null : Number(value); return salary !== null && Number.isFinite(salary) && salary >= 0 ? salary : null; }
	private markMonthlyDirty(): void { this.monthlyDirty = true; this.monthlySaveMessage = ''; this.monthlySaveError = ''; }
	private pushTitle(target: EmployeeDraft): void {
		const title = target.titleInput.trim();
		if (!title) return;
		if (!target.titles.some(existing => existing.toLocaleLowerCase() === title.toLocaleLowerCase())) target.titles.push(title);
		target.titleInput = '';
	}
	private currentMonth(): string { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
	private emptyDraft(): EmployeeDraft { return { name: '', titleInput: '', titles: [], whatsapp: '', email: '', password: '', description: '', baseSalary: null, department: '', employeeType: 'employee', managerId: null }; }
	private emptyAdjustmentDraft(): { kind: 'bonus' | 'discount'; amount: number | null; reason: string } { return { kind: 'bonus', amount: null, reason: '' }; }
}
