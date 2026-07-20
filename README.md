# School Visit Management System

A responsive web application for recording and managing school visits. The system allows field incharges to submit visit details from their mobile devices, while administrators can manage users, schools, and reports from a centralized dashboard.

## Features

* Secure Login (Admin & Incharge)
* Role-Based Access
* Dashboard with Visit Statistics
* New School Visit Entry
* Multiple Photo Upload
* Google Drive Photo Storage
* Manage Schools
* Manage Users
* View and Edit Visits
* Reports with Filters
* Export Reports (Excel & PDF)
* Mobile-Friendly Responsive Design
* Dark Mode
* Form Validation
* Toast Notifications

## Technology Stack

**Frontend**

* HTML5
* CSS3
* Bootstrap 5
* Vanilla JavaScript

**Backend**

* Google Apps Script

**Database**

* Google Sheets

**File Storage**

* Google Drive

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

* View Dashboard
* Manage Users
* Manage Schools
* View All Visits
* Generate Reports

### Incharge

* Submit School Visits
* Upload Photos
* View Own Visits
* Edit Own Visits
* Update Profile

## Google Drive Structure

```text
School Visit Photos/
└── Year/
    └── Month/
        └── School Name/
            ├── photo1.jpg
            └── photo2.jpg
```

## GitHub Pages Hosting Tutorial

### Step 1: Create a GitHub Repository
1. Log in to [github.com](https://github.com).
2. Click **New** (or "+" in the top-right corner) to create a new repository.
3. Name your repository (e.g., `school-visit`).
4. Set visibility to **Public** (required for free GitHub Pages).
5. Leave "Add a README file" unchecked, then click **Create repository**.

### Step 2: Push Your Code to GitHub
Open your terminal/command prompt in your project root directory and run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/school-visit.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username).*

### Step 3: Enable GitHub Pages
1. Go to your repository page on GitHub.
2. Click on **Settings** (tab at the top).
3. In the left sidebar, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**, change the Source dropdown to **Deploy from a branch**.
5. Under **Branch**, select `main` (or the branch you pushed your code to) and keep the folder as `/ (root)`.
6. Click **Save**.

### Step 4: Access Your Live Website
* GitHub will take 1-2 minutes to build your site.
* Refresh the Settings → Pages screen, and you will see your live URL:
  `https://YOUR_USERNAME.github.io/school-visit/`

---

## Developed By

**Yogii-Tech**

© 2026 All Rights Reserved.
