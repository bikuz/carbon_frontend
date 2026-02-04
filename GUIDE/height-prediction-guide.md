# Height Prediction Calculation Guide

## Overview

This guide provides a comprehensive step-by-step walkthrough of the Height-Diameter (HD) Modeling process in the Carbon Forest Analysis system. The process consists of three main steps: HD Model Assignment, Height Prediction, and Slanted Height Calculation.

## Prerequisites

Before starting the height prediction process, ensure that:
- ✅ **Phase 1 (Data Selection & Validation)** has been completed
- ✅ Data has been imported and quality issues have been resolved
- ✅ Project schema exists with `tree_biometric_calc` table populated
- ✅ Forest species and physiography data are available in the system

## Phase 2: Height-Diameter Modeling

### Step 1: Assign HD Models

**Purpose**: Assign appropriate Height-Diameter models to each species in each physiography zone.

#### What You'll See

- **Overview Section**: Displays physiography zones with tree counts and HD model assignment status
- **Zone Cards**: Each physiography zone shows:
  - Zone name and number
  - Total tree count
  - Species count
  - Assigned HD model count (green)
  - Unassigned HD model count (amber)
  - Unassigned species count (red)

#### How to Proceed

1. **Review Zone Overview**
   - Check the physiography zone cards to understand the current assignment status
   - Look for zones with unassigned HD models (amber indicators)

2. **Automatic Assignment (Recommended)**
   - Click **"Assign All Models"** button to automatically assign HD models based on existing species-HD model mappings
   - This process uses the `species_hd_model_map` table to assign models based on species code and physiography zone

3. **Manual Assignment (If Needed)**
   - For zones with unassigned species, click **"Update species-HD model"** button
   - This opens a modal where you can:
     - Select HD models for each species
     - Enter model parameters (a, b, c values)
     - Save the mappings

4. **Verify Assignment**
   - After assignment, the zone cards will update to show:
     - ✅ Green indicators for successfully assigned models
     - Updated counts for assigned vs unassigned trees

#### Validation Requirements

- **Data Loaded**: Physiography zone data must be loaded
- **Models Assigned**: Either automatic assignment successful OR manual mappings saved
- **Next Step Button**: Will be enabled when HD models are assigned to trees

#### Troubleshooting

- **No Data Available**: Click "Refresh Data" to reload physiography zone information
- **Unassigned Species**: Use the "Update species-HD model" modal to manually assign models
- **Assignment Failed**: Check that species codes exist in the `forest_species` table

---

### Step 2: Predict Tree Heights

**Purpose**: Generate height predictions for all trees using their assigned HD models.

#### What You'll See

- **Overview Section**: Displays physiography zones with height prediction status
- **Zone Cards**: Each zone shows:
  - Zone name and tree count
  - Species count and assigned HD model count
  - Height prediction status with appropriate indicators:
    - ✅ **Green**: Height prediction successful
    - ⚠️ **Orange**: Height prediction partially completed
    - ⚠️ **Amber**: Height prediction not yet completed

#### How to Proceed

1. **Check Current Status**
   - The system automatically checks height prediction status for all zones
   - Look for zones that need height prediction (amber indicators)

2. **Run Height Prediction**
   - Click **"Run Height Prediction"** button for zones that need processing
   - The system will:
     - Query trees with assigned HD models and valid DBH values
     - Apply HD model expressions using species-specific parameters
     - Update the `height_predicted` column in the database

3. **View Results**
   - After successful prediction, zones will show:
     - ✅ Green "Height prediction successful" indicator
     - **"View H-D Relation"** button to visualize the height-diameter relationship

4. **Handle Partial Results**
   - If some trees failed prediction, the zone will show orange indicators
   - Click **"Re-run Height Prediction"** to process remaining trees

#### Technical Details

**HD Model Calculation Process**:
1. **Data Selection**: Trees with `hd_model_code IS NOT NULL` and `dbh > 0`
2. **Expression Evaluation**: Uses SymPy to parse and evaluate HD model expressions
3. **Parameter Application**: Uses species-specific parameters (a, b, c) from `species_hd_model_map`
4. **Height Calculation**: Applies formula: `height = expression(dbh, a, b, c, bh)`
5. **Database Update**: Updates `height_predicted` column for each tree

**Supported HD Model Types**:
- Linear models: `a + b * d`
- Logarithmic models: `a + b * log(d)`
- Power models: `a * d^b`
- Complex expressions with multiple parameters

#### Validation Requirements

- **HD Models Assigned**: All trees must have assigned HD models
- **Height Prediction Complete**: All zones must show successful height prediction
- **Next Step Button**: Will be enabled when height prediction is complete for all zones

#### Troubleshooting

- **No Trees Found**: Ensure HD models are properly assigned in Step 1
- **Expression Errors**: Check HD model expressions and parameters in the database
- **Partial Completion**: Re-run height prediction to process remaining trees

---

### Step 3: Slanted Tree Height Calculation

**Purpose**: Calculate corrected heights for trees that are not perfectly vertical using the Pythagorean theorem.

#### What You'll See

- **Overview Section**: Displays physiography zones with slanted height calculation status
- **Zone Cards**: Each zone shows:
  - Zone name and tree count
  - Species count
  - Slanted trees count (when available)
  - Calculation status with appropriate indicators:
    - ✅ **Green**: Slanted height calculation successful
    - ⚠️ **Orange**: Slanted height calculation partially completed
    - ⚠️ **Amber**: Slanted height calculation not yet completed

#### How to Proceed

1. **Check Current Status**
   - The system automatically checks slanted height calculation status for all zones
   - Look for zones that need slanted height calculation (amber indicators)

2. **Run Slanted Height Calculation**
   - Click **"Calculate Slanted Heights"** button for zones that need processing
   - The system will:
     - Identify trees that meet the calculation criteria
     - Apply the Pythagorean formula to calculate corrected heights
     - Update the `heigth_calculated` column in the database

3. **View Results**
   - After successful calculation, zones will show:
     - ✅ Green "Slanted height calculation successful" indicator
     - Count of trees processed

4. **Handle Partial Results**
   - If some trees failed calculation, the zone will show orange indicators
   - Click **"Re-run Slanted Height Calculation"** to process remaining trees

#### Technical Details

**Calculation Criteria**:
- Trees must have `height > 0`
- Trees must have `crown_class < 6` (excludes dead/broken trees)
- Trees must not already have `heigth_calculated` value

**Pythagorean Formula**:
```
corrected_height = √(height² + base_tree_height²)
```

Where:
- `height`: Original measured height
- `base_tree_height`: Height from ground to measurement point (null/negative values treated as 0)

**Database Updates**:
- Updates `heigth_calculated` column with the corrected height
- Updates `updated_date` timestamp

#### Validation Requirements

- **Height Prediction Complete**: Step 2 must be completed first
- **Slanted Height Calculation Complete**: All zones must show successful calculation
- **Next Step Button**: Will be enabled when slanted height calculation is complete for all zones

#### Troubleshooting

- **No Trees Found**: Ensure trees have valid height measurements and appropriate crown class
- **Calculation Errors**: Check that height and base_tree_height values are valid numbers
- **Partial Completion**: Re-run slanted height calculation to process remaining trees

---

## Navigation and Progress Tracking

### Step Navigation

- **Previous Button**: Navigate back to the previous step
- **Next Step Button**: 
  - **Disabled** (gray): When current step requirements are not met
  - **Enabled** (green): When all validation requirements are satisfied
  - **Text Changes**: Based on current step and completion status

### Progress Indicators

- **Step Overview**: Visual progress bar showing current step (1 of 3, 2 of 3, 3 of 3)
- **Zone Status**: Real-time status updates for each physiography zone
- **Completion Tracking**: Automatic detection of completed steps for seamless navigation

### URL Parameters

The system preserves project context through URL parameters:
- `?project={project_id}`: Project identifier
- `&name={project_name}`: Project name (URL encoded)

These parameters are maintained when navigating between steps and phases.

---

## Data Flow and API Endpoints

### Key API Endpoints

1. **HD Model Assignment**:
   - `GET /api/mrv/projects/{id}/hd-model/physiography-summary/` - Get zone summary
   - `POST /api/mrv/projects/{id}/hd-model/assign-models/` - Assign models automatically
   - `POST /api/mrv/projects/{id}/hd-model/update-species-mapping/` - Update manual mappings

2. **Height Prediction**:
   - `POST /api/mrv/projects/{id}/height-prediction/` - Run height prediction
   - `GET /api/mrv/projects/{id}/height-prediction/status/` - Check prediction status
   - `GET /api/mrv/projects/{id}/hd-relation/data/` - Get H-D relation data

3. **Slanted Height Calculation**:
   - `POST /api/mrv/projects/{id}/slanted-height-calculation/` - Run slanted height calculation
   - `GET /api/mrv/projects/{id}/slanted-height-calculation/status/` - Check calculation status

### Database Schema

**Key Tables**:
- `tree_biometric_calc`: Main tree data table
- `species_hd_model_map`: Species-HD model mappings
- `hd_model`: HD model definitions and expressions
- `forest_species`: Species reference data
- `physiography`: Physiography zone reference data

**Key Columns**:
- `hd_model_code`: Assigned HD model identifier
- `height_predicted`: Predicted height from HD model
- `heigth_calculated`: Corrected height for slanted trees
- `dbh`: Diameter at breast height
- `height`: Original measured height
- `base_tree_height`: Height from ground to measurement point

---

## Best Practices

### Data Quality

1. **Verify HD Model Assignments**: Ensure all species have appropriate HD models assigned
2. **Check Model Parameters**: Validate that a, b, c parameters are reasonable for each species
3. **Review Height Predictions**: Use the H-D relation visualization to verify prediction quality
4. **Validate Slanted Heights**: Ensure corrected heights are reasonable for the tree species

### Performance Optimization

1. **Batch Processing**: The system processes all trees in a zone simultaneously
2. **Error Handling**: Failed calculations are logged and can be retried
3. **Status Monitoring**: Real-time status updates prevent unnecessary reprocessing

### Troubleshooting Common Issues

1. **Missing HD Models**: Check species-HD model mappings in the database
2. **Expression Errors**: Verify HD model expressions are valid mathematical formulas
3. **Parameter Issues**: Ensure a, b, c parameters are appropriate for the model type
4. **Data Inconsistencies**: Check for null or invalid values in required fields

---

## Next Steps

After completing Phase 2 (Height-Diameter Modeling):

1. **Phase 3**: Volume Ratio Calculation
2. **Phase 4**: Carbon Estimation Calculation

The system will automatically navigate to the next phase when all steps in the current phase are completed successfully.

---

## Support and Documentation

For additional support:
- Check the system logs for detailed error messages
- Review the API documentation for endpoint details
- Contact the development team for technical issues

This guide covers the complete height prediction calculation process. Each step builds upon the previous one, ensuring data quality and process integrity throughout the analysis workflow.
