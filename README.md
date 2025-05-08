# Timesheet Web App (Google Apps Script)

A lightweight, browser-based timesheet system built entirely with Google Apps Script. Designed for nonprofits or educational programs, it enables staff to log instructional and administrative hours, upload receipts, and receive automated confirmations.

## Features

- Distinct forms for **Teaching Hours** and **Admin Hours**  
- Validations for required fields and logic (e.g. date cannot be in the future)  
- Multiple entry rows using dynamic tables  
- Upload receipts to Google Drive and generate public links  
- Data logged to Google Sheets  
- Confirmation email to employee and detailed notification to HR  
- Toast notifications and responsive design  

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla)  
- **Backend**: Google Apps Script (`Code.gs`)  
- **Storage**:  
  - Google Sheets (timesheet logs and reference data)  
  - Google Drive (uploaded files)  
- **Email Delivery**: Google Apps Script `MailApp`  

## Project Structure

```bash
Timesheet-App/
├── Index.html           # Main frontend interface
├── Code.gs              # Backend Apps Script logic
├── style.css            # Optional - extracted styles
├── README.md
```

## How It Works

1. **Initial Input**  
   The user provides name and email to activate the form buttons.

2. **Form Filling**  
   The user fills out date, hours, location, and reimbursement details. Dropdowns are populated from a linked Google Sheet.

3. **Attach Receipts**  
   Uploaded files are saved to a Google Drive folder and shared.

4. **Submission**  
   - Entry is appended to the corresponding Google Sheet tab  
   - Employee receives a confirmation email  
   - HR receives a detailed HTML summary with receipt links  

## Setup & Deployment

> The app is intended for deployment via Google Apps Script, ideally bound to a Google Sheet or published as a Web App.

### Environment Configuration

1. Open the **Apps Script Editor**.
2. Click ⚙️ **Project Settings** → Add Script Properties:

| Key                     | Description                                   |
|-------------------------|-----------------------------------------------|
| `DATA_SPREADSHEET_ID`   | ID of sheet with Locations & Languages        |
| `RESPONSES_SPREADSHEET_ID` | ID of sheet receiving timesheet entries   |
| `RECEIPT_FOLDER_ID`     | ID of Google Drive folder for receipt files   |
| `HR_EMAIL`              | Email address where HR notifications go       |

### Deployment Steps

1. Create the required Google Sheets (Responses, Data).  
2. Paste `Code.gs` into the script editor of the Responses spreadsheet.  
3. Add the HTML interface as a file named `Index`.  
4. Deploy as Web App → Choose "Anyone" or "Anyone in your org".  
5. Share the web app URL with staff via intranet or email.  

