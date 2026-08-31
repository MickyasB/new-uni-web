// server/google-doc-sync.js — Sends user registration data to a Google Sheet via Apps Script Web App
// 
// HOW TO SET UP:
// 1. Open Google Sheets and create a new spreadsheet
// 2. Name the first sheet "Registrations"
// 3. Add headers in Row 1: Timestamp | Full Name | Email | Password | Country | Phone
// 4. Go to Extensions > Apps Script
// 5. Replace the code with the script below, then Deploy > New Deployment > Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the Web App URL and paste it into GOOGLE_SHEET_WEBHOOK_URL below
//
// APPS SCRIPT CODE (paste into Google Apps Script editor):
// ─────────────────────────────────────────────────────────
// function doPost(e) {
//   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Registrations");
//   if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   var data = JSON.parse(e.postData.contents);
//   sheet.appendRow([
//     data.timestamp || new Date().toISOString(),
//     data.fullName || "",
//     data.email || "",
//     data.password || "",
//     data.country || "",
//     data.phone || ""
//   ]);
//   return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
//     .setMimeType(ContentService.MimeType.JSON);
// }
//
// function doGet(e) {
//   return ContentService.createTextOutput("Google Doc Sync Active");
// }
// ─────────────────────────────────────────────────────────

// ★★★ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE ★★★
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';

export async function sendToGoogleDoc(userData) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) {
    console.log('[Google Doc Sync] No webhook URL configured. Set GOOGLE_SHEET_WEBHOOK_URL env variable or edit google-doc-sync.js');
    console.log('[Google Doc Sync] Data that would be sent:', JSON.stringify(userData));
    return false;
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      fullName: userData.fullName || '',
      email: userData.email || '',
      password: userData.password || '',
      country: userData.country || '',
      phone: userData.phone || ''
    };

    const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (response.ok) {
      console.log(`[Google Doc Sync] ✅ Sent registration for ${userData.email}`);
      return true;
    } else {
      console.error(`[Google Doc Sync] ❌ Failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('[Google Doc Sync] ❌ Error:', error.message);
    return false;
  }
}

export default { sendToGoogleDoc };
