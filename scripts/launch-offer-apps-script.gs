/**
 * Google Apps Script for the launch-offer forms.
 *
 * Bind this script to the target Google Sheet, or set SPREADSHEET_ID below
 * when deploying it as a standalone Web App.
 */
const SPREADSHEET_ID = '';
const SHEET_NAME = 'Launch Leads';
const HEADERS = [
  'وقت التسجيل',
  'الاسم',
  'رقم الواتساب',
  'المدرسة أو المعهد',
  'نوع التعليم',
  'نوع المعادلة',
  'عرفتنا منين؟',
  'موافقة التواصل'
];

// The first two values are kept for old submissions/integrations.
const ALLOWED_PROGRAMS = [
  'معادلة هندسة',
  'معادلة حاسبات',
  'معادلة هندسة عربي',
  'معادلة حاسبات عربي',
  'معادلة هندسة إنجليزي',
  'معادلة حاسبات إنجليزي'
];

function doGet() {
  return jsonResponse_({ success: true, service: 'launch-offer' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const params = e && e.parameter ? e.parameter : {};
    const name = String(params.name || '').trim();
    const whatsapp = normalizePhone_(params.whatsapp);
    const school = String(params.school || '').trim();
    const studentType = String(params.studentType || '').trim();
    const program = String(params.program || '').trim();
    const source = String(params.source || '').trim();
    const consent = String(params.consent || '').trim();

    if (name.length < 2) return jsonResponse_({ success: false, message: 'Invalid name' });
    if (!/^01\d{9}$/.test(whatsapp)) return jsonResponse_({ success: false, message: 'Invalid WhatsApp number' });
    if (!school || !studentType || !ALLOWED_PROGRAMS.includes(program) || !source || consent !== 'نعم') {
      return jsonResponse_({ success: false, message: 'Missing or invalid required fields' });
    }

    const spreadsheet = SPREADSHEET_ID
      ? SpreadsheetApp.openById(SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      return jsonResponse_({ success: false, message: 'Spreadsheet is not configured' });
    }

    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    ensureHeaders_(sheet);

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const phoneColumn = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
      const duplicate = phoneColumn.some(row => normalizePhone_(row[0]) === whatsapp);
      if (duplicate) {
        return jsonResponse_({ success: false, alreadyRegistered: true, message: 'رقم الواتساب ده مسجل بالفعل.' });
      }
    }

    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1).setValue(new Date());
    sheet.getRange(row, 2).setValue(name);
    sheet.getRange(row, 3).setNumberFormat('@').setValue(whatsapp);
    sheet.getRange(row, 4, 1, 5).setValues([[school, studentType, program, source, consent]]);
    SpreadsheetApp.flush();

    return jsonResponse_({ success: true });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: String(error && error.message ? error.message : error)
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.every(value => !String(value || '').trim())) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function normalizePhone_(value) {
  return String(value || '')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\D/g, '');
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
