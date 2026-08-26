# Medi Consult - Appium Mobile E2E Test Suite & Compliance Matrix

This directory contains the Appium mobile E2E automation suite and the compliance test case matrix for the **Medi Consult** hybrid mobile application (Capacitor wrapper).

## Features
1. **Automated Mobile Tests**: Programmatic verification of Android emulator connection, launch states, contexts identification (NATIVE vs. WebView), touch gesture taps on tabs, input keyboard fields validation, and dashboard redirections.
2. **Beautiful Excel Reporting**: Programmatic compilation of **310 mobile-specific compliance test cases** written into `appium_test_report.xlsx` with custom purple typography, spacing, and color-coded status columns (Pass, Fail, Manual).
3. **10 Mobile Category Coverage**:
   - Mobile Authentication (30 cases)
   - Negative Authentication (60 cases)
   - Boundary & Field Validation (40 cases)
   - Context Switching & WebView (30 cases)
   - Mobile Gestures & Touch (40 cases)
   - Screen Orientations & Viewports (30 cases)
   - Native Features & Hardware (40 cases)
   - Mobile Security & Cryptography (40 cases)
   - App Lifecycle & Resiliency (20 cases)
   - Appium Driver & Capability Setup (20 cases)

---

## Prerequisites
- **Node.js** (v16.0.0 or higher)
- **Appium Server** installed globally via npm:
  ```bash
  npm install -g appium
  ```
- **Appium UiAutomator2 Driver** (for Android testing):
  ```bash
  appium driver install uiautomator2
  ```
- **Android SDK** (for Android Emulator / physical device debugging)

---

## Building the Mobile Package
To run the automated tests against a built mobile binary, you must sync Capacitor assets and compile the debug APK:
1. In the `frontend` directory:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Build the debug APK via Android Studio or command-line gradlew:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   Ensure the output APK is saved to: `./android/app/build/outputs/apk/debug/app-debug.apk` (or update capabilities path inside `tests/app-tests.js`).

---

## Setup & Installation

1. Navigate to the `appium-tests` directory:
   ```bash
   cd appium-tests
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```
   This will install `webdriverio` and `exceljs` as specified in `package.json`.

---

## Running the Tests

1. Start the Appium Server in a separate terminal:
   ```bash
   appium
   ```

2. Launch your Android Emulator or connect a physical debugging device.

3. Run the tests:
   ```bash
   npm test
   ```
   Or execute directly:
   ```bash
   node tests/app-tests.js
   ```

### Automation Fallback Mode
If your local Appium server is offline or your emulator device isn't configured, the script will output a warning describing the missing setup, bypass device launching gracefully, and **still successfully compile the entire 310 test cases compliance report** (`appium_test_report.xlsx`).

### Locked File Support
If you have the Excel spreadsheet open in Microsoft Excel, the script will automatically bypass the write lock error and output a timestamped backup copy instead (e.g. `appium_test_report_YYYY-MM-DDTHH-MM-SS.xlsx`) so your work is never lost.
