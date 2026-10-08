import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

interface EmployeeNote { id: number; text: string; createdAt: string; }
interface PayrollAdjustment { id: number; kind: 'bonus' | 'discount'; amount: number; reason: string; }
interface EmployeeMonth { month: string; salary: number | null; notes: EmployeeNote[]; adjustments: PayrollAdjustment[]; }
type EmployeeType = 'employee' | 'manager' | 'general_manager';
interface Employee { id: number; name: string; titles: string[]; whatsapp?: string; email?: string; description?: string; baseSalary?: number | null; department?: string | string[]; employeeType?: EmployeeType; managerId?: number | null; monthlyRecords?: EmployeeMonth[]; job?: string; }
interface EmployeeDraft { name: string; titleInput: string; titles: string[]; whatsapp: string; email: string; password: string; description: string; baseSalary: number | null; departments: string[]; employeeType: EmployeeType; managerId: number | null; }

@Component({
	selector: 'app-employees-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [`
		/* Employee profile redesign */
		.employee-detail-page{width:min(980px,calc(100vw - 48px))!important;max-height:calc(100vh - 110px)!important;padding:0!important;gap:0!important;overflow:hidden!important;border:1px solid #dfe6f2!important;border-radius:24px!important;background:#f7f9fc!important;box-shadow:0 28px 80px #17254135!important}
		.employee-detail-page .modal-header{position:static!important;margin:0!important;padding:22px 28px!important;border-bottom:1px solid #e7ebf3!important;background:#fff!important}
		.employee-detail-page .modal-header h3{margin:0 0 5px!important;color:#1e2b48!important;font-size:21px!important}
		.employee-detail-page .modal-subtitle{color:#8190a9!important}
		.employee-detail-page .profile-section{display:grid!important;gap:18px!important;margin:0!important;padding:24px 28px 82px!important;border:0!important;border-radius:0!important;background:#f7f9fc!important;box-shadow:none!important;overflow:auto!important}
		.employee-detail-page .profile-section h4{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important;color:#253452!important;font-size:16px!important}
		.employee-detail-page .profile-section h4::before{content:''!important;width:5px!important;height:22px!important;border-radius:6px!important;background:linear-gradient(180deg,#7354f4,#a38cff)!important}
		.employee-detail-page .profile-fields{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;gap:14px!important;padding:18px!important;border:1px solid #e2e8f2!important;border-radius:18px!important;background:#fff!important;box-shadow:0 8px 22px #24365d09!important}
		.employee-detail-page .profile-fields>.field,.employee-detail-page .profile-fields>.view-field{min-width:0!important;align-self:stretch!important;box-sizing:border-box!important}
		.employee-detail-page .profile-fields>.view-field{min-height:70px!important;padding:13px 15px!important;border:1px solid #e7ecf4!important;border-radius:12px!important;background:#fbfcff!important}
		.employee-detail-page .profile-fields>.view-field span,.employee-detail-page .profile-fields>.field>span{color:#7f8da5!important;font-size:11px!important;font-weight:900!important}
		.employee-detail-page .profile-fields>.view-field strong{color:#263653!important;font-size:13px!important;overflow-wrap:anywhere!important}
		.employee-detail-page .profile-fields>.view-field--salary{border-color:#d9d0ff!important;background:linear-gradient(135deg,#faf9ff,#f1eeff)!important}
		.employee-detail-page .profile-fields>.view-field--salary strong{color:#5b43c9!important;font-size:18px!important}
		.employee-detail-page .profile-fields>.field input,.employee-detail-page .profile-fields>.field select,.employee-detail-page .profile-fields>.field textarea{min-height:46px!important;border:1px solid #dfe6f0!important;border-radius:11px!important;background:#fff!important}
		.employee-detail-page .profile-fields>.field textarea{min-height:96px!important;padding:11px 12px!important}
		.employee-detail-page .profile-fields>.department-checkboxes{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:8px!important;border-color:#dfe6f0!important;background:#fbfcff!important}
		.employee-detail-page .profile-fields>.field--description,.employee-detail-page .profile-fields>.department-field{grid-column:1/-1!important}
		.employee-detail-page .profile-fields>.field--description textarea{min-height:84px!important;max-height:112px!important;resize:vertical!important}
		.employee-detail-page .profile-fields>.department-field .department-checkboxes{grid-template-columns:repeat(3,minmax(0,1fr))!important}
		.employee-detail-page .profile-fields>.add-title-button{grid-column:1/-1!important;justify-self:start!important;min-height:42px!important;min-width:150px!important}
		.employee-detail-page .profile-fields>.view-field--wide{grid-column:auto!important;min-height:76px!important;align-content:center!important}
		.employee-detail-page .profile-fields>.draft-titles,.employee-detail-page .profile-fields>.employee-account-actions,.employee-detail-page .profile-fields>.employee-type-field{grid-column:1/-1!important}
		.employee-detail-page .profile-fields>.employee-type-field{width:100%!important;max-width:none!important;justify-self:stretch!important}
		.employee-detail-page .profile-save-row{position:absolute!important;left:28px!important;right:28px!important;bottom:22px!important;z-index:2!important;margin:0!important;padding-top:14px!important;border-top:1px solid #e4e9f2!important;background:#f7f9fc!important}
		.employee-detail-page--editing{width:min(1080px,calc(100vw - 40px))!important;max-height:calc(100vh - 70px)!important}
		.employee-detail-page--editing .modal-header{padding:24px 30px 20px!important;background:linear-gradient(135deg,#f8f7ff 0%,#fff 68%)!important}
		.employee-detail-page--editing .profile-section{padding:26px 30px 96px!important;background:#f7f9fc!important}
		.employee-detail-page--editing .profile-fields{gap:16px!important;padding:20px!important;border-color:#dfe5f0!important}
		.employee-detail-page--editing .profile-save-row{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;left:30px!important;right:30px!important;bottom:20px!important;padding-top:16px!important;background:#f7f9fc!important}
		.employee-detail-page--editing .profile-save-row .save-edit{min-width:190px!important}
		.employee-detail-page--editing .profile-save-row .cancel-edit{min-width:110px!important;min-height:42px!important}
		@media(max-width:800px){.employee-detail-page,.employee-detail-page--editing{width:calc(100vw - 24px)!important;max-height:calc(100vh - 55px)!important;border-radius:18px!important}.employee-detail-page .modal-header{padding:18px!important}.employee-detail-page .profile-section,.employee-detail-page--editing .profile-section{padding:18px 18px 92px!important}.employee-detail-page .profile-fields{grid-template-columns:1fr!important;padding:14px!important}.employee-detail-page .profile-fields>.draft-titles,.employee-detail-page .profile-fields>.employee-account-actions,.employee-detail-page .profile-fields>.employee-type-field{grid-column:1!important}.employee-detail-page .profile-fields>.department-field .department-checkboxes{grid-template-columns:repeat(2,minmax(0,1fr))!important}.employee-detail-page .profile-save-row,.employee-detail-page--editing .profile-save-row{left:18px!important;right:18px!important;bottom:16px!important}.employee-detail-page--editing .profile-save-row .save-edit{min-width:0!important;flex:1!important}}
		@media(max-width:480px){.employee-detail-page .profile-fields>.department-field .department-checkboxes{grid-template-columns:1fr!important}.employee-detail-page .profile-fields>.add-title-button{width:100%!important}}
		:host{display:block;color:#202b42}.wrap{display:grid;gap:20px}.intro{margin:0;color:#758098;line-height:1.8}.form-card,.employee-card,.payroll-summary{padding:18px;border:1px solid #e5e9f2;border-radius:16px;background:#fff}.form-card h3{margin:0 0 14px;font-size:16px}.fields{display:grid;grid-template-columns:1fr 1fr 1fr auto;align-items:end;gap:12px}.field{display:grid;gap:7px;color:#65718b;font-size:12px;font-weight:800}.field input,.field select{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #dfe4ed;border-radius:10px;padding:0 12px;font:inherit;color:#202b42;background:#fff}.add,.save-edit{min-height:42px;border:0;border-radius:10px;padding:0 18px;background:#6d4aff;color:#fff;font:inherit;font-weight:900;cursor:pointer}.employee-toolbar{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}.employee-toolbar>.add{flex:0 0 auto}.employee-filters{display:flex;align-items:flex-end;gap:9px;flex:1;flex-wrap:wrap}.employee-filters .field{min-width:190px;flex:1}.clear-filters{min-height:42px;border:1px solid #ddd7ff;border-radius:10px;padding:0 13px;color:#5b43c9;background:#f7f5ff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.draft-titles,.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.title-chip,.tag{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#f0edff;color:#5b43c9;font-size:11px;font-weight:900}.chip-remove{border:0;padding:0;color:#7465b8;background:transparent;font-size:14px;line-height:1;cursor:pointer}.error{margin:10px 0 0;color:#b63e58;font-size:12px;font-weight:800}.head{display:flex;align-items:center;justify-content:space-between;gap:12px}.head h3{margin:0;font-size:16px}.count{color:#8172c8;font-size:12px;font-weight:900}.month-picker{display:flex;align-items:center;gap:9px;color:#65718b;font-size:12px;font-weight:900}.month-picker input{min-height:38px;border:1px solid #dfe4ed;border-radius:9px;padding:0 9px;font:inherit;color:#202b42;background:#fff}.payroll-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px;background:#f8f9fd}.summary-card{display:grid;gap:6px;padding:12px;border:1px solid #e8ebf2;border-radius:12px;background:#fff}.summary-card span{color:#7b869b;font-size:11px;font-weight:800}.summary-card strong{color:#293650;font-size:15px}.summary-card--net{border-color:#d9d1ff;background:#f7f5ff}.summary-card--net strong{color:#5b43c9}.list{display:grid;gap:10px}.employee-table-head,.employee-card{display:grid;grid-template-columns:minmax(150px,1.25fr) minmax(80px,.65fr) minmax(160px,1.35fr) minmax(120px,1fr) minmax(120px,1fr) minmax(130px,auto) auto;align-items:center;gap:14px}.employee-table-head{padding:0 15px;color:#8993a8;font-size:11px;font-weight:900}.employee-card{padding:13px 15px;border:1px solid #e5e9f2;border-radius:16px;background:#fff}.identity{display:grid;gap:8px}.employee-name{justify-self:start;border:0;padding:0;color:#202b42;background:none;text-align:right;font:inherit;font-weight:900;cursor:pointer}.employee-name:hover{color:#5b43c9}.employee-tasks{display:flex;flex-wrap:wrap;gap:6px}.employee-column-label{display:none;color:#8993a8;font-size:10px;font-weight:800}.employee-contact{display:grid;gap:5px;min-width:130px}.contact-label{color:#8993a8;font-size:10px;font-weight:800}.contact-value{color:#34415b;font-size:12px;font-weight:800;direction:ltr;text-align:right}.contact-value--empty{color:#a1a9b8;font-weight:600}.actions{display:flex;align-items:center;gap:7px}.edit,.delete,.cancel-edit{border:0;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.edit{background:#f0edff;color:#5b43c9}.delete{background:#fff0f3;color:#ae3f59}.cancel-edit{background:#f1f3f7;color:#59657a}.employee-month-total{color:#4f3bc0;font-size:12px;font-weight:900}.edit-panel{grid-column:1/-1;display:grid;gap:12px;padding-top:13px;border-top:1px solid #edf0f5}.details{grid-column:1/-1;display:grid;gap:14px;padding-top:15px;border-top:1px solid #edf0f5}.details-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.details-head h4{margin:0;font-size:15px}.details-month{color:#6d4aff;font-size:12px;font-weight:900}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-section{display:grid;align-content:start;gap:10px;padding:14px;border:1px solid #edf0f5;border-radius:13px;background:#fbfcff}.detail-section h5{margin:0;font-size:13px}.detail-section .fields{grid-template-columns:minmax(0,1fr) auto}.note-list,.adjustment-list{display:grid;gap:7px}.note-item,.adjustment-item{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:9px;background:#fff;border:1px solid #edf0f5}.note-text{line-height:1.6;font-size:12px}.note-date{display:block;margin-top:3px;color:#929bad;font-size:10px}.adjustment-info{display:grid;gap:3px;font-size:12px}.adjustment-kind{font-weight:900}.adjustment-kind--bonus{color:#13825f}.adjustment-kind--discount{color:#b64d62}.adjustment-amount{white-space:nowrap;font-size:12px;font-weight:900}.remove-small{flex:0 0 auto;border:0;background:none;color:#b64d62;font-size:16px;cursor:pointer}.empty{padding:20px;text-align:center;border:1px dashed #dfe4ed;border-radius:11px;color:#8993a8;font-size:12px}.details-total{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:11px;background:#f0edff;color:#5b43c9;font-size:13px;font-weight:900}
		@media(max-width:850px){.fields{grid-template-columns:1fr 1fr}.payroll-summary{grid-template-columns:1fr 1fr}.employee-table-head{display:none}.employee-card{grid-template-columns:1fr auto}.employee-column-label{display:block}.employee-contact{grid-column:1;grid-row:2}.detail-grid{grid-template-columns:1fr}}
		@media(max-width:650px){.fields,.detail-section .fields{grid-template-columns:1fr}.add{width:100%}.employee-card{align-items:flex-start}.employee-contact{grid-column:1;grid-row:auto}.actions{flex-direction:column;align-items:stretch}.month-picker{align-items:flex-start;flex-direction:column}.payroll-summary{grid-template-columns:1fr 1fr}}
		.action-menu-trigger{width:38px;height:38px;border:1px solid #ddd7ff;border-radius:10px;background:#f7f5ff;color:#5b43c9;font-size:23px;font-weight:900;line-height:1;cursor:pointer}.action-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:20;display:grid;min-width:130px;gap:5px;padding:7px;border:1px solid #e5e9f2;border-radius:11px;background:#fff;box-shadow:0 12px 30px #202b4225}.action-menu button{width:100%;white-space:nowrap}.actions{position:relative;justify-content:center}.monthly-save-row{display:flex;align-items:center;justify-content:flex-start;gap:10px;margin-top:12px}.monthly-save-message{color:#13825f;font-size:12px;font-weight:900}.monthly-save-error{color:#b63e58;font-size:12px;font-weight:800}.field textarea{width:100%;min-height:90px;box-sizing:border-box;resize:vertical;border:1px solid #dfe4ed;border-radius:10px;padding:10px 12px;font:inherit;color:#202b42;background:#fff}.salary-readonly{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #e5e9f2;border-radius:10px;background:#fff}.salary-readonly span{color:#8993a8;font-size:11px;font-weight:800}.salary-readonly strong{color:#293650;font-size:15px}.view-field{display:grid;align-content:center;gap:7px;min-height:42px;padding:0 12px;color:#65718b;font-size:12px;font-weight:800}.view-field strong{color:#293650;font-size:13px;line-height:1.6;white-space:pre-wrap}.view-field--wide{min-height:90px;align-content:start;padding-top:10px}
		.employee-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(15,22,42,.62);backdrop-filter:blur(4px)}.employee-modal{display:grid;gap:18px;width:min(1100px,100%);max-height:min(92vh,940px);overflow:auto;box-sizing:border-box;padding:24px;border:1px solid #e3e7f0;border-radius:20px;background:#fff;box-shadow:0 24px 80px #11182b50}.employee-add-modal{width:min(760px,100%)}.modal-header{position:sticky;top:-24px;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin:-24px -24px 0;padding:20px 24px 15px;border-bottom:1px solid #edf0f5;background:#fff}.modal-header h3{margin:0 0 5px;font-size:20px}.modal-subtitle{margin:0;color:#7b869b;font-size:12px}.modal-close{width:38px;height:38px;border:0;border-radius:11px;background:#f1f3f7;color:#45516a;font-size:23px;cursor:pointer}.profile-section{display:grid;gap:13px;padding:16px;border:1px solid #edf0f5;border-radius:15px;background:#fbfcff}.profile-section h4{margin:0;font-size:14px}.profile-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.modal-save-row{display:flex;justify-content:flex-start;gap:8px}.modal-month-pill{padding:7px 10px;border-radius:9px;background:#f0edff;color:#5b43c9;font-size:12px;font-weight:900}
		.employee-detail-page-backdrop{position:static;display:block;padding:0;background:transparent;backdrop-filter:none}.employee-detail-page{width:100%;max-height:none;box-shadow:none;border-radius:16px}.employee-detail-page .modal-header{position:static;margin:-24px -24px 0}.financial-kpi-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px}.financial-kpi-head strong{color:#25324d;font-size:16px}.financial-kpi-head span{color:#8993a8;font-size:11px;font-weight:800}.payroll-summary{grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;padding:0;background:transparent;border:0}.summary-card{position:relative;min-height:96px;align-content:center;gap:9px;padding:18px 16px 18px 52px;border:1px solid #e5e9f2;border-top:3px solid #9b8af2;border-radius:18px;background:#fff;box-shadow:0 10px 24px #24365d0d;overflow:hidden;transition:transform .2s,box-shadow .2s}.summary-card:hover{transform:translateY(-3px);box-shadow:0 15px 28px #24365d18}.summary-card::after{content:'◈';position:absolute;left:16px;top:50%;display:grid;place-items:center;width:32px;height:32px;border-radius:11px;color:#6d4aff;background:#f0edff;font-size:14px;transform:translateY(-50%)}.summary-card span{color:#7d899f;font-size:11px;font-weight:800}.summary-card strong{color:#25324d;font-size:19px;letter-spacing:-.3px}.summary-card--base{border-top-color:#6d4aff}.summary-card--base::after{content:'₪';color:#fff;background:#6d4aff}.summary-card--bonus{border-top-color:#18a477}.summary-card--bonus::after{content:'+';color:#087957;background:#e3f8f0}.summary-card--discount{border-top-color:#e06b7e}.summary-card--discount::after{content:'−';color:#b33b57;background:#fff0f3}.summary-card--net{border-color:#d9d1ff;border-top-color:#5137bf;background:linear-gradient(145deg,#faf9ff,#f0edff)}.summary-card--net::after{content:'✓';color:#fff;background:#5137bf}.summary-card--net strong{color:#5137bf}
		@media(max-width:650px){.employee-modal-backdrop{padding:8px}.employee-modal{max-height:96vh;padding:15px;border-radius:15px}.modal-header{top:-15px;margin:-15px -15px 0;padding:15px}.profile-fields{grid-template-columns:1fr}.modal-header h3{font-size:17px}}
		.employee-detail-page .profile-fields{gap:14px}.employee-detail-page .view-field{min-height:64px;padding:11px 14px;border:1px solid #e8ebf2;border-radius:12px;background:#fff;box-sizing:border-box}.employee-detail-page .view-field--wide{grid-column:1/-1;min-height:86px}.employee-detail-page .view-field span{color:#8993a8;font-size:11px}.employee-detail-page .view-field strong{color:#293650;font-size:13px}.employee-detail-page .draft-titles{margin-top:2px}.employee-detail-page .title-chip{background:#f0edff}.employee-detail-page .profile-section h4{padding-bottom:2px}.employee-detail-page .profile-section{position:relative;padding-bottom:72px}.employee-detail-page .profile-save-row{position:absolute;left:16px;right:auto;bottom:16px;margin:0;justify-content:flex-start}.required-star{color:#c33d57;font-weight:900}
		.employee-detail-page{gap:22px;padding:28px;border-color:#dfe6f3;background:#f8faff;box-shadow:0 18px 55px #23345b12}.employee-detail-page .modal-header{margin:-28px -28px 0;padding:24px 28px 20px;border-bottom:1px solid #e7ebf4;border-radius:18px 18px 0 0;background:linear-gradient(135deg,#fff 0%,#f8f9ff 100%)}.employee-detail-page .modal-header h3{font-size:22px;letter-spacing:-.2px}.employee-detail-page .modal-subtitle{color:#7a86a0}.employee-detail-page .profile-section{gap:18px;padding:22px;border:1px solid #e4e9f3;border-radius:18px;background:#fff;box-shadow:0 8px 24px #253b6810}.employee-detail-page .profile-section h4{display:flex;align-items:center;gap:9px;color:#273552;font-size:15px}.employee-detail-page .profile-section h4::before{content:'';width:4px;height:20px;border-radius:4px;background:#6d4aff}.employee-detail-page .view-field{min-height:76px;padding:14px 16px;border-color:#e5eaf3;background:#fbfcff;transition:border-color .2s,box-shadow .2s}.employee-detail-page .view-field:hover{border-color:#cfc5ff;box-shadow:0 5px 16px #5b43c912}.employee-detail-page .view-field--wide{min-height:98px}.employee-detail-page .view-field--salary{border-color:#d7ccff;background:linear-gradient(135deg,#fbfaff,#f4f1ff)}.employee-detail-page .view-field--salary strong{color:#5b43c9;font-size:17px}.employee-detail-page .details-head{margin-top:2px;padding:0 4px}.employee-detail-page .details-head h4{color:#273552;font-size:16px}.employee-detail-page .detail-section{padding:18px;border-color:#e4e9f3;border-radius:16px;background:#fff;box-shadow:0 8px 24px #253b680d}.employee-detail-page .details-total{padding:15px 18px;border:1px solid #ddd5ff;border-radius:14px;background:linear-gradient(135deg,#f4f1ff,#ebe6ff);color:#5137bf}.employee-detail-page .profile-save-row .edit,.employee-detail-page .profile-save-row .save-edit{min-width:104px;box-shadow:0 7px 15px #6d4aff20}.employee-detail-page .profile-save-row .edit{background:#f0edff}.employee-detail-page .month-picker input{min-height:40px;background:#fff;border-color:#dfe5f1}
		@media(max-width:650px){.employee-detail-page{padding:15px;gap:16px}.employee-detail-page .modal-header{margin:-15px -15px 0;padding:18px 15px 15px}.employee-detail-page .modal-header h3{font-size:18px}.employee-detail-page .profile-section{padding:16px}.employee-detail-page .view-field{min-height:64px}.employee-detail-page .view-field--wide{min-height:82px}}
		.employee-account-actions{display:flex;align-items:end;gap:8px}.employee-account-actions .field{flex:1}.employee-password-button{min-height:42px;border:0;border-radius:10px;padding:0 13px;background:#f0edff;color:#5b43c9;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.employee-password-button:disabled{opacity:.6;cursor:wait}.employee-account-status{grid-column:1/-1;margin:0;color:#13825f;font-size:12px;font-weight:900}
		.department-checkboxes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:9px;border:1px solid #dfe4ed;border-radius:10px;background:#fff}.department-option{display:flex;align-items:center;gap:7px;min-width:0;min-height:32px;padding:5px 8px;border:1px solid #edf0f5;border-radius:8px;color:#34415b;font-size:11px;font-weight:800;cursor:pointer}.department-option span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.department-option:has(input:checked){border-color:#bdb0ff;background:#f3f0ff;color:#5b43c9}.department-option input{width:auto!important;min-width:14px;min-height:auto!important;margin:0;padding:0;flex:0 0 auto;accent-color:#6d4aff}
		.employee-type-field{grid-column:1/-1;max-width:300px;justify-self:end;align-self:start}
		.profile-fields{align-items:start}.profile-fields>.field,.profile-fields>.view-field,.profile-fields>.draft-titles,.profile-fields>.edit{align-self:start}.employee-type-field{width:min(300px,100%);justify-self:start}
		.employee-name:disabled{color:#34415b;cursor:default}
		.employee-table-head,.employee-card{grid-template-columns:minmax(150px,1.25fr) minmax(80px,.65fr) minmax(160px,1.35fr) minmax(120px,1fr) minmax(120px,1fr) minmax(130px,auto) auto}
		@media(max-width:850px){.employee-table-head{display:none}.employee-card{grid-template-columns:1fr auto}.employee-column-label{display:block}.employee-contact{grid-column:1;grid-row:2}}
		.employee-self-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border:1px solid #d9d1ff;border-radius:14px;background:linear-gradient(135deg,#f7f5ff,#efebff);color:#4f3bc0;font-size:12px;font-weight:800}.employee-self-banner strong{display:block;margin-bottom:4px;color:#2d3a59;font-size:14px}.employee-self-banner button{min-height:38px;border:0;border-radius:9px;padding:0 14px;background:#6d4aff;color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}.employee-self-badge{display:inline-flex;align-items:center;width:max-content;padding:5px 9px;border-radius:999px;background:#e9e4ff;color:#5b43c9;font-size:10px;font-weight:900}.employee-card--own{border-color:#bdb0ff;box-shadow:0 8px 22px #6d4aff12}
		.employee-pagination{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:4px;padding:14px 0 2px;color:#8993a8;font-size:12px}.employee-pagination__pages{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:center}.employee-pagination__button,.employee-pagination__page{min-height:35px;padding:7px 12px;border:1px solid #e1e6f0;border-radius:9px;color:#59647b;background:#fff;font:inherit;font-weight:800;cursor:pointer;transition:.18s}.employee-pagination__page{min-width:35px;padding:0 9px}.employee-pagination__page:hover,.employee-pagination__button:hover:not(:disabled){border-color:#bdb0ff;color:#5b43c9;transform:translateY(-1px)}.employee-pagination__page.is-active{border-color:#6d4aff;color:#fff;background:#6d4aff;box-shadow:0 5px 14px #6d4aff2b}.employee-pagination__ellipsis{min-width:20px;color:#8993a8;text-align:center}.employee-pagination__button:disabled{opacity:.5;cursor:not-allowed}.employee-pagination__summary{white-space:nowrap}
		.employee-delete-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:20px;background:rgba(15,23,42,.58);backdrop-filter:blur(5px);animation:employeeDeleteFade .18s ease-out}.employee-delete-dialog{width:min(440px,100%);box-sizing:border-box;padding:30px 28px 24px;border:1px solid #f0dce2;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);text-align:center;direction:rtl;animation:employeeDeletePop .2s ease-out}.employee-delete-icon{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 14px;border-radius:18px;color:#c33f5d;background:#fff0f3;font-size:24px}.employee-delete-dialog h3{margin:0 0 10px;color:#202b42;font-size:21px}.employee-delete-dialog p{margin:0 auto 7px;color:#526078;font-size:14px;line-height:1.8}.employee-delete-dialog p strong{color:#202b42}.employee-delete-dialog small{display:block;color:#8993a8;font-size:12px}.employee-delete-error{margin:14px 0 0!important;padding:9px 11px;border:1px solid #f3c5cf;border-radius:10px;color:#b33b57!important;background:#fff3f5;font-size:12px!important;line-height:1.6!important}.employee-delete-actions{display:flex;justify-content:center;gap:10px;margin-top:24px}.employee-delete-actions button{min-width:130px;min-height:42px;border:0;border-radius:10px;padding:9px 16px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}.employee-delete-cancel{color:#526078;background:#eef2f7}.employee-delete-confirm{color:#fff;background:#d95673;box-shadow:0 8px 18px rgba(217,86,115,.24)}.employee-delete-confirm:hover{background:#bd405d}.employee-delete-confirm:disabled{opacity:.65;cursor:wait}.employee-delete-confirm i{margin-inline-end:5px}@keyframes employeeDeleteFade{from{opacity:0}to{opacity:1}}@keyframes employeeDeletePop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
		@media(max-width:700px){.wrap{gap:14px;min-width:0}.intro{font-size:11px;line-height:1.8}.employee-toolbar{align-items:stretch;gap:10px}.employee-toolbar>.add{width:100%;order:-1}.employee-filters{display:grid;grid-template-columns:1fr;gap:9px;width:100%}.employee-filters .field{min-width:0}.clear-filters{width:100%}.head{align-items:flex-start;flex-direction:column;gap:5px}.head h3{font-size:18px}.payroll-summary{grid-template-columns:1fr 1fr;gap:8px;padding:9px}.summary-card{padding:10px}.summary-card span{font-size:10px}.summary-card strong{font-size:13px}.employee-card{grid-template-columns:minmax(0,1fr) auto;gap:11px 10px;padding:14px 12px;border-radius:14px}.employee-card>div:not(.actions){min-width:0}.employee-card .identity{grid-column:1;grid-row:1}.employee-card .actions{grid-column:2;grid-row:1 / span 3;align-self:start}.employee-card .employee-tasks{grid-column:1 / -1}.employee-card .employee-contact{grid-column:1 / -1;grid-row:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid #f0f1f6}.employee-column-label{margin-bottom:4px}.employee-tasks{gap:5px}.employee-tasks .tag{max-width:100%;overflow-wrap:anywhere}.contact-value{overflow-wrap:anywhere}.actions{flex-direction:row;align-items:flex-start}.employee-self-banner{align-items:stretch;flex-direction:column}.employee-self-banner button{width:100%}.employee-modal-backdrop{padding:8px}.employee-detail-page{width:100%;box-sizing:border-box}.detail-grid{grid-template-columns:1fr}.details-head{align-items:flex-start;flex-direction:column}.monthly-save-row{align-items:stretch;flex-direction:column}.monthly-save-row button{width:100%}}
		@media(max-width:430px){.payroll-summary{grid-template-columns:1fr}.employee-card{padding:13px 10px}.employee-card .tag{font-size:10px;padding:5px 8px}.employee-name{font-size:13px}.contact-label,.contact-value{font-size:10px}.employee-modal-backdrop{padding:4px}}
		.detail-grid--notes{grid-template-columns:1fr!important}
		/* Add employee: focused two-panel workspace */
		.add-employee-modal{display:grid;grid-template-columns:255px minmax(0,1fr);gap:0;width:min(980px,100%);max-height:min(88vh,820px);padding:0;overflow:hidden;border:0;border-radius:24px;background:#f7f9fc;box-shadow:0 28px 90px #10182e55;direction:ltr}.add-employee-aside{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:28px;padding:30px 24px;color:#fff;background:linear-gradient(160deg,#172541 0%,#243761 58%,#3d347d 100%);direction:rtl;overflow:hidden}.add-employee-aside::before,.add-employee-aside::after{content:'';position:absolute;border:1px solid #ffffff1c;border-radius:50%;pointer-events:none}.add-employee-aside::before{width:210px;height:210px;top:-88px;left:-88px}.add-employee-aside::after{width:310px;height:310px;bottom:-170px;right:-170px}.add-brand{position:relative;z-index:1;display:flex;align-items:center;gap:11px}.add-brand-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:#a99aff;color:#1d2850;font-size:23px;font-weight:900;box-shadow:0 8px 20px #0e163630}.add-brand strong{font-size:14px}.add-brand span{display:block;margin-top:3px;color:#c9d0e6;font-size:10px;font-weight:700}.add-aside-copy{position:relative;z-index:1}.add-aside-copy h3{margin:0 0 10px;font-size:24px;line-height:1.35;letter-spacing:-.4px}.add-aside-copy p{margin:0;color:#c2cbe0;font-size:12px;line-height:1.9}.add-progress{position:relative;z-index:1;display:grid;gap:12px}.add-progress-item{display:flex;align-items:center;gap:10px;color:#aeb9d2;font-size:11px;font-weight:800}.add-progress-item b{display:grid;place-items:center;width:26px;height:26px;border:1px solid #7382a3;border-radius:50%;font-size:11px}.add-progress-item.is-active{color:#fff}.add-progress-item.is-active b{border-color:#b3a8ff;background:#9183f5;color:#172541;box-shadow:0 0 0 5px #a99aff1c}.add-aside-note{position:relative;z-index:1;padding:12px 13px;border:1px solid #ffffff1c;border-radius:14px;background:#ffffff0d;color:#bdc7de;font-size:10px;line-height:1.8}.add-aside-note strong{display:block;margin-bottom:3px;color:#fff;font-size:11px}.add-employee-main{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0;direction:rtl;background:#f7f9fc}.add-modal-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:25px 30px 20px;border-bottom:1px solid #e7ebf3;background:#fff}.add-modal-top h3{margin:0 0 5px;color:#1d2a47;font-size:20px}.add-modal-top p{margin:0;color:#8290aa;font-size:12px}.add-modal-close{width:36px;height:36px;border:1px solid #e6eaf2;border-radius:11px;background:#f7f8fb;color:#5c6882;font-size:21px;line-height:1;cursor:pointer;transition:.2s}.add-modal-close:hover{background:#ecebff;color:#5948c5;transform:rotate(90deg)}.add-employee-scroll{display:grid;gap:16px;padding:22px 30px;overflow:auto}.add-form-card{display:grid;gap:15px;padding:18px 20px;border:1px solid #e5eaf3;border-radius:17px;background:#fff;box-shadow:0 5px 18px #24365d08}.add-form-card-heading{display:flex;align-items:center;gap:10px;padding-bottom:2px;color:#263653;font-size:14px;font-weight:900}.add-form-card-heading i{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:#eeebff;color:#644ed1;font-style:normal;font-size:13px}.add-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}.add-form-grid .field{gap:7px}.add-form-grid .field>span{color:#62718c}.add-form-grid .field input,.add-form-grid .field select,.add-form-grid .field textarea{border-color:#e0e6f0;border-radius:11px;background:#fbfcfe;transition:border-color .2s,box-shadow .2s,background .2s}.add-form-grid .field input:focus,.add-form-grid .field select:focus,.add-form-grid .field textarea:focus{outline:none;border-color:#8575e7;background:#fff;box-shadow:0 0 0 4px #8171e71c}.add-form-grid .field textarea{min-height:92px}.add-form-grid .field--wide,.add-form-grid .department-field,.add-form-grid .employee-type-field{grid-column:1/-1}.add-form-grid .department-checkboxes{grid-template-columns:repeat(3,minmax(0,1fr));padding:8px;background:#fbfcfe;border-radius:11px}.add-form-grid .department-option{min-height:35px;background:#fff}.add-form-grid .employee-type-field{width:auto;max-width:none;justify-self:stretch}.add-form-grid .employee-type-field select{max-width:50%}.add-form-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 30px;border-top:1px solid #e7ebf3;background:#fff}.add-form-footer .error{margin:0;max-width:55%}.add-save-button{min-width:180px;min-height:46px;border:0;border-radius:12px;padding:0 22px;background:linear-gradient(135deg,#6e5be8,#5643c9);color:#fff;font:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 9px 18px #6653dc35;transition:transform .2s,box-shadow .2s}.add-save-button:hover{transform:translateY(-2px);box-shadow:0 12px 22px #6653dc45}.add-save-button:disabled{opacity:.65;cursor:wait;transform:none}@media(max-width:760px){.add-employee-modal{grid-template-columns:1fr;max-height:94vh}.add-employee-aside{display:none}.add-modal-top,.add-form-footer{padding-left:18px;padding-right:18px}.add-employee-scroll{padding:16px 18px}.add-form-grid .department-checkboxes{grid-template-columns:1fr 1fr}.add-form-grid .employee-type-field select{max-width:none}.add-form-footer{align-items:stretch;flex-direction:column-reverse}.add-form-footer .error{max-width:none}.add-save-button{width:100%}}
		.add-employee-modal{height:min(96vh,860px);max-height:min(96vh,860px)}.add-employee-main{min-height:0}.add-employee-scroll{min-height:0}.add-form-card{gap:12px;padding:16px 18px}.add-form-grid{gap:11px 14px}.add-form-grid .field{gap:5px}.add-form-grid .field textarea{min-height:78px}.add-form-grid .employee-type-field{grid-column:auto;max-width:none;justify-self:stretch}.add-form-grid .employee-type-field select{max-width:none}.add-form-grid .department-checkboxes{padding:7px}.add-form-grid .department-option{min-height:32px}.add-form-footer{padding-top:13px;padding-bottom:13px}
		/* Employee details page: one clear page scroll, no nested clipped modal. */
		.employee-detail-page-backdrop{width:100%!important;min-height:0!important;box-sizing:border-box!important;overflow:visible!important}
		.employee-detail-page-backdrop>.employee-detail-page{width:min(1100px,100%)!important;max-width:1100px!important;max-height:none!important;min-height:0!important;margin:0 auto!important;padding:0!important;overflow:visible!important;box-sizing:border-box!important;border-radius:22px!important}
		.employee-detail-page-backdrop>.employee-detail-page .modal-header{position:static!important;margin:0!important;padding:24px 30px 20px!important;border-radius:22px 22px 0 0!important}
		.employee-detail-page-backdrop>.employee-detail-page .profile-section{max-height:none!important;overflow:visible!important;padding:24px 30px 30px!important;border-radius:0 0 22px 22px!important}
		.employee-detail-page-backdrop>.employee-detail-page .profile-save-row{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;margin-top:4px!important;padding:16px 0 0!important}
		.employee-detail-page--editing .profile-fields>.department-field{max-width:760px!important;justify-self:end!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{width:min(100%,760px)!important;box-sizing:border-box!important;gap:6px!important;padding:7px!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option{min-height:34px!important;padding:4px 7px!important;font-size:10px!important}
		.employee-detail-page .details-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;margin-top:10px!important;padding:14px 16px!important;border:1px solid #e1e7f1!important;border-radius:15px!important;background:#fff!important;box-shadow:0 7px 18px #253b6808!important}
		.employee-detail-page .details-head h4{margin:0!important;color:#273552!important;font-size:16px!important}
		.employee-detail-page .month-picker{display:grid!important;grid-template-columns:auto minmax(150px,190px)!important;align-items:center!important;gap:9px!important;margin:0!important;color:#7b879c!important;font-size:11px!important;font-weight:900!important;direction:rtl!important}
		.employee-detail-page .month-picker input{width:190px!important;min-height:42px!important;box-sizing:border-box!important;border:1px solid #dce4f0!important;border-radius:11px!important;padding:0 11px!important;background:#f8faff!important;color:#293650!important;font:inherit!important;font-weight:800!important}
		.employee-detail-page .month-picker input:focus{outline:0!important;border-color:#7354f4!important;box-shadow:0 0 0 4px #7354f41a!important;background:#fff!important}
		@media(max-width:800px){.employee-detail-page-backdrop>.employee-detail-page{width:100%!important;border-radius:17px!important}.employee-detail-page-backdrop>.employee-detail-page .modal-header{padding:18px!important;border-radius:17px 17px 0 0!important}.employee-detail-page-backdrop>.employee-detail-page .profile-section{padding:18px!important;border-radius:0 0 17px 17px!important}.employee-detail-page-backdrop>.employee-detail-page .profile-fields{grid-template-columns:1fr!important}.employee-detail-page-backdrop>.employee-detail-page .profile-save-row{padding-top:14px!important}}
		@media(max-width:600px){.employee-detail-page .details-head{align-items:stretch!important;flex-direction:column!important;gap:10px!important}.employee-detail-page .month-picker{grid-template-columns:1fr!important;gap:6px!important}.employee-detail-page .month-picker input{width:100%!important}}
		/* Edit employee: ordered, balanced workspace */
		.employee-detail-page--editing .modal-header{display:flex!important;align-items:center!important;padding:24px 32px 22px!important;border-bottom:1px solid #e5e9f3!important;background:linear-gradient(135deg,#f6f4ff 0%,#fff 72%)!important}
		.employee-detail-page--editing .modal-header h3{font-size:22px!important;letter-spacing:-.3px!important}
		.employee-detail-page--editing .profile-section{gap:16px!important;padding:24px 32px 30px!important;background:#f7f9fc!important}
		.employee-detail-page--editing .profile-section h4{padding:0 2px 2px!important;font-size:17px!important}
		.employee-detail-page--editing .profile-fields{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px 20px!important;padding:22px!important;border-radius:20px!important;background:#fff!important}
		.employee-detail-page--editing .profile-fields>.field{display:grid!important;align-content:start!important;gap:7px!important;min-width:0!important}
		.employee-detail-page--editing .profile-fields>.field>span{min-height:17px!important;color:#65738d!important;font-size:11px!important;font-weight:900!important}
		.employee-detail-page--editing .profile-fields>.field input,.employee-detail-page--editing .profile-fields>.field select{width:100%!important;min-height:46px!important;box-sizing:border-box!important;padding:0 13px!important;border:1px solid #dfe6f0!important;border-radius:12px!important;background:#fbfcff!important;color:#293650!important;font-size:13px!important;font-weight:800!important;transition:border-color .2s,box-shadow .2s,background .2s!important}
		.employee-detail-page--editing .profile-fields>.field textarea{width:100%!important;min-height:92px!important;box-sizing:border-box!important;padding:12px 13px!important;border:1px solid #dfe6f0!important;border-radius:12px!important;background:#fbfcff!important;color:#293650!important;line-height:1.7!important;resize:vertical!important}
		.employee-detail-page--editing .profile-fields>.field input:focus,.employee-detail-page--editing .profile-fields>.field select:focus,.employee-detail-page--editing .profile-fields>.field textarea:focus{outline:0!important;border-color:#7660e8!important;box-shadow:0 0 0 4px #7660e81a!important;background:#fff!important}
		.employee-detail-page--editing .profile-fields>.field--description,.employee-detail-page--editing .profile-fields>.department-field,.employee-detail-page--editing .profile-fields>.draft-titles,.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:1/-1!important}
		.employee-detail-page--editing .profile-fields>.field--description textarea{min-height:92px!important}
		.employee-detail-page--editing .profile-fields>.field--description{grid-column:1/-1!important;order:4!important}
		.employee-detail-page--editing .profile-fields>.field--description textarea{min-height:46px!important;max-height:46px!important;resize:none!important;overflow:hidden!important;padding:0 13px!important;line-height:46px!important}
		.employee-detail-page--editing .profile-fields>.department-field{order:5!important}
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(5){order:6!important;grid-column:auto!important}
		.employee-detail-page--editing .profile-fields>.employee-type-field{order:7!important;grid-column:auto!important}
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(6){order:8!important;grid-column:auto!important}
		.employee-detail-page--editing .profile-fields>.add-title-button{order:9!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions{order:10!important}
		.employee-detail-page--editing .profile-fields>.department-field{width:100%!important;max-width:none!important;justify-self:stretch!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;padding:9px!important;border:1px solid #e1e7f0!important;border-radius:14px!important;background:#f9faff!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:40px!important;padding:7px 10px!important;border:1px solid #e5e9f2!important;border-radius:10px!important;background:#fff!important;font-size:11px!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option span{display:block!important;flex:1 1 auto!important;width:auto!important;min-width:0!important;color:#34415b!important;line-height:1.45!important;text-align:right!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option input{flex:0 0 14px!important;width:14px!important;height:14px!important;margin:0!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option:has(input:checked){border-color:#a99aff!important;background:#f1efff!important;box-shadow:0 4px 10px #7055ed12!important}
		.employee-detail-page--editing .profile-fields>.employee-type-field{grid-column:auto!important;width:100%!important;max-width:none!important;justify-self:stretch!important}
		.employee-detail-page--editing .profile-fields>.add-title-button{grid-column:auto!important;align-self:end!important;width:150px!important;min-width:0!important;min-height:46px!important;margin-top:24px!important;border-radius:12px!important}
		.employee-detail-page--editing .profile-fields>.draft-titles{margin:0!important;padding:2px 0 0!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:end!important;gap:10px!important;padding-top:4px!important;border-top:1px solid #eef1f6!important}
		.employee-detail-page--editing .profile-save-row{justify-content:flex-start!important;gap:10px!important;margin-top:2px!important;padding-top:18px!important}
		.employee-detail-page--editing .profile-save-row .save-edit{min-width:210px!important;min-height:46px!important;border-radius:12px!important;box-shadow:0 8px 18px #6d4aff24!important}
		.employee-detail-page--editing .profile-save-row .cancel-edit{min-width:110px!important;min-height:46px!important;border-radius:12px!important}
		@media(max-width:800px){.employee-detail-page--editing .modal-header{padding:19px 20px 17px!important}.employee-detail-page--editing .profile-section{padding:20px!important}.employee-detail-page--editing .profile-fields{grid-template-columns:1fr!important;padding:16px!important}.employee-detail-page--editing .profile-fields>.field--description,.employee-detail-page--editing .profile-fields>.department-field,.employee-detail-page--editing .profile-fields>.draft-titles,.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:1!important}.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{grid-template-columns:repeat(2,minmax(0,1fr))!important}.employee-detail-page--editing .profile-fields>.add-title-button{width:100%!important;margin-top:0!important}.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-template-columns:1fr!important}.employee-detail-page--editing .employee-password-button{width:100%!important}.employee-detail-page--editing .profile-save-row{flex-direction:column!important;align-items:stretch!important}.employee-detail-page--editing .profile-save-row .save-edit,.employee-detail-page--editing .profile-save-row .cancel-edit{width:100%!important}}
		@media(max-width:480px){.employee-detail-page--editing .modal-header h3{font-size:18px!important}.employee-detail-page--editing .profile-section{padding:16px!important}.employee-detail-page--editing .profile-fields{gap:13px!important;padding:13px!important}.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{grid-template-columns:1fr!important}.employee-detail-page--editing .profile-fields>.field input,.employee-detail-page--editing .profile-fields>.field select{min-height:44px!important}}
		.employee-detail-page .view-field--external-label{display:grid!important;align-content:start!important;gap:7px!important;min-height:0!important;padding:0!important;border:0!important;background:transparent!important}
		.employee-detail-page .view-field--external-label>span{display:block!important;padding:0 3px!important;color:#7f8da5!important;font-size:11px!important;font-weight:900!important}
		.employee-detail-page .view-field--external-label>strong{display:flex!important;align-items:center!important;min-height:46px!important;box-sizing:border-box!important;padding:0 13px!important;border:1px solid #dfe6f0!important;border-radius:11px!important;background:#fbfcff!important;color:#263653!important;font-size:13px!important;overflow-wrap:anywhere!important}
		@media(max-width:800px){.employee-detail-page .view-field--external-label>strong{min-height:44px!important}}
		/* Final edit workspace redesign */
		.employee-detail-page--editing{width:min(1120px,calc(100vw - 40px))!important;max-height:none!important;overflow:visible!important;border:1px solid #dce3f0!important;border-radius:24px!important;background:#f4f7fb!important;box-shadow:0 28px 70px #1b29451f!important}
		.employee-detail-page--editing .modal-header{display:flex!important;align-items:center!important;min-height:98px!important;box-sizing:border-box!important;padding:23px 32px!important;border:0!important;border-radius:24px 24px 0 0!important;background:linear-gradient(118deg,#172541 0%,#273968 62%,#5b47bb 100%)!important;color:#fff!important}
		.employee-detail-page--editing .modal-header h3{margin:0 0 7px!important;color:#fff!important;font-size:23px!important;letter-spacing:-.4px!important}
		.employee-detail-page--editing .modal-subtitle{color:#cbd4e7!important;font-size:11px!important}
		.employee-detail-page--editing .modal-close{width:40px!important;height:40px!important;border:1px solid #ffffff2b!important;border-radius:12px!important;background:#ffffff14!important;color:#fff!important}
		.employee-detail-page--editing .profile-section{display:grid!important;gap:18px!important;padding:26px 32px 28px!important;border:0!important;border-radius:0 0 24px 24px!important;background:#f4f7fb!important}
		.employee-detail-page--editing .profile-section h4{padding:0!important;color:#243452!important;font-size:16px!important}
		.employee-detail-page--editing .profile-fields{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px 16px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
		.employee-detail-page--editing .profile-fields>.field,.employee-detail-page--editing .profile-fields>.view-field--external-label{display:grid!important;align-content:start!important;gap:7px!important;min-width:0!important;box-sizing:border-box!important;padding:13px 14px!important;border:1px solid #e0e7f1!important;border-radius:15px!important;background:#fff!important;box-shadow:0 5px 14px #23365a07!important}
		.employee-detail-page--editing .profile-fields>.field>span,.employee-detail-page--editing .profile-fields>.view-field--external-label>span{min-height:16px!important;padding:0!important;color:#74829a!important;font-size:11px!important;font-weight:900!important}
		.employee-detail-page--editing .profile-fields>.field input,.employee-detail-page--editing .profile-fields>.field select,.employee-detail-page--editing .profile-fields>.field textarea,.employee-detail-page--editing .profile-fields>.view-field--external-label>strong{min-height:44px!important;height:44px!important;box-sizing:border-box!important;border:1px solid #dfe6f0!important;border-radius:10px!important;background:#f8faff!important;color:#293650!important;font-size:13px!important;font-weight:800!important}
		.employee-detail-page--editing .profile-fields>.field input,.employee-detail-page--editing .profile-fields>.field select{padding:0 12px!important}
		.employee-detail-page--editing .profile-fields>.field textarea{height:44px!important;min-height:44px!important;padding:0 12px!important;line-height:44px!important;resize:none!important;overflow:hidden!important}
		.employee-detail-page--editing .profile-fields>.field input:focus,.employee-detail-page--editing .profile-fields>.field select:focus,.employee-detail-page--editing .profile-fields>.field textarea:focus{border-color:#7660e8!important;background:#fff!important;box-shadow:0 0 0 4px #7660e81a!important}
		.employee-detail-page--editing .profile-fields>.view-field--external-label{align-content:start!important;min-height:0!important}
		.employee-detail-page--editing .profile-fields>.view-field--external-label>strong{display:flex!important;align-items:center!important;width:100%!important;padding:0 12px!important;overflow-wrap:anywhere!important}
		.employee-detail-page--editing .profile-fields>.field--description,.employee-detail-page--editing .profile-fields>.department-field{grid-column:1/-1!important}
		.employee-detail-page--editing .profile-fields>.department-field{padding:14px!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;padding:0!important;border:0!important;background:transparent!important}
		.employee-detail-page--editing .profile-fields>.department-field .department-option{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:38px!important;padding:7px 10px!important;border:1px solid #e0e7f1!important;border-radius:10px!important;background:#f8faff!important;color:#34415b!important}
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(5),.employee-detail-page--editing .profile-fields>.employee-type-field{grid-column:auto!important}
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(6){grid-column:auto!important}
		.employee-detail-page--editing .profile-fields>.add-title-button{grid-column:auto!important;width:150px!important;margin-top:24px!important;border-radius:11px!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:1/-1!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:end!important;gap:10px!important;padding:14px 0 0!important;border-top:1px solid #e4eaf3!important}
		.employee-detail-page--editing .profile-save-row{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important;padding:18px 0 0!important;border-top:1px solid #e0e7f1!important;background:transparent!important}
		.employee-detail-page--editing .profile-save-row .save-edit{min-width:210px!important;min-height:46px!important;border-radius:12px!important;background:linear-gradient(135deg,#6e5be8,#5643c9)!important;box-shadow:0 9px 18px #6653dc2b!important}
		.employee-detail-page--editing .profile-save-row .cancel-edit{min-width:110px!important;min-height:46px!important;border-radius:12px!important;background:#e8edf5!important;color:#526078!important}
		@media(max-width:800px){.employee-detail-page--editing{width:calc(100vw - 20px)!important;border-radius:18px!important}.employee-detail-page--editing .modal-header{min-height:84px!important;padding:18px 20px!important;border-radius:18px 18px 0 0!important}.employee-detail-page--editing .modal-header h3{font-size:19px!important}.employee-detail-page--editing .profile-section{padding:20px!important;border-radius:0 0 18px 18px!important}.employee-detail-page--editing .profile-fields{grid-template-columns:1fr!important}.employee-detail-page--editing .profile-fields>.department-field,.employee-detail-page--editing .profile-fields>.field--description,.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:1!important}.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{grid-template-columns:repeat(2,minmax(0,1fr))!important}.employee-detail-page--editing .profile-fields>label.field:nth-of-type(5),.employee-detail-page--editing .profile-fields>.employee-type-field,.employee-detail-page--editing .profile-fields>label.field:nth-of-type(6){grid-column:1!important}.employee-detail-page--editing .profile-fields>.add-title-button{width:100%!important;margin-top:0!important}.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-template-columns:1fr!important}.employee-detail-page--editing .profile-save-row{flex-direction:column!important;align-items:stretch!important}.employee-detail-page--editing .profile-save-row button{width:100%!important}}
		@media(max-width:480px){.employee-detail-page--editing .modal-header{padding:16px!important}.employee-detail-page--editing .profile-section{padding:16px!important}.employee-detail-page--editing .profile-fields{gap:11px!important}.employee-detail-page--editing .profile-fields>.department-field .department-checkboxes{grid-template-columns:1fr!important}}
		/* Keep employee type and manager before department selection */
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(5){order:5!important}
		.employee-detail-page--editing .profile-fields>.employee-type-field{order:6!important}
		.employee-detail-page--editing .profile-fields>.department-field{order:7!important}
		.employee-detail-page--editing .profile-fields>label.field:nth-of-type(6){order:8!important}
		.employee-detail-page--editing .profile-fields>.add-title-button{order:9!important}
		.employee-detail-page--editing .profile-fields>.draft-titles{order:10!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions{order:11!important}
		.employee-detail-page--editing .profile-fields>.draft-titles{display:none!important}
		.employee-detail-page--editing .profile-fields>.add-title-button{grid-column:auto!important;order:9!important;width:100%!important;margin-top:24px!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:auto!important;order:9!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:end!important;gap:10px!important;margin:0!important;padding:13px 14px!important;border:1px solid #e0e7f1!important;border-radius:15px!important;background:#fff!important;box-shadow:0 5px 14px #23365a07!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions .field{min-width:0!important}
		.employee-detail-page--editing .profile-fields>.employee-account-actions .employee-password-button{min-height:44px!important;white-space:nowrap!important;border-radius:10px!important}
		@media(max-width:800px){.employee-detail-page--editing .profile-fields>.add-title-button,.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-column:1!important}.employee-detail-page--editing .profile-fields>.employee-account-actions{grid-template-columns:1fr!important}.employee-detail-page--editing .profile-fields>.employee-account-actions .employee-password-button{width:100%!important}}
		.employee-detail-page--editing .profile-fields>.title-entry-field{grid-column:auto!important;order:8!important}
		.employee-detail-page--editing .title-entry-control{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important}
		.employee-detail-page--editing .title-entry-control input{width:100%!important;min-width:0!important;min-height:44px!important;height:44px!important;box-sizing:border-box!important;padding:0 12px!important;border:1px solid #dfe6f0!important;border-radius:10px!important;background:#f8faff!important;color:#293650!important;font:inherit!important;font-size:13px!important;font-weight:800!important}
		.employee-detail-page--editing .title-entry-control .add-title-button{width:auto!important;min-width:118px!important;min-height:44px!important;height:44px!important;margin:0!important;padding:0 13px!important;border-radius:10px!important;white-space:nowrap!important}
		@media(max-width:800px){.employee-detail-page--editing .profile-fields>.title-entry-field{grid-column:1!important}.employee-detail-page--editing .title-entry-control .add-title-button{min-width:112px!important}}
	`],
	template: `
		<div class="wrap" *ngIf="content">
			<p class="intro" *ngIf="!employeePageEmployee">سجّل الموظفين ومسمياتهم، وافتح ملف الموظف لإدارة ملاحظاته الشهرية. كل البيانات داخل لوحة الإدارة فقط.</p>
			<div class="employee-self-banner" *ngIf="isEmployeeAccount && !employeePageEmployee"><div><strong>أنت داخل حساب الموظف</strong><span>يمكنك مشاهدة جدول الموظفين وعرض بيانات زملائك، وفتح ملفك الشخصي لعرض بياناتك الكاملة.</span></div><button type="button" (click)="openOwnEmployeePage()">فتح ملفي الشخصي</button></div>
			<div class="employee-toolbar" *ngIf="!isEmployeeAccount && !employeePageEmployee">
				<button type="button" class="add" (click)="openAddEmployee()">+ إضافة موظف</button><button type="button" class="clear-filters" (click)="exportEmployeesExcel()">تصدير Excel ↓</button>
				<div class="employee-filters">
					<label class="field"><span>بحث في الموظفين</span><input [(ngModel)]="employeeSearch" (ngModelChange)="resetEmployeePage()" placeholder="الاسم، الواتساب أو المسمى"></label>
					<label class="field"><span>نوع الإدارة</span><select [(ngModel)]="employeeDepartmentFilter" (ngModelChange)="resetEmployeePage()"><option value="">كل الإدارات</option><option *ngFor="let department of employeeDepartments" [value]="department">{{ department }}</option></select></label>
					<label class="field"><span>نوع الموظف</span><select [(ngModel)]="employeeTypeFilter" (ngModelChange)="resetEmployeePage()"><option value="">الكل</option><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
					<label class="field"><span>المدير المباشر</span><select [(ngModel)]="employeeManagerFilter" (ngModelChange)="resetEmployeePage()"><option [ngValue]="null">كل المديرين</option><option *ngFor="let manager of employeeManagers" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
					<button type="button" class="clear-filters" *ngIf="employeeSearch || employeeDepartmentFilter || employeeTypeFilter || employeeManagerFilter" (click)="clearEmployeeFilters()">مسح الفلاتر</button>
				</div>
			</div>
			<div class="employee-modal-backdrop" *ngIf="showAddEmployee && !employeePageEmployee" (click)="closeAddEmployee()">
				<section class="employee-modal add-employee-modal" role="dialog" aria-modal="true" aria-label="إضافة موظف" (click)="$event.stopPropagation()">
					<aside class="add-employee-aside">
						<div class="add-brand"><span class="add-brand-mark">+</span><div><strong>مساحة الإدارة</strong><span>نظام إدارة الفريق</span></div></div>
						<div class="add-aside-copy"><h3>موظف جديد.<br>بداية منظمة.</h3><p>أضف بيانات الموظف الأساسية في خطوات بسيطة، لتسهيل المتابعة وإدارة الفريق.</p></div>
						<div class="add-progress"><div class="add-progress-item is-active"><b>1</b><span>البيانات الأساسية</span></div><div class="add-progress-item"><b>2</b><span>الصلاحيات والدور</span></div><div class="add-progress-item"><b>3</b><span>المراجعة والحفظ</span></div></div>
						<div class="add-aside-note"><strong>نصيحة سريعة</strong>استخدم بريداً فعالاً وكلمة سر قوية حتى يتمكن الموظف من تسجيل الدخول بأمان.</div>
					</aside>
					<div class="add-employee-main">
						<header class="add-modal-top"><div><h3>إضافة موظف جديد</h3><p>أدخل البيانات الأساسية للموظف ثم احفظها في دليل الفريق.</p></div><button type="button" class="add-modal-close" aria-label="إغلاق" (click)="closeAddEmployee()">×</button></header>
						<div class="add-employee-scroll">
							<section class="add-form-card"><div class="add-form-card-heading"><i>01</i><span>بيانات التواصل</span></div><div class="add-form-grid">
								<label class="field"><span>اسم الموظف <em class="required-star">*</em></span><input required [(ngModel)]="draft.name" placeholder="اكتب الاسم بالكامل"></label>
								<label class="field"><span>الراتب الأساسي بالجنيه</span><input type="number" min="0" step="0.01" [(ngModel)]="draft.baseSalary" placeholder="مثال: 10000"></label>
								<label class="field"><span>رقم الهاتف المصري <em class="required-star">*</em></span><input required type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" minlength="11" pattern="01[0125][0-9]{8}" [(ngModel)]="draft.whatsapp" (input)="draft.whatsapp = normalizeEgyptianPhone($any($event.target).value)" placeholder="01xxxxxxxxx" title="أدخل رقم هاتف مصري مكوّن من 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015"></label>
								<label class="field"><span>البريد الإلكتروني <em class="required-star">*</em></span><input required type="email" [(ngModel)]="draft.email" placeholder="employee@example.com"></label>
								<label class="field"><span>كلمة السر <em class="required-star">*</em></span><input required type="password" [(ngModel)]="draft.password" placeholder="10 أحرف على الأقل"></label>
							</div></section>
							<section class="add-form-card"><div class="add-form-card-heading"><i>02</i><span>الدور والتخصص</span></div><div class="add-form-grid">
								<label class="field field--wide"><span>الدور في التطبيق</span><textarea [(ngModel)]="draft.description" placeholder="مثال: مسؤول محتوى ومتابعة مهام الفريق"></textarea></label>
								<label class="field employee-type-field"><span>نوع الموظف <em class="required-star">*</em></span><select required [(ngModel)]="draft.employeeType" (ngModelChange)="onDraftTypeChange($event)"><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
								<div class="field department-field"><span>نوع الإدارة <em class="required-star">*</em></span><div class="department-checkboxes"><label class="department-option" *ngFor="let department of employeeDepartmentOptions"><input type="checkbox" [checked]="draft.departments.includes(department)" (change)="toggleDepartment(draft, department, $any($event.target).checked)"><span>{{ department }}</span></label></div></div>
								<div class="draft-titles" *ngIf="draft.departments.length"><span class="title-chip" *ngFor="let department of draft.departments; let i = index">{{ department }}<button type="button" class="chip-remove" aria-label="حذف نوع الإدارة" (click)="removeDraftDepartment(i)">×</button></span></div>
								<label class="field" *ngIf="draft.employeeType !== 'general_manager'"><span>{{ draft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }} <em *ngIf="draft.employeeType === 'manager'" class="required-star">*</em></span><select [required]="draft.employeeType === 'manager'" [(ngModel)]="draft.managerId"><option [ngValue]="null">اختر المسؤول</option><option *ngFor="let manager of employeeManagersFor(draft.employeeType, null)" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
								<label class="field"><span>مسمى وظيفي <em class="required-star">*</em></span><input [(ngModel)]="draft.titleInput" (keyup.enter)="addDraftTitle()" placeholder="مثال: خدمة عملاء"></label><button type="button" class="edit" (click)="addDraftTitle()">+ إضافة مسمى</button>
							</div><div class="draft-titles" *ngIf="draft.titles.length"><span class="title-chip" *ngFor="let title of draft.titles; let i = index">{{ title }}<button type="button" class="chip-remove" aria-label="حذف المسمى" (click)="removeDraftTitle(i)">×</button></span></div></section>
						</div>
						<footer class="add-form-footer"><p class="error" *ngIf="errorMessage">{{ errorMessage }}</p><button type="button" class="add-save-button" [disabled]="isSavingEmployee" (click)="addEmployee()"><span>{{ isSavingEmployee ? 'جاري الحفظ...' : 'حفظ الموظف وإضافته' }}</span> <b>↗</b></button></footer>
					</div>
				</section>
			</div>
			<section class="wrap">
				<div class="head" *ngIf="!employeePageEmployee"><h3>الموظفون</h3><span class="count">{{ paginatedEmployees.length }} من {{ filteredEmployees.length }} موظف</span></div>
				<div class="employee-table-head" *ngIf="!employeePageEmployee && filteredEmployees.length"><span>الموظف</span><span>النوع</span><span>المهام</span><span>نوع الإدارة</span><span>المدير المباشر</span><span>رقم الواتساب</span><span>الإجراءات</span></div>
				<div class="list" *ngIf="!employeePageEmployee && filteredEmployees.length; else emptyState">
					<article class="employee-card" *ngFor="let employee of paginatedEmployees; let i = index" [class.employee-card--own]="isEmployeeAccount && isOwnEmployee(employee)">
						<div class="identity">
							<button type="button" class="employee-name" [disabled]="isEmployeeAccount && !isOwnEmployee(employee)" (click)="openEmployeePage(employee)">{{ employee.name }}</button>
							<span class="employee-self-badge" *ngIf="isEmployeeAccount && isOwnEmployee(employee)">ملفي الشخصي</span>
							<span class="employee-month-total" *ngIf="false">صافي الشهر: {{ formatMoney(employeeMonthlyTotal(employee)) }}</span>
						</div>
						<div><span class="employee-column-label">النوع</span><span class="tag tag--type">{{ employeeTypeLabel(employee) }}</span></div>
						<div class="employee-tasks"><span class="employee-column-label">المهام</span><span class="tag" *ngFor="let title of employee.titles">{{ title }}</span><span class="contact-value contact-value--empty" *ngIf="!employee.titles.length">غير محددة</span></div>
						<div><span class="employee-column-label">نوع الإدارة</span><span class="contact-value">{{ departmentLabel(employee.department) || 'غير محدد' }}</span></div>
						<div><span class="employee-column-label">المدير المباشر</span><span class="contact-value">{{ managerName(employee) || 'بدون مدير' }}</span></div>
						<div class="employee-contact"><span class="contact-label">رقم الواتساب</span><span class="contact-value" [class.contact-value--empty]="!employee.whatsapp">{{ employee.whatsapp || 'غير مسجل' }}</span></div>
						<div class="actions"><button type="button" class="action-menu-trigger" aria-label="إجراءات الموظف" (click)="toggleActionMenu(employee.id)">⋮</button><div class="action-menu" *ngIf="actionMenuEmployeeId === employee.id"><button type="button" class="edit" (click)="openEmployeePage(employee)">عرض الملف</button><button *ngIf="!isEmployeeAccount" type="button" class="edit" (click)="editEmployee(employee)">تعديل</button><button *ngIf="!isEmployeeAccount" type="button" class="delete" (click)="removeEmployee(employee)">حذف</button></div></div>
					</article>
				</div>
				<nav class="employee-pagination" *ngIf="!employeePageEmployee && filteredEmployees.length" aria-label="صفحات الموظفين"><button type="button" class="employee-pagination__button" (click)="goToEmployeePage(employeePage - 1)" [disabled]="employeePage <= 1">السابق</button><div class="employee-pagination__pages"><ng-container *ngFor="let page of employeePageNumbers"><button *ngIf="page !== '…'" type="button" class="employee-pagination__page" [class.is-active]="page === employeePage" [attr.aria-current]="page === employeePage ? 'page' : null" [attr.aria-label]="'الصفحة ' + page" (click)="goToEmployeePage(page)">{{ page }}</button><span *ngIf="page === '…'" class="employee-pagination__ellipsis" aria-hidden="true">…</span></ng-container></div><span class="employee-pagination__summary">صفحة {{ employeePage }} من {{ employeePages }}</span><button type="button" class="employee-pagination__button" (click)="goToEmployeePage(employeePage + 1)" [disabled]="employeePage >= employeePages">التالي</button></nav>
				<div class="employee-modal-backdrop" *ngIf="selectedEmployee as employee" [class.employee-detail-page-backdrop]="employeePageEmployee" (click)="employeePageEmployee ? null : closeDetails()">
					<section class="employee-modal" [class.employee-detail-page]="employeePageEmployee" [class.employee-detail-page--editing]="employeePageEmployee && isEditingEmployee" role="region" [attr.aria-label]="(isEditingEmployee ? 'تعديل ملف الموظف ' : 'ملف الموظف ') + employee.name" (click)="$event.stopPropagation()">
						<header class="modal-header"><div><h3>{{ isEditingEmployee ? 'تعديل ملف ' : 'ملف ' }}{{ employee.name }}</h3><p class="modal-subtitle">{{ isEditingEmployee ? 'حدّث بيانات الموظف الأساسية ثم احفظ التعديلات.' : 'بيانات الموظف وملاحظاته الشهرية' }}</p></div><button type="button" class="modal-close" aria-label="العودة للموظفين" (click)="closeEmployeePage()">×</button></header>
						<section class="profile-section"><h4>البيانات الأساسية</h4><div class="profile-fields">
							<div class="view-field" *ngIf="!isEditingEmployee"><span>اسم الموظف</span><strong>{{ editDraft.name || 'غير محدد' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>اسم الموظف <em class="required-star">*</em></span><input required [(ngModel)]="editDraft.name" placeholder="اكتب الاسم"></label>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>رقم الواتساب</span><strong>{{ editDraft.whatsapp || 'غير مسجل' }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>رقم الواتساب</span><input type="tel" inputmode="tel" [(ngModel)]="editDraft.whatsapp" placeholder="رقم الواتساب"></label>
							<div class="view-field view-field--salary" *ngIf="!isEditingEmployee"><span>الراتب الأساسي</span><strong>{{ editDraft.baseSalary === null || editDraft.baseSalary === undefined ? 'غير محدد' : formatMoney(editDraft.baseSalary) }}</strong></div><label class="field" *ngIf="isEditingEmployee"><span>الراتب الأساسي بالجنيه</span><input type="number" min="0" step="0.01" [(ngModel)]="editDraft.baseSalary" placeholder="مثال: 10000"></label>
							<div class="view-field view-field--external-label" *ngIf="!isEmployeeAccount"><span>بريد الدخول</span><strong dir="ltr">{{ editDraft.email || 'لا يوجد حساب دخول' }}</strong></div>
							<div class="view-field view-field--wide" *ngIf="!isEditingEmployee"><span>الدور في التطبيق</span><strong>{{ editDraft.description || 'غير محدد' }}</strong></div><label class="field field--description" *ngIf="isEditingEmployee"><span>الدور في التطبيق</span><textarea [(ngModel)]="editDraft.description" placeholder="مثال: مسؤول محتوى ومتابعة مهام الفريق"></textarea></label>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>نوع الموظف</span><strong>{{ employeeTypeLabel(employee) }}</strong></div>
							<div class="view-field" *ngIf="!isEditingEmployee"><span>نوع الإدارة</span><strong>{{ departmentLabel(editDraft.departments) || 'غير محدد' }}</strong></div><div class="field department-field" *ngIf="isEditingEmployee"><span>نوع الإدارة <em class="required-star">*</em></span><div class="department-checkboxes"><label class="department-option" *ngFor="let department of employeeDepartmentOptions"><input type="checkbox" [checked]="editDraft.departments.includes(department)" (change)="toggleDepartment(editDraft, department, $any($event.target).checked)"><span>{{ department }}</span></label></div></div>
							<div class="draft-titles" *ngIf="isEditingEmployee && editDraft.departments.length"><span class="title-chip" *ngFor="let department of editDraft.departments; let i = index">{{ department }}<button type="button" class="chip-remove" aria-label="حذف نوع الإدارة" (click)="removeEditDepartment(i)">×</button></span></div>
							<div class="view-field" *ngIf="!isEditingEmployee && editDraft.employeeType !== 'general_manager'"><span>{{ editDraft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }}</span><strong>{{ managerName(employee) || 'بدون مدير' }}</strong></div><label class="field" *ngIf="isEditingEmployee && editDraft.employeeType !== 'general_manager'"><span>{{ editDraft.employeeType === 'manager' ? 'المدير العام' : 'المدير المباشر' }} <em *ngIf="editDraft.employeeType === 'manager'" class="required-star">*</em></span><select [required]="editDraft.employeeType === 'manager'" [(ngModel)]="editDraft.managerId"><option [ngValue]="null">اختر المسؤول</option><option *ngFor="let manager of employeeManagersFor(editDraft.employeeType, employee.id)" [ngValue]="manager.id">{{ manager.name }}</option></select></label>
							<label class="field title-entry-field" *ngIf="isEditingEmployee"><span>إضافة مسمى وظيفي <em class="required-star">*</em></span><div class="title-entry-control"><input [(ngModel)]="editDraft.titleInput" (keyup.enter)="addEditTitle()" placeholder="اكتب المسمى واضغط إضافة"><button type="button" class="edit add-title-button" (click)="addEditTitle()">+ إضافة مسمى</button></div></label>
							<label class="field employee-type-field" *ngIf="isEditingEmployee"><span>نوع الموظف <em class="required-star">*</em></span><select required [(ngModel)]="editDraft.employeeType" (ngModelChange)="onEditTypeChange($event)"><option value="employee">موظف</option><option value="manager">مدير مباشر</option><option value="general_manager">مدير عام</option></select></label>
							<div class="employee-account-actions" *ngIf="isEditingEmployee && !isEmployeeAccount"><label class="field"><span>كلمة مرور جديدة</span><input type="password" [(ngModel)]="editDraft.password" placeholder="10 أحرف على الأقل"></label><button type="button" class="employee-password-button" [disabled]="isUpdatingPassword" (click)="resetEmployeePassword(employee)">{{ isUpdatingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور' }}</button></div>
						</div>
						<div class="draft-titles" *ngIf="editDraft.titles.length"><span class="title-chip" *ngFor="let title of editDraft.titles; let titleIndex = index">{{ title }}<button *ngIf="isEditingEmployee" type="button" class="chip-remove" aria-label="حذف المسمى" (click)="removeEditTitle(titleIndex)">×</button></span></div>
						<p class="error" *ngIf="editError">{{ editError }}</p><p class="employee-account-status" *ngIf="editSuccess">{{ editSuccess }}</p><div class="modal-save-row profile-save-row"><button *ngIf="isEditingEmployee && !isEmployeeAccount" type="button" class="save-edit" [disabled]="isSavingEdit" (click)="saveEdit(employee)">{{ isSavingEdit ? 'جاري الحفظ...' : 'حفظ البيانات الأساسية' }}</button><button *ngIf="isEditingEmployee && !isEmployeeAccount" type="button" class="cancel-edit" (click)="cancelEmployeeEditing()">إلغاء</button><button *ngIf="!isEditingEmployee && !isEmployeeAccount" type="button" class="edit" (click)="startEmployeeEditing()">تعديل</button></div></section>
						<div class="details-head" *ngIf="!isEditingEmployee && (!isEmployeeAccount || isOwnEmployee(employee))"><h4>البيانات الشهرية</h4><label class="month-picker"><span>الشهر</span><input type="month" [(ngModel)]="selectedMonth" (ngModelChange)="onMonthChange()"></label></div>
						<div class="detail-grid detail-grid--notes" *ngIf="!isEditingEmployee && (!isEmployeeAccount || isOwnEmployee(employee))">
							<section class="detail-section"><h5>الملاحظات</h5>
								<div class="fields" *ngIf="!isEmployeeAccount"><label class="field"><span>ملاحظة جديدة لهذا الشهر</span><input [(ngModel)]="noteDraft" (keyup.enter)="addNote(employee)" placeholder="اكتب الملاحظة"></label><button type="button" class="edit" (click)="addNote(employee)">إضافة ملاحظة</button></div>
								<div class="note-list" *ngIf="getMonthRecord(employee).notes.length"><div class="note-item" *ngFor="let note of getMonthRecord(employee).notes; let noteIndex = index"><div class="note-text">{{ note.text }}<span class="note-date">{{ note.createdAt | date:'short' }}</span></div><button *ngIf="!isEmployeeAccount" type="button" class="remove-small" aria-label="حذف الملاحظة" (click)="removeNote(employee, noteIndex)">×</button></div></div>
								<div class="empty" *ngIf="!getMonthRecord(employee).notes.length">لا توجد ملاحظات لهذا الشهر.</div>
							</section>
						</div>
						<div class="monthly-save-row" *ngIf="!isEditingEmployee && !isEmployeeAccount && (monthlyDirty || monthlySaveMessage || monthlySaveError)"><button type="button" class="save-edit" [disabled]="isSavingMonthly" (click)="saveMonthlyChanges()">{{ isSavingMonthly ? 'جاري الحفظ...' : 'حفظ التعديلات الشهرية' }}</button><span class="monthly-save-message" *ngIf="monthlySaveMessage">{{ monthlySaveMessage }}</span><span class="monthly-save-error" *ngIf="monthlySaveError">{{ monthlySaveError }}</span></div>
					</section>
				</div>
				<ng-template #emptyState><div class="empty" *ngIf="!employeePageEmployee">{{ employees.length ? 'لا توجد نتائج مطابقة للفلاتر.' : 'لم تتم إضافة موظفين بعد.' }}</div></ng-template>
			</section>
			<div class="employee-delete-backdrop" *ngIf="employeePendingDeletion as employee" role="presentation" (click)="closeDeleteEmployeeDialog()">
				<section class="employee-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="employee-delete-title" (click)="$event.stopPropagation()">
					<div class="employee-delete-icon"><i class="bi bi-trash3"></i></div>
					<h3 id="employee-delete-title">تأكيد حذف الموظف</h3>
					<p>هل تريد حذف الموظف <strong>{{ employee.name }}</strong> نهائيًا؟</p>
					<small>سيتم حذف بيانات الموظف من دليل الفريق، ولن تتأثر باقي بيانات الموظفين.</small>
					<p class="employee-delete-error" *ngIf="employeeDeleteError">{{ employeeDeleteError }}</p>
					<div class="employee-delete-actions"><button type="button" class="employee-delete-cancel" (click)="closeDeleteEmployeeDialog()" [disabled]="isDeletingEmployee">إلغاء</button><button type="button" class="employee-delete-confirm" (click)="confirmDeleteEmployee()" [disabled]="isDeletingEmployee"><i class="bi bi-trash3"></i>{{ isDeletingEmployee ? 'جاري الحذف...' : 'حذف نهائي' }}</button></div>
				</section>
			</div>
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
	readonly employeeDepartmentOptions = ['الدعم والكول سنتر', 'الأكواد والاشتراكات', 'المتابعة', 'المنصة والمحتوي', 'سوشيال ميديا', 'مدرسين'];
	draft: EmployeeDraft = this.emptyDraft();
	editDraft: EmployeeDraft = this.emptyDraft();
	editingId: number | null = null;
	isEditingEmployee = false;
	selectedEmployeeId: number | null = null;
	employeeSearch = '';
	employeeDepartmentFilter = '';
	employeeTypeFilter: EmployeeType | '' = '';
	employeeManagerFilter: number | null = null;
	employeePage = 1;
	readonly employeePageSize = 10;
	actionMenuEmployeeId: number | null = null;
	employeePendingDeletion: Employee | null = null;
	isDeletingEmployee = false;
	employeeDeleteError = '';
	selectedMonth = this.currentMonth();
	noteDraft = '';
	adjustmentDraft: { kind: 'bonus' | 'discount'; amount: number | null; reason: string } = this.emptyAdjustmentDraft();
	monthlyDirty = false;
	isSavingMonthly = false;
	isSavingEdit = false;
	monthlySaveMessage = '';
	monthlySaveError = '';
	errorMessage = '';
	editError = '';
	editSuccess = '';
	isUpdatingPassword = false;

	ngOnChanges(): void {
		if (!this.content || typeof this.content !== 'object') return;
		if (!Array.isArray(this.content.items)) this.content.items = [];
		this.employees = this.content.items;
		for (const employee of this.employees) {
			if (!Array.isArray(employee.titles)) employee.titles = employee.job?.trim() ? [employee.job.trim()] : [];
			employee.department = this.departmentValues(employee.department).map(value => this.normalizeDepartment(value));
			if (!['employee', 'manager', 'general_manager'].includes(employee.employeeType || '')) employee.employeeType = 'employee';
			if (employee.employeeType === 'general_manager') employee.managerId = null;
			if (!Array.isArray(employee.monthlyRecords)) employee.monthlyRecords = [];
		}
		if (this.employeePageId !== null) {
			const employee = this.employeePageEmployee;
			if (employee) this.selectEmployeeForPage(employee);
		}
		this.draft = this.emptyDraft();
	}

	ngOnInit(): void {
		this.route.fragment.subscribe(fragment => {
			const match = String(fragment || '').match(/^employee-(\d+)$/);
			const requestedId = match ? Number(match[1]) : null;
			this.employeePageId = requestedId;
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
	get employeeAccountId(): number | null { const permission = this.auth.getPermissions().find(item => /^employee:\d+$/.test(String(item || ''))); return permission ? Number(permission.slice('employee:'.length)) : null; }
	isOwnEmployee(employee: Employee): boolean { return !this.isEmployeeAccount || employee.id === this.employeeAccountId; }
	get canViewSalary(): boolean { return this.auth.getRole() === 'admin' || (!!this.selectedEmployee && this.isOwnEmployee(this.selectedEmployee)); }
	get employeePageEmployee(): Employee | null { return this.employees.find(employee => employee.id === this.employeePageId) || null; }
	get employeeDepartments(): string[] { return [...new Set(this.employees.flatMap(employee => this.departmentValues(employee.department)))].sort((a, b) => a.localeCompare(b, 'ar')); }
	get employeeManagers(): Employee[] { return this.employees.filter(employee => employee.name.trim() && (employee.employeeType === 'manager' || employee.employeeType === 'general_manager')).sort((a, b) => a.name.localeCompare(b.name, 'ar')); }
	get employeePages(): number { return Math.max(1, Math.ceil(this.filteredEmployees.length / this.employeePageSize)); }
	get paginatedEmployees(): Employee[] { const page = Math.min(Math.max(this.employeePage, 1), this.employeePages); const start = (page - 1) * this.employeePageSize; return this.filteredEmployees.slice(start, start + this.employeePageSize); }
	get employeePageNumbers(): Array<number | '…'> { return this.buildEmployeePaginationItems(Math.min(this.employeePage, this.employeePages), this.employeePages); }
	async exportEmployeesExcel(): Promise<void> { const rows = this.filteredEmployees.map(employee => ({ الموظف: employee.name, النوع: this.employeeTypeLabel(employee), المهام: employee.titles.join('، ') || 'غير محددة', 'نوع الإدارة': this.departmentLabel(employee.department) || 'غير محدد', 'المدير المباشر': this.managerName(employee) || 'بدون مدير', 'رقم الواتساب': employee.whatsapp || '', 'البريد الإلكتروني': employee.email || '' })); const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('الموظفون'); const keys = Object.keys(rows[0] || { الموظف: '' }); sheet.columns = keys.map(key => ({ header: key, key, width: Math.min(Math.max(key.length + 4, 14), 32) })); sheet.addRows(rows); sheet.getRow(1).font = { bold: true }; sheet.views = [{ rightToLeft: true }]; const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `الموظفون-${new Date().toISOString().slice(0,10)}.xlsx`; link.click(); URL.revokeObjectURL(url); }
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
			const matchesQuery = !query || [employee.name, employee.whatsapp || '', this.departmentLabel(employee.department), this.managerName(employee), this.employeeTypeLabel(employee), ...(employee.titles || [])].join(' ').toLocaleLowerCase().includes(query);
			const matchesDepartment = !this.employeeDepartmentFilter || this.departmentValues(employee.department).includes(this.employeeDepartmentFilter);
			const matchesType = !this.employeeTypeFilter || (employee.employeeType || 'employee') === this.employeeTypeFilter;
			const matchesManager = this.employeeManagerFilter === null || employee.managerId === this.employeeManagerFilter;
			return matchesQuery && matchesDepartment && matchesType && matchesManager;
		});
	}
	buildEmployeePaginationItems(currentPage: number, totalPages: number): Array<number | '…'> {
		if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const items: Array<number | '…'> = [1];
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		if (start > 2) items.push('…');
		for (let page = start; page <= end; page += 1) items.push(page);
		if (end < totalPages - 1) items.push('…');
		items.push(totalPages);
		return items;
	}
	resetEmployeePage(): void { this.employeePage = 1; this.actionMenuEmployeeId = null; }
	goToEmployeePage(page: number | '…'): void { if (page === '…') return; this.employeePage = Math.min(Math.max(page, 1), this.employeePages); this.actionMenuEmployeeId = null; }
	clearEmployeeFilters(): void { this.employeeSearch = ''; this.employeeDepartmentFilter = ''; this.employeeTypeFilter = ''; this.employeeManagerFilter = null; this.resetEmployeePage(); }
	toggleActionMenu(employeeId: number): void { this.actionMenuEmployeeId = this.actionMenuEmployeeId === employeeId ? null : employeeId; }
	openEmployeePage(employee: Employee): void {
		this.actionMenuEmployeeId = null;
		this.isEditingEmployee = false;
		this.employeePageId = employee.id;
		this.selectEmployeeForPage(employee);
		void this.router.navigate([], { relativeTo: this.route, fragment: `employee-${employee.id}` });
	}
	editEmployee(employee: Employee): void { if (this.isEmployeeAccount) return; this.openEmployeePage(employee); this.isEditingEmployee = true; }
	openOwnEmployeePage(): void { const employee = this.employees.find(item => item.id === this.employeeAccountId); if (employee) this.openEmployeePage(employee); }
	startEmployeeEditing(): void { this.isEditingEmployee = true; this.editError = ''; this.editSuccess = ''; }
	cancelEmployeeEditing(): void { this.cancelEdit(); this.isEditingEmployee = false; }
	closeEmployeePage(): void {
		this.employeePageId = null;
		this.closeDetails();
		void this.router.navigate([], { relativeTo: this.route, fragment: undefined });
	}
	private selectEmployeeForPage(employee: Employee): void {
		this.selectedEmployeeId = employee.id;
		this.editingId = employee.id;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, departments: this.departmentValues(employee.department), employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
	}

	openAddEmployee(): void { this.errorMessage = ''; this.draft = this.emptyDraft(); this.showAddEmployee = true; }
	closeAddEmployee(): void { this.errorMessage = ''; this.showAddEmployee = false; }

	addDraftTitle(): void { this.pushTitle(this.draft); }
	normalizeEgyptianPhone(value: string): string { return String(value || '').replace(/\D/g, '').slice(0, 11); }
	removeDraftTitle(index: number): void { this.draft.titles.splice(index, 1); }
	onDraftTypeChange(type: EmployeeType): void { if (type === 'general_manager' || (type === 'manager' && !this.employeeManagersFor(type, null).some(manager => manager.id === this.draft.managerId))) this.draft.managerId = null; }
	onEditTypeChange(type: EmployeeType): void { if (type === 'general_manager' || (type === 'manager' && !this.employeeManagersFor(type, this.selectedEmployeeId).some(manager => manager.id === this.editDraft.managerId))) this.editDraft.managerId = null; }

	addEmployee(): void {
		if (this.isSavingEmployee) return;
		this.pushTitle(this.draft);
		const name = this.draft.name.trim();
		if (!name || !this.draft.titles.length) { this.errorMessage = 'اكتب اسم الموظف وأضف مسمى وظيفيًا واحدًا على الأقل.'; return; }
		const whatsapp = this.normalizeEgyptianPhone(this.draft.whatsapp);
		if (!/^01[0125]\d{8}$/.test(whatsapp)) { this.errorMessage = 'رقم الهاتف مطلوب ويجب أن يكون رقمًا مصريًا صحيحًا من 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015.'; return; }
		if (!this.draft.departments.length) { this.errorMessage = 'اختر نوع إدارة واحدًا على الأقل.'; return; }
		if (!this.draft.employeeType) { this.errorMessage = 'اختر نوع الموظف.'; return; }
		if (this.draft.employeeType === 'manager' && this.draft.managerId == null) { this.errorMessage = 'اختر المدير العام للمدير المباشر.'; return; }
		const email = this.draft.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.errorMessage = 'اكتب بريدًا إلكترونيًا صحيحًا.'; return; }
		if (this.draft.password.length < 10) { this.errorMessage = 'كلمة السر يجب ألا تقل عن 10 أحرف.'; return; }
		this.isSavingEmployee = true;
		this.adminApi.createEmployeeWithAccount({ name, titles: [...this.draft.titles], whatsapp, email, description: this.draft.description.trim(), baseSalary: this.normalizeSalary(this.draft.baseSalary), department: [...this.draft.departments], employeeType: this.draft.employeeType, managerId: this.draft.managerId }, this.draft.password).pipe(finalize(() => { this.isSavingEmployee = false; })).subscribe({
			next: result => { this.content = result.data; this.employees = result.data.items || this.employees; this.draft = this.emptyDraft(); this.errorMessage = ''; this.showAddEmployee = false; },
			error: err => { this.errorMessage = err?.error?.message || 'تعذر إنشاء الموظف والحساب. لم يتم تغيير بيانات الموظفين.'; }
		});
	}

	startEditing(employee: Employee): void {
		if (this.editingId === employee.id) { this.cancelEdit(); return; }
		this.editingId = employee.id;
		this.isEditingEmployee = true;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, departments: this.departmentValues(employee.department), employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
		this.editError = '';
	}

	addEditTitle(): void { this.pushTitle(this.editDraft); this.editError = ''; }
	removeEditTitle(index: number): void { this.editDraft.titles.splice(index, 1); }
	resetEmployeePassword(employee: Employee): void {
		const email = (employee.email || '').trim().toLowerCase();
		const password = this.editDraft.password;
		if (!email) { this.editError = 'لا يوجد بريد دخول مرتبط بهذا الموظف.'; return; }
		if (password.length < 10) { this.editError = 'كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف.'; return; }
		this.isUpdatingPassword = true;
		this.editError = '';
		this.editSuccess = '';
		this.adminApi.updateAdminUser(email, { password }).pipe(finalize(() => { this.isUpdatingPassword = false; })).subscribe({
			next: () => { this.editDraft.password = ''; this.editSuccess = 'تم تحديث كلمة مرور حساب الدخول.'; },
			error: err => { this.editError = err?.error?.message || 'تعذر تحديث كلمة المرور.'; }
		});
	}

	saveEdit(employee: Employee): void {
		if (this.isSavingEdit) return;
		this.pushTitle(this.editDraft);
		const name = this.editDraft.name.trim();
		if (!name || !this.editDraft.titles.length) { this.editError = 'الاسم ومسمى وظيفي واحد على الأقل مطلوبان.'; return; }
		if (!this.editDraft.departments.length) { this.editError = 'اختر نوع إدارة واحدًا على الأقل.'; return; }
		if (!this.editDraft.employeeType) { this.editError = 'اختر نوع الموظف.'; return; }
		if (this.editDraft.employeeType === 'manager' && this.editDraft.managerId == null) { this.editError = 'اختر المدير العام للمدير المباشر.'; return; }
		const email = this.editDraft.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.editError = 'اكتب بريدًا إلكترونيًا صحيحًا.'; return; }
		const nextEmployees = structuredClone(this.employees);
		const nextEmployee = nextEmployees.find(item => item.id === employee.id);
		if (!nextEmployee) { this.editError = 'تعذر العثور على الموظف.'; return; }
		nextEmployee.name = name; nextEmployee.email = email;
		nextEmployee.titles = [...this.editDraft.titles];
		nextEmployee.whatsapp = this.editDraft.whatsapp.trim();
		nextEmployee.description = this.editDraft.description.trim();
		nextEmployee.baseSalary = this.normalizeSalary(this.editDraft.baseSalary);
		nextEmployee.department = [...this.editDraft.departments];
		nextEmployee.employeeType = this.editDraft.employeeType;
		nextEmployee.managerId = this.editDraft.employeeType === 'general_manager' ? null : this.editDraft.managerId;
		delete nextEmployee.job;
		const previousContent = structuredClone(this.content);
		this.isSavingEdit = true;
		this.editError = '';
		this.editSuccess = '';
		this.adminApi.updateEmployeeProfile(employee.id, nextEmployee).pipe(finalize(() => { this.isSavingEdit = false; })).subscribe({
			next: saved => {
				this.content = saved;
				this.employees = saved.items || nextEmployees;
				const savedEmployee = this.employees.find(item => item.id === employee.id) || nextEmployee;
				this.editDraft = { name: savedEmployee.name, titleInput: '', titles: [...savedEmployee.titles], whatsapp: savedEmployee.whatsapp || '', email: savedEmployee.email || '', password: '', description: savedEmployee.description || '', baseSalary: savedEmployee.baseSalary ?? null, departments: this.departmentValues(savedEmployee.department), employeeType: savedEmployee.employeeType || 'employee', managerId: savedEmployee.managerId ?? null };
				this.isEditingEmployee = false;
				this.editSuccess = 'تم حفظ بيانات الموظف بأمان.';
			},
			error: err => { this.content = previousContent; this.employees = previousContent.items || this.employees; this.editError = err?.error?.message || 'تعذر حفظ بيانات الموظف.'; }
		});
	}

	cancelEdit(): void {
		const employee = this.selectedEmployee;
		this.editDraft = employee ? { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, departments: this.departmentValues(employee.department), employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null } : this.emptyDraft();
		this.editingId = employee?.id ?? null;
		this.editError = '';
		this.editSuccess = '';
	}

	removeEmployee(employee: Employee): void {
		this.actionMenuEmployeeId = null;
		this.employeeDeleteError = '';
		this.employeePendingDeletion = employee;
	}
	closeDeleteEmployeeDialog(): void {
		if (this.isDeletingEmployee) return;
		this.employeePendingDeletion = null;
		this.employeeDeleteError = '';
	}
	confirmDeleteEmployee(): void {
		const employee = this.employeePendingDeletion;
		if (!employee || this.isDeletingEmployee) return;
		const previousContent = structuredClone(this.content);
		const nextEmployees = this.employees
			.filter(item => item.id !== employee.id)
			.map(item => item.managerId === employee.id ? { ...item, managerId: null } : item);
		if (nextEmployees.length === this.employees.length) { this.employeePendingDeletion = null; return; }
		const nextContent = { ...structuredClone(this.content), items: nextEmployees };
		this.isDeletingEmployee = true;
		this.errorMessage = '';
		this.employeeDeleteError = '';
		this.contentService.savePageState('employees', nextContent).pipe(finalize(() => { this.isDeletingEmployee = false; })).subscribe({
			next: saved => { this.content = saved; this.employees = saved.items || nextEmployees; this.employeePendingDeletion = null; this.employeeDeleteError = ''; if (this.editingId === employee.id) this.cancelEdit(); if (this.selectedEmployeeId === employee.id) this.closeDetails(); },
			error: err => { this.content = previousContent; this.employees = previousContent.items || this.employees; this.employeeDeleteError = err?.error?.message || 'تعذر حذف الموظف، لم يتم تغيير البيانات.'; }
		});
	}

	toggleDetails(employee: Employee): void {
		if (this.selectedEmployeeId === employee.id) { this.closeDetails(); return; }
		this.selectedEmployeeId = employee.id;
		this.editingId = employee.id;
		this.editDraft = { name: employee.name, titleInput: '', titles: [...employee.titles], whatsapp: employee.whatsapp || '', email: employee.email || '', password: '', description: employee.description || '', baseSalary: employee.baseSalary ?? null, departments: this.departmentValues(employee.department), employeeType: employee.employeeType || 'employee', managerId: employee.managerId ?? null };
		this.noteDraft = '';
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.editError = '';
		this.editSuccess = '';
	}

	closeDetails(): void {
		this.selectedEmployeeId = null;
		this.editingId = null;
		this.isEditingEmployee = false;
		this.editDraft = this.emptyDraft();
		this.noteDraft = '';
		this.adjustmentDraft = this.emptyAdjustmentDraft();
		this.editError = '';
		this.editSuccess = '';
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

	formatMoney(value: number): string { return `${Math.round(Number(value) || 0)} ج`; }

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
	removeDraftDepartment(index: number): void { this.draft.departments.splice(index, 1); }
	removeEditDepartment(index: number): void { this.editDraft.departments.splice(index, 1); }
	toggleDepartment(target: EmployeeDraft, department: string, checked: boolean): void { target.departments = checked ? [...new Set([...target.departments, department])] : target.departments.filter(item => item !== department); }
	private departmentValues(value?: string | string[]): string[] { return (Array.isArray(value) ? value.filter(Boolean) : value?.trim() ? [value.trim()] : []).map(item => this.normalizeDepartment(item)); }
	private normalizeDepartment(value: string): string { const legacy: Record<string, string> = { 'صناعة محتوى': 'المنصة والمحتوي', 'محتوى ومنصة': 'المنصة والمحتوي', 'محتوى تعليمي': 'المنصة والمحتوي', 'ميديا باير': 'الدعم والكول سنتر', 'كول سنتر': 'الدعم والكول سنتر', 'دعم فني': 'الدعم والكول سنتر', 'انتشار ميديا': 'سوشيال ميديا', 'متابعة طلاب': 'المتابعة', 'مهندسين': 'مدرسين', 'مدرسين اللغات': 'مدرسين' }; return legacy[value] || value; }
	departmentLabel(value?: string | string[]): string { return this.departmentValues(value).join('، '); }
	private emptyDraft(): EmployeeDraft { return { name: '', titleInput: '', titles: [], whatsapp: '', email: '', password: '', description: '', baseSalary: null, departments: [], employeeType: 'employee', managerId: null }; }
	private emptyAdjustmentDraft(): { kind: 'bonus' | 'discount'; amount: number | null; reason: string } { return { kind: 'bonus', amount: null, reason: '' }; }
}
