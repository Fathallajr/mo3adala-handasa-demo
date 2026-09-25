/**
 * Google Apps Script dedicated to the Batch 2027 prize wheel only.
 * Deploy this as a separate Web App and never reuse the normal lead-form script.
 */
const SPREADSHEET_ID = '1lDtfrNTh-q4kXZfg7qt9S8CgmhMkxeLB8UBtgMifTKo';
const SHEET_NAME = 'Wheel Claims';
const HEADERS = ['وقت التسجيل', 'الاسم', 'رقم الواتساب', 'الهدية', 'Wheel Token', 'نوع المعادلة'];

function doGet(event) {
  const params = event && event.parameter ? event.parameter : {};
  const action = String(params.action || '').trim();
  if (action === 'spin' || action === 'check' || action === 'claim') {
    const response = action === 'spin'
      ? spin_(params)
      : action === 'check'
        ? check_(params)
        : doPost({ parameter: params });
    const callback = String(params.callback || '').trim();
    if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
      return ContentService
        .createTextOutput(callback + '(' + response.getContent() + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return response;
  }
  return jsonResponse_({ success: true, service: 'wheel-claims' });
}

function check_(params) {
  const whatsapp = normalizePhone_(params.whatsapp);
  if (!/^01\d{9}$/.test(whatsapp)) {
    return jsonResponse_({ success: false, exists: false, message: 'Invalid WhatsApp number' });
  }

  const claim = findClaimByPhone_(whatsapp);
  return jsonResponse_({ success: true, exists: Boolean(claim), gift: claim ? claim.gift : '' });
}

function findClaimByPhone_(whatsapp, sheet) {
  const claimsSheet = sheet || getClaimsSheet_();
  const lastRow = claimsSheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = claimsSheet.getRange(2, 3, lastRow - 1, 2).getDisplayValues();
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (normalizeStoredPhone_(rows[index][0]) === whatsapp) {
      return { gift: String(rows[index][1] || '').trim() };
    }
  }
  return null;
}

function getClaimsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
}

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};
  const action = String(params.action || 'claim').trim();
  if (action === 'spin') return spin_(params);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const name = String(params.name || '').trim();
    const whatsapp = normalizePhone_(params.whatsapp);
    const gift = String(params.gift || '').trim();
    const program = String(params.program || '').trim();
    const wheelToken = String(params.wheelToken || '').trim();
    const createdAt = String(params.createdAt || '').trim();
    const apiSignature = String(params.apiSignature || '').trim();

    // Static hosting cannot call the Node API, so claims can use the token
    // issued by this Apps Script deployment instead of the server-only secret.
    const storedSpin = PropertiesService.getScriptProperties().getProperty('wheel_token_' + wheelToken);
    let recordedGift = gift;
    if (storedSpin) {
      const spin = JSON.parse(storedSpin);
      recordedGift = spin.gift.label || spin.gift;
      if (Date.now() - Number(spin.createdAt) > 30 * 60 * 1000 || spin.claimed) {
        return jsonResponse_({ success: false, message: 'انتهت صلاحية نتيجة العجلة. لف العجلة من جديد.' });
      }
      if (spin.sessionId !== String(params.sessionId || '').trim()) {
        return jsonResponse_({ success: false, message: 'نتيجة العجلة غير صالحة.' });
      }
      if (gift && spin.gift.label !== gift && spin.gift !== gift) return jsonResponse_({ success: false, message: 'نتيجة العجلة غير صالحة.' });
    } else if (!verifyRequest_(createdAt, wheelToken, whatsapp, gift, apiSignature)) {
      return jsonResponse_({ success: false, message: 'Unauthorized request' });
    }


    if (name.length < 2) return jsonResponse_({ success: false, message: 'Invalid name' });
    if (!/^01\d{9}$/.test(whatsapp)) return jsonResponse_({ success: false, message: 'Invalid WhatsApp number' });
    if (!gift || !wheelToken || ![
      'معادلة هندسة',
      'معادلة حاسبات',
      'معادلة هندسة عربي',
      'معادلة حاسبات عربي',
      'معادلة هندسة إنجليزي',
      'معادلة حاسبات إنجليزي'
    ].includes(program)) return jsonResponse_({ success: false, message: 'Missing wheel result or program' });

    const sheet = getClaimsSheet_();
    ensureHeaders_(sheet);

    const properties = PropertiesService.getScriptProperties();
    const previousClaim = findClaimByPhone_(whatsapp, sheet);
    if (previousClaim || properties.getProperty('registered_phone_' + whatsapp) || properties.getProperty('registered_token_' + wheelToken)) {
      return jsonResponse_({ success: false, alreadyRegistered: true, gift: previousClaim ? previousClaim.gift : '' });
    }

    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1).setValue(new Date());
    sheet.getRange(row, 2).setValue(name);
    // Plain-text format is set before the value so Google Sheets keeps the leading zero.
    sheet.getRange(row, 3).setNumberFormat('@').setValue(whatsapp);
    sheet.getRange(row, 4).setValue(recordedGift);
    sheet.getRange(row, 5).setValue(wheelToken);
    sheet.getRange(row, 6).setValue(program);
    SpreadsheetApp.flush();

    properties.setProperty('registered_phone_' + whatsapp, String(Date.now()));
    properties.setProperty('registered_token_' + wheelToken, String(Date.now()));

    if (storedSpin) {
      const claimedSpin = JSON.parse(storedSpin);
      claimedSpin.claimed = true;
      propertiesForWheel_().setProperty('wheel_token_' + wheelToken, JSON.stringify(claimedSpin));
    }

    return jsonResponse_({ success: true, gift: recordedGift });
  } catch (error) {
    return jsonResponse_({ success: false, message: String(error && error.message || error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// Run this once after deploying to index phone numbers already present in the sheet.
function syncPhoneIndex() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
  const properties = PropertiesService.getScriptProperties();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const rows = sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues();
  rows.forEach(function(row) {
    const whatsapp = normalizeStoredPhone_(row[0]);
    if (/^01\d{9}$/.test(whatsapp)) properties.setProperty('registered_phone_' + whatsapp, 'legacy');
  });
}

function propertiesForWheel_() {
  return PropertiesService.getScriptProperties();
}

function spin_(params) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    return spinUnlocked_(params);
  } catch (error) {
    return jsonResponse_({ success: false, message: 'تعذر تشغيل العجلة. حاول تاني.' });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function spinUnlocked_(params) {
  const sessionId = String(params.sessionId || '').trim();
  if (!sessionId || sessionId.length > 128) return jsonResponse_({ success: false, message: 'Invalid wheel session' });
  const properties = PropertiesService.getScriptProperties();
  const sessionKey = 'wheel_session_' + Utilities.base64EncodeWebSafe(sessionId).slice(0, 80);
  const existingToken = properties.getProperty(sessionKey);
  if (existingToken) {
    const existing = properties.getProperty('wheel_token_' + existingToken);
    if (existing) {
      const spin = JSON.parse(existing);
      if (Date.now() - Number(spin.createdAt) <= 30 * 60 * 1000 && !spin.claimed) {
        return jsonResponse_({ success: true, token: existingToken, gift: spin.gift });
      }
    }
  }
  const options = [
    { id: 'cash-50', label: '50 جنيه', weight: 30, available: true },
    { id: 'lucky-chance', label: 'حظ سعيد', weight: 60, available: false },
    { id: 'discount-10', label: 'خصم 10%', weight: 10, available: true },
    { id: 'cash-200', label: '200 جنيه', weight: 30, available: true },
    { id: 'lucky-empty-1', label: 'حظ سعيد', weight: 60, available: false },
    { id: 'discount-15', label: 'خصم 15%', weight: 10, available: true },
    { id: 'cash-100', label: '100 جنيه', weight: 30, available: true },
    { id: 'lucky-empty-2', label: 'حظ سعيد', weight: 60, available: false },
    { id: 'discount-20', label: 'خصم 20%', weight: 10, available: true }
  ];
  let pick = Math.random() * options.reduce((sum, option) => sum + option.weight, 0);
  const gift = options.find(option => (pick -= option.weight) < 0) || options[0];
  const token = Utilities.getUuid();
  properties.setProperty('wheel_token_' + token, JSON.stringify({ sessionId: sessionId, gift: gift, createdAt: Date.now(), claimed: false }));
  properties.setProperty(sessionKey, token);
  return jsonResponse_({ success: true, token: token, gift: gift });
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() !== 0) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange('C:C').setNumberFormat('@');
}

function normalizePhone_(value) {
  return String(value || '')
    .replace(/[٠-٩]/g, function(digit) { return String(digit.charCodeAt(0) - '٠'.charCodeAt(0)); })
    .replace(/[۰-۹]/g, function(digit) { return String(digit.charCodeAt(0) - '۰'.charCodeAt(0)); })
    .replace(/\D/g, '');
}

function normalizeStoredPhone_(value) {
  const digits = normalizePhone_(value);
  return digits.length === 10 && digits.charAt(0) === '1' ? '0' + digits : digits;
}

function verifyRequest_(createdAt, wheelToken, whatsapp, gift, apiSignature) {
  const secret = String(
    PropertiesService.getScriptProperties().getProperty('WHEEL_API_SECRET') || ''
  ).trim();
  if (!createdAt || !wheelToken || !whatsapp || !gift || !apiSignature || !secret) return false;
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) return false;
  const bytes = Utilities.computeHmacSha256Signature(
    [createdAt, wheelToken, whatsapp, gift].join('|'),
    secret
  );
  const expected = bytes.map(function(byte) {
    const value = (byte < 0 ? byte + 256 : byte).toString(16);
    return value.length === 1 ? '0' + value : value;
  }).join('');
  return expected === apiSignature.toLowerCase();
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
