# User Manual: Forest Biometric Analysis System

## Introduction
The **Forest Biometric Analysis System** is a comprehensive web-based platform designed for analyzing forest inventory data. It automates the complex process of estimating carbon stocks through advanced biometric modeling and statistical analysis.

This manual references the "Analysis Workflow" which consists of four key phases:
1.  **Data Selection & Validation**
2.  **Height-Diameter Modelling**
3.  **Volume Ratio Calculation**
4.  **Carbon Emission Calculation**

---

## Getting Started

### Accessing the System
1.  Open your web browser.
2.  Navigate to the application URL (e.g., `http://localhost:5173` or your deployed URL).
3.  You will land on the **Home Dashboard**.

![Screenshot: Home Dashboard showing "Welcome to Forest Biometric Analysis System" with buttons for "Import Forest Data" and "Start Analysis"]

### Dashboard Overview
The dashboard provides quick access to the main administrative and analytical tools:
*   **Import Forest Data**: Calculate and manage raw inventory data.
*   **Start Analysis**: Begin the Measurement, Reporting, and Verification (MRV) workflow.

---

## Module 1: Data Management (Inventory)

Before analysis, you must import your forest inventory data (usually from Foris database schemas).

1.  From the Home Dashboard, click **Import Forest Data** (or navigate to `/inventory/import`).
2.  You will see the **Foris Data Import** section.
3.  **Upload Data**:
    *   Click **Choose zip file** and select your `.zip` file containing the SQL data.
    *   The system will analyze the file.
4.  **Confirm Import**:
    *   If the schema already exists, you will be asked to replace it.
    *   If it is new, you may be prompted to enter a schema name.
5.  **Completion**:
    *   A success message will appear: "Import completed successfully!"

![Screenshot: Inventory Import page showing the file upload area and a success message]

---

## Module 2: Forest Biometric Analysis (MRV)

This is the core function of the application. To begin, click **Start Analysis** from the home page.

### Phase 1: Data Selection & Validation
*Objective: Select the specific project or dataset, validate it, and clean it for analysis.*

#### Step 1: Select Schema & Table
1.  **Choose Data Source**:
    *   **Continue with Existing**: If available, select a previous import from the list.
    *   **Select New Data**: Choose a Schema and Table (e.g., `tree_and_climber`) from the dropdowns.
2.  **Verify**: Ensure your selection appears in the summary box.
3.  Click **Next Step**.

![Screenshot: Data Selection screen showing Schema and Table dropdowns and summary box]

#### Step 2: Import Data
1.  **Select Import Action**:
    *   *Append Data*: Adds new data (Safe).
    *   *Replace Selected Schema*: Updates data from specific source.
    *   *Replace All Data*: Clears everything and imports new (Caution).
2.  **Preview** (Optional): Click "Preview" to check column quality.
3.  **Execute**: Click **Execute Import** and wait for the "Completed" status.

![Screenshot: Data Import validation screen with Import Actions and Import History]

#### Step 3: Data Quality Check
1.  **Choose Scope**: "Calculate All Data" is recommended.
2.  **Run Check**: Click **Start Quality Check**.
3.  **Review Issues**: The system validates Plot Codes, Physiography Zones, Tree Numbers, Species Codes, and DBH.
4.  **Resolve**: Click on issue categories to edit or ignore problematic records. All issues must be resolved (Corrected or Ignored) to proceed.

![Screenshot: Quality Check dashboard showing issue categories and quality score]

#### Step 4: Data Cleaning
1.  **Review Summary**: Check the count of "Ignored" records.
2.  **Clean**: Click **Remove Ignored Records** to permanently delete them from the workspace.
3.  **Completion**: The system will confirm "Data Ready for Analysis".

![Screenshot: Data Cleaning screen with "Remove" button and final record counts]

---

### Phase 2: Height-Diameter Modelling
*Objective: Predict tree heights for missing measurements using species-specific models.*

#### Step 1: Assign HD Models
1.  **Review Zones**: Check the cards for "Unassigned Species".
2.  **Auto Assignment**: Click **Assign All Models** to map known species automatically.
3.  **Manual Assignment**:
    *   Click **Update species-HD model** for zones with unassigned species.
    *   In the modal, select the generic HD Model (e.g., specific curve) and enters parameters (a, b, c).
    *   Click **Save Changes**.
4.  **Verify**: Ensure "Unassigned" count is 0.

![Screenshot: HD Model active assignment screen with Physiography Zone cards]

![Screenshot: Manual HD Model Assignment Modal]

#### Step 2: Predict Tree Heights
1.  **Check Status**: Look for Amber/Orange indicators on Zone cards.
2.  **Run Prediction**: Click **Run Height Prediction** for specific zones or all.
3.  **Result**: The system applies the models. Success is indicated by Green checkmarks.
4.  **Visualize**: Click "View H-D Relation" to see the curve (optional).

![Screenshot: Height Prediction status screen with "Run Prediction" buttons]

#### Step 3: Slanted Tree Height Calculation
1.  **Run Calculation**: Click **Calculate Slanted Heights**.
    *   This applies the Pythagorean theorem to correct heights for leaking trees (`crown_class < 6`).
2.  **Completion**: All zones should show Green status.
3.  Click **Continue to Volume Ratio** when enabled.

![Screenshot: Slanted Height Calculation overview]

---

### Phase 3: Volume Ratio Calculation
*Objective: Calculate volume ratios for broken trees (broken top, crown class 6).*

1.  **Overview**: Review the "Broken Trees" vs "Non-Broken Trees" counts per zone.
2.  **Calculate**:
    *   **Zone-by-Zone**: Click **Calculate Volume Ratio** on individual zone cards.
    *   **Batch**: Use a "Calculate All" option if available.
3.  **Process**:
    *   The system uses Fibonacci taper functions.
    *   **Case 1**: Normal broken tree (Measured < Predicted).
    *   **Case 2**: Unusual (Measured > Predicted).
    *   **Case 3**: Missing height.
4.  **Review**: Check the results summary (Case breakdown) and ensure 0 errors.

![Screenshot: Volume Ratio Calculation screen showing broken tree counts and calculation status]

---

### Phase 4: Carbon Emission Calculation
*Objective: Map allometric equations and calculate final biomass/carbon stocks.*

#### Step 1: Assign Allometric Equations
1.  **Assign**: Click **Assign Allometric Equations** (or **Assign Equations**) for each zone.
2.  **Edit Unassigned**: If species are missing equations:
    *   Click **Edit Unassigned Species**.
    *   Enter **Wood Density** (Required).
    *   Enter Stem, Bark, Branch, and Foliage parameters as needed.
    *   Save assignments.
3.  **Verify**: Ensure `allometricAssignmentComplete` and `vol_eqn_ids_complete` are true (Green indicators).

![Screenshot: Allometric Equation Assignment overview with Zone Cards]

![Screenshot: Allometric Equation Edit Modal]

#### Step 2: Biomass & Carbon Calculation
1.  **Calculate**: Click **Calculate Biomass** for each zone or **Calculate Biomass and Carbon** for all.
2.  **Wait**: The system calculates Stem, Branch, and Foliage biomass, then converts to Carbon (tons/ha) and CO2e.
3.  **Results**:
    *   **Total Biomass (t/ha)**
    *   **Total Carbon (t/ha)**
    *   **CO2 Equivalent (t/ha)**

![Screenshot: Final Biomass and Carbon Calculation results dashboard]

---

## Exporting Results

Once analysis is complete, you can download the detailed datasets.

1.  Navigate to the **Carbon Emission Calculation** page (Phase 4).
2.  Click the **Export Tree Biometric Calc (CSV)** button.
3.  A file named `tree_biometric_calc_[project_name].csv` will download.
    *   **Contents**: Tree-level data, predicted heights, volume ratios, biomass components, and carbon stocks.

![Screenshot: Export button on the final Analysis screen]
