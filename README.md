# School Visit Management System

A responsive web application for recording and managing school visits. The system allows field incharges to submit visit details from their mobile devices, while administrators can manage users, schools, and reports from a centralized dashboard.

## Features

- Secure Login (Admin & Incharge)
- Role-Based Access
- Dashboard with Visit Statistics
- New School Visit Entry
- Multiple Photo Upload
- Google Drive Photo Storage
- Manage Schools
- Manage Users
- View and Edit Visits
- Reports with Filters
- Export Reports (Excel & PDF)
- Mobile-Friendly Responsive Design
- Dark Mode
- Form Validation
- Toast Notifications

## Technology Stack

**Frontend**

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript

**Backend**

- Google Apps Script

**Database**

- Google Sheets

**File Storage**

- Google Drive

## Project Structure

```text
School-Visit-Management-System/

│── index.html
│── dashboard.html
│── new-visit.html
│── my-visits.html
│── manage-schools.html
│── manage-users.html
│── reports.html
│── profile.html
│── README.md

├── css
│     style.css
│     mobile.css

├── js
│     api.js
│     auth.js
│     config.js
│     dashboard.js
│     profile.js
│     reports.js
│     schools.js
│     ui.js
│     users.js
│     utils.js
│     visit.js

└── apps-script
      Code.gs
```

## User Roles

### Admin

- View Dashboard
- Manage Users
- Manage Schools
- View All Visits
- Generate Reports

### Incharge

- Submit School Visits
- Upload Photos
- View Own Visits
- Edit Own Visits
- Update Profile

## Google Drive Structure

```text
School Visit Photos/
└── Year/
    └── Month/
        └── School Name/
            ├── photo1.jpg
            └── photo2.jpg
```

## Developed By

**Yogii-Tech**

© 2026 All Rights Reserved.
