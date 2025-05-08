const DATA_SPREADSHEET_ID     = scriptProps.getProperty('DATA_SPREADSHEET_ID');
const RESPONSES_SPREADSHEET_ID = scriptProps.getProperty('RESPONSES_SPREADSHEET_ID');
const RECEIPT_FOLDER_ID       = scriptProps.getProperty('RECEIPT_FOLDER_ID');
const HR_EMAIL = scriptProps.getProperty('HR_EMAIL');

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index');
}

// ✨ Upload attachments to Reimbursement Receipts folder
function uploadFiles(files) {
  const folder = DriveApp.getFolderById(RECEIPT_FOLDER_ID);
  const urls   = [];
  const blobs  = [];

  files.forEach(file => {
    // decode client-side Base64 and name it
    const blob = Utilities
                   .newBlob(
                      Utilities.base64Decode(file.base64),
                      file.mimeType,
                      file.name
                   );
    // Log file name and blob size
    console.log(`Uploading file: ${file.name}, Blob size: ${blob.getBytes().length} bytes`);
    // save to Drive
    const saved = folder.createFile(blob);
    saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK,
                     DriveApp.Permission.VIEW);
    urls.push(saved.getUrl());
    // for emailing attachment, grab the saved file’s blob 
    blobs.push(saved.getBlob());
  });

  return { blobs, urls };
}

function submitTimesheet(data) {
  const TEACHING_SHEET_NAME = 'Instructors Hours';
  const ADMIN_SHEET_NAME = 'Admin Hours';
  let sheet;

  try {
    if (!data || !data.type || !data.name || !data.email || !data.timesheetEntries) {
      throw new Error('Invalid input data');
    }

    if (data.type === 'teaching') {
      sheet = SpreadsheetApp.openById(RESPONSES_SPREADSHEET_ID).getSheetByName(TEACHING_SHEET_NAME);
    } else if (data.type === 'admin') {
      sheet = SpreadsheetApp.openById(RESPONSES_SPREADSHEET_ID).getSheetByName(ADMIN_SHEET_NAME);
    } else {
      throw new Error('Invalid form type');
    }

    if (!sheet) {
      throw new Error('Sheet not found for type: ' + data.type);
    }

    const timestamp = new Date().toLocaleString();
    let emailBody = `Dear ${data.name},\n\nThank you for submitting your timesheet. Below is a copy of your submission:\n\n`;

    data.timesheetEntries.forEach((entry, index) => {
      const rowNumber = sheet.getLastRow() + 1;
      const timestampWithRow = `${timestamp} ${('000' + rowNumber).slice(-3)}`;

      const parts = entry.date.split('-');
      const formattedDate = `${parts[1]}/${parts[2]}/${parts[0]}`;

      let row;

      if (data.type === 'teaching') {
        row = [
          timestampWithRow,
          data.name,
          data.email,
          formattedDate,
          entry.location,
          entry.hours,
          entry.bridgeToll ? 'Yes' : 'No',
          entry.reimbursementAmount,
          entry.mileageReimbursement,
          entry.language,
          entry.supervision ? 'Yes' : 'No',
          entry.substitution ? 'Yes' : 'No',
          data.notes
        ];
        emailBody += `Entry ${index + 1}: Teaching Hours\nDate: ${formattedDate}\nLocation: ${entry.location}\nHours: ${entry.hours}\nBridge Toll: ${entry.bridgeToll ? 'Yes' : 'No'}\nReimbursement Amount: ${entry.reimbursementAmount}\nMileage: ${entry.mileageReimbursement}\nLanguage: ${entry.language}\nSupervision: ${entry.supervision ? 'Yes' : 'No'}\nSubstitution: ${entry.substitution ? 'Yes' : 'No'}\n\n`;

      } else {
        row = [
          timestampWithRow,
          data.name,
          data.email,
          formattedDate,
          entry.location,
          entry.hours,
          entry.bridgeToll ? 'Yes' : 'No',
          entry.reimbursementAmount,
          entry.mileageReimbursement,
          data.notes
        ];
        emailBody += `Entry ${index + 1}: Admin Hours\nDate: ${formattedDate}\nLocation: ${entry.location}\nHours: ${entry.hours}\nBridge Toll: ${entry.bridgeToll ? 'Yes' : 'No'}\nReimbursement Amount: ${entry.reimbursementAmount}\nMileage: ${entry.mileageReimbursement}\n\n`;
      }

      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        const startRow = sheet.getLastRow() + 1;
        const startCol = 1;
        sheet.getRange(startRow, startCol, 1, row.length).setValues([row]);
      } finally {
        lock.releaseLock();
      }
    });

    emailBody += `Notes: ${data.notes}\n\nBest regards,\nWorld Language Connection`;

    let emailOptions = {
      replyTo: HR_EMAIL,
    };

    let hrEmailOptions = {
      from: HR_EMAIL,
      replyTo: HR_EMAIL,
      htmlBody: `A new timesheet has been submitted by ${data.name}.<br><br>Submission Details:<br><br>${emailBody.replace(/\n/g, '<br>')}<br><br>`, // Use HTML for better formatting with attachments
    };

    // Log number of attachments received
    console.log('Number of attachments received:', data.attachments ? data.attachments.length : 0);

    // Handle attachments
    if (data.attachments && data.attachments.length > 0) {
      const { blobs, urls } = uploadFiles(data.attachments);

      // Log number of blobs and urls after upload
      console.log('Number of blobs uploaded:', blobs.length);
      console.log('Number of URLs returned:', urls.length);

      emailOptions.attachments    = blobs;
      hrEmailOptions.attachments = blobs;

      if (urls.length > 0) {
         hrEmailOptions.htmlBody += '<br><strong>Receipts:</strong><br>';
         urls.forEach((u,i) => {
            hrEmailOptions.htmlBody +=
              `Receipt ${i+1}: <a href="${u}">${u}</a><br>`;
          });
      }
    }

    // confirmation back to the user
    MailApp.sendEmail({
      to:       data.email,
      subject:  'Timesheet Submission Confirmation',
      body:     emailBody,                // plain-text copy
      replyTo:  HR_EMAIL,
      attachments: emailOptions.attachments
    });

    // notification to HR
    MailApp.sendEmail({
      to:        HR_EMAIL,
      from:      HR_EMAIL,
      replyTo:   HR_EMAIL,
      subject:   `New ${data.type} timesheet submission received`,
      htmlBody:  hrEmailOptions.htmlBody,
      attachments: hrEmailOptions.attachments
    });

    return { success: true, message: 'Timesheet submitted successfully!' };

  } catch (error) {
    console.error('Error in submitTimesheet: ' + error.toString());
    return { success: false, message: 'Error in submitting timesheet: ' + error.message };
  }
}

function getLocations() {
  const LOCATIONS_SHEET_NAME = 'Locations';
  const sheet = SpreadsheetApp.openById(DATA_SPREADSHEET_ID).getSheetByName(LOCATIONS_SHEET_NAME);
  const data = sheet.getRange('A:A').getValues();
  return data.flat().filter(String);
}

function getLanguages() {
  const LANGUAGES_SHEET_NAME = 'Languages';
  const sheet = SpreadsheetApp.openById(DATA_SPREADSHEET_ID).getSheetByName(LANGUAGES_SHEET_NAME);
  const data = sheet.getRange('A:A').getValues();
  return data.flat().filter(String);
}

function getEnv() {
  return {
    EMAIL_DOMAIN: scriptProps.getProperty('EMAIL_DOMAIN'),
  };
}