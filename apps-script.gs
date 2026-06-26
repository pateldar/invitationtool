// ============================================================
// Bhumika & Darshil — Invitation Tool | Google Apps Script
// ============================================================
// Deploy as a Web App:
//   Execute as: Me
//   Who has access: Anyone
// Then paste the Web App URL into your HTML files.
// ============================================================

const SHEET_ID = "1y5QdtSQMVtBVMqjwNbnyDSI7tDBvunRIQxbeCLsuoqo";
const ADMIN_TOKEN = "BhumikaAndDarshil1998!";

// ---- Sheet name constants ----
const SHEET_GUESTS = "Guests";
const SHEET_RSVPS  = "RSVPs";
const SHEET_EVENTS = "Events";

// ============================================================
// doGet — used by admin dashboard to fetch data
// ============================================================
function doGet(e) {
  const params = e.parameter;
  const action = params.action || "";

  // Validate admin token for sensitive actions
  if (action === "getGuests" || action === "getRSVPs" || action === "getEvents" || action === "addGuest" || action === "addEvent" || action === "deleteGuest") {
    if (params.token !== ADMIN_TOKEN) {
      return jsonResponse({ success: false, error: "Unauthorized" });
    }
  }

  try {
    if (action === "getGuest") {
      return jsonResponse(getGuest(params.code));
    } else if (action === "getGuests") {
      return jsonResponse(getAllGuests());
    } else if (action === "getRSVPs") {
      return jsonResponse(getAllRSVPs());
    } else if (action === "getEvents") {
      return jsonResponse(getEvents());
    } else if (action === "addEvent") {
      return jsonResponse(addEvent(params));
    } else if (action === "addGuest") {
      return jsonResponse(addGuest(params));
    } else if (action === "deleteGuest") {
      return jsonResponse(deleteGuest(params.code));
    } else {
      return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// doPost — used by guest RSVP form
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "";

    if (action === "submitRSVP") {
      return jsonResponse(submitRSVP(data));
    } else if (action === "addGuest") {
      if (data.token !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
      return jsonResponse(addGuest(data));
    } else if (action === "addEvent") {
      if (data.token !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
      return jsonResponse(addEvent(data));
    } else {
      return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// Guest operations
// ============================================================

function getGuest(code) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_GUESTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const codeIdx = headers.indexOf("code");

  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIdx] === code) {
      const guest = {};
      headers.forEach((h, j) => guest[h] = data[i][j]);
      // Get events for this guest
      const eventIds = guest.eventIds ? guest.eventIds.split(",") : [];
      const events = getEventsByIds(eventIds);
      // Get existing RSVPs for this guest
      const rsvps = getRSVPsByCode(code);
      return { success: true, guest, events, rsvps };
    }
  }
  return { success: false, error: "Invite not found. Please check your link." };
}

function getAllGuests() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_GUESTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, guests: [] };
  const headers = data[0];
  const guests = data.slice(1).map(row => {
    const g = {};
    headers.forEach((h, j) => g[h] = row[j]);
    return g;
  });
  return { success: true, guests };
}

function addGuest(params) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEET_GUESTS, ["code", "name", "email", "partySize", "eventIds", "note", "createdAt"]);
  const sheet = ss.getSheetByName(SHEET_GUESTS);

  const code = params.code || generateCode();
  const now = new Date().toISOString().slice(0, 10);
  sheet.appendRow([
    code,
    params.name || "",
    params.email || "",
    params.partySize || 1,
    params.eventIds || "",
    params.note || "",
    now
  ]);
  return { success: true, code };
}

function deleteGuest(code) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_GUESTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const codeIdx = headers.indexOf("code");
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIdx] === code) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: "Guest not found" };
}

// ============================================================
// Event operations
// ============================================================

function getEvents() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEET_EVENTS, ["id", "name", "date", "time", "venue", "address", "description", "createdAt"]);
  const sheet = ss.getSheetByName(SHEET_EVENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, events: [] };
  const headers = data[0];
  const events = data.slice(1).map(row => {
    const ev = {};
    headers.forEach((h, j) => ev[h] = row[j]);
    return ev;
  });
  return { success: true, events };
}

function getEventsByIds(ids) {
  const allEvents = getEvents().events;
  if (!ids || ids.length === 0) return allEvents;
  return allEvents.filter(e => ids.includes(e.id));
}

function addEvent(params) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEET_EVENTS, ["id", "name", "date", "time", "venue", "address", "description", "imageUrl", "createdAt"]);
  const sheet = ss.getSheetByName(SHEET_EVENTS);

  // Auto-add imageUrl column to sheets created before this update
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!headerRow.includes("imageUrl")) {
    const createdAtPos = headerRow.indexOf("createdAt");
    if (createdAtPos >= 0) {
      sheet.insertColumnBefore(createdAtPos + 1);
      const cell = sheet.getRange(1, createdAtPos + 1);
      cell.setValue("imageUrl");
      cell.setFontWeight("bold").setBackground("#f3e8d6");
    }
  }

  const id = params.id || generateCode(8);
  const now = new Date().toISOString().slice(0, 10);

  // Handle image: upload base64 to Drive, or use provided URL
  let imageUrl = params.imageUrl || "";
  if (params.imageBase64) {
    imageUrl = uploadImageToDrive(params.imageBase64, params.imageMimeType || "image/jpeg", "event-" + id + ".jpg");
  }

  sheet.appendRow([
    id,
    params.name || "",
    params.date || "",
    params.time || "",
    params.venue || "",
    params.address || "",
    params.description || "",
    imageUrl,
    now
  ]);
  return { success: true, id };
}

// ============================================================
// Image — upload base64 data to Google Drive, return public URL
// ============================================================
function uploadImageToDrive(base64Data, mimeType, filename) {
  try {
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType || "image/jpeg", filename || "event-image.jpg");
    const folder = DriveApp.getRootFolder();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (err) {
    Logger.log("Image upload failed: " + err.message);
    return "";
  }
}

// ============================================================
// RSVP operations
// ============================================================

function submitRSVP(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEET_RSVPS, ["guestCode", "guestName", "eventId", "eventName", "status", "attendingCount", "message", "timestamp"]);
  const sheet = ss.getSheetByName(SHEET_RSVPS);
  const now = new Date().toISOString().slice(0, 10);

  // Remove existing RSVPs for this guest+event combo, then add fresh ones
  const existing = sheet.getDataRange().getValues();
  const headers = existing[0];
  const codeIdx = headers.indexOf("guestCode");
  const eventIdx = headers.indexOf("eventId");

  // Delete existing rows for this guest/event (from bottom to top)
  const rsvps = data.rsvps || [];
  const eventIds = rsvps.map(r => r.eventId);

  for (let i = existing.length - 1; i >= 1; i--) {
    if (existing[i][codeIdx] === data.guestCode && eventIds.includes(existing[i][eventIdx])) {
      sheet.deleteRow(i + 1);
    }
  }

  // Insert updated RSVPs
  rsvps.forEach(r => {
    sheet.appendRow([
      data.guestCode,
      data.guestName || "",
      r.eventId,
      r.eventName || "",
      r.status,
      r.attendingCount || 1,
      r.message || "",
      now
    ]);
  });

  return { success: true };
}

function getAllRSVPs() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEET_RSVPS, ["guestCode", "guestName", "eventId", "eventName", "status", "attendingCount", "message", "timestamp"]);
  const sheet = ss.getSheetByName(SHEET_RSVPS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, rsvps: [] };
  const headers = data[0];
  const rsvps = data.slice(1).map(row => {
    const r = {};
    headers.forEach((h, j) => r[h] = row[j]);
    return r;
  });
  return { success: true, rsvps };
}

function getRSVPsByCode(code) {
  const all = getAllRSVPs();
  return all.rsvps.filter(r => r.guestCode === code);
}

// ============================================================
// Helpers
// ============================================================

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Style header row
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3e8d6");
  }
  return sheet;
}

function generateCode(len) {
  len = len || 10;
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < len; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
