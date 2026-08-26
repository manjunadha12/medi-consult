# Medi Consult - Selenium E2E Test Suite & Compliance Matrix

This directory contains the E2E Selenium automation suite and the compliance test case matrix for the **Medi Consult** web application login portal.

## Features
1. **Automated Selenium Tests**: Programmatic verification of login screen loading, role tab toggles, blank/empty field validation, invalid login rejects, password visibility toggle, and correct routing.
2. **Beautiful Excel Reporting**: Programmatic compilation of **310 comprehensive compliance test cases** written into `login_test_report.xlsx` with custom typography, spacing, styling, and color-coded status columns (Pass, Fail, Manual).
3. **9 Category Coverage**:
   - Positive Authentication Flow (30 cases)
   - Negative Authentication Flow (60 cases)
   - Boundary & Field Validation (40 cases)
   - UI/UX & Visual Layout (50 cases)
   - Keyboard & Accessibility (30 cases)
   - Security & Sanitization (50 cases)
   - Session & State Management (30 cases)
   - Redirects & Routing Rules (30 cases)
   - Viewports & Responsiveness (10 cases)

---

## Prerequisites
- **Node.js** (v16.0.0 or higher)
- **Google Chrome** browser
- ChromeDriver (Selenium WebDriver automatically resolves drivers for local browsers in newer versions of Node & Selenium, but you can also install/download Chrome driver explicitly if needed).

---

## Setup & Installation

1. Navigate to the `selenium-tests` directory:
   ```bash
   cd selenium-tests
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```
   This will install `selenium-webdriver` and `exceljs` as specified in `package.json`.

---

## Running the Tests

Make sure the backend and frontend servers are running:
1. In the `backend` folder, run `npm run dev` (starts on port 5000).
2. In the `frontend` folder, run `npm run dev` (starts on port 5173).

Then, run the tests inside this directory:
```bash
npm test
```
Or execute it directly using Node:
```bash
node tests/login-tests.js
```

### Automation Fallback Mode
If your local frontend server is offline or if Chrome/chromedriver is not configured on your environment, the script will output a warning describing the missing setup, bypass browser launching gracefully, and **still successfully compile the entire 310 test cases compliance report** (`login_test_report.xlsx`).

---

## Reading the Report
The script generates `login_test_report.xlsx` in the `selenium-tests` directory root.
It contains two sheets:
1. **Summary Dashboard**: A stylized landing page containing executive summary metadata, execution statistics, success rates, and compliance observations.
2. **Test Case Details**: A structured data table mapping all 310 test cases in clear detail, featuring alternate row color banding and green/red/yellow status highlights.
