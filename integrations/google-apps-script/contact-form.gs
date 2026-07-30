const SHEET_NAME = 'Form Kayıtları';
const WEBHOOK_SECRET = 'BURAYA_CLOUDFLARE_ILE_AYNI_GIZLI_ANAHTARI_YAZIN';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    if (!data.secret || data.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp',
        'Ad Soyad',
        'E-posta',
        'Konu',
        'Mesaj',
        'Kaynak',
        'Ülke',
        'Durum'
      ]);
      sheet.setFrozenRows(1);
    }

    const timestamp = Utilities.formatDate(
      new Date(),
      'Europe/Istanbul',
      'dd.MM.yyyy HH:mm:ss'
    );

    sheet.appendRow([
      timestamp,
      sanitizeCell(data.name),
      sanitizeCell(data.email),
      sanitizeCell(data.subject),
      sanitizeCell(data.message),
      sanitizeCell(data.source || '/iletisim/'),
      sanitizeCell(data.country || ''),
      'Yeni'
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function sanitizeCell(value) {
  const text = String(value || '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
