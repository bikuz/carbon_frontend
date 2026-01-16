# Carbon Biomass Calculation Guide

## Overview

The Carbon Biomass Calculation is **Phase 4** of the Forest Biometric Analysis workflow. This phase maps species to allometric equations and calculates biomass and carbon stocks for forest inventory data. The process consists of two main steps: Allometric Equation Assignment and Biomass & Carbon Calculation.

## Purpose

Carbon biomass calculation is essential for:

- **Estimating forest carbon stocks** for climate change reporting
- **Calculating biomass components** (stem, branch, foliage) using species-specific equations
- **Converting biomass to carbon** using standard conversion factors
- **Generating MRV (Measurement, Reporting, and Verification) data** for carbon projects

## Prerequisites

Before starting the carbon biomass calculation, ensure you have completed:

1. **Phase 1**: Data Selection & Validation
2. **Phase 2**: Height-Diameter Modeling
   - Height predictions must be calculated for all trees
   - HD models must be assigned to species-physiography combinations
3. **Phase 3**: Volume Ratio Calculation
   - Volume ratios must be calculated for broken trees
   - All trees must have volume ratio values (1.0 for non-broken trees)

## Phase 4: Carbon Emission Calculation

### Step 1: Assign Allometric Equations

**Purpose**: Map species to allometric equations that will be used to calculate biomass components (stem, branch, foliage).

#### What You'll See

- **Overview Section**: Displays physiography zones with allometric assignment status
- **Zone Cards**: Each physiography zone shows:
  - Zone name and identification number
  - Total tree count (filtered for crown class 1-6, excluding dead/stump trees)
  - Species count
  - Allometric assignment status indicators:
    - ✅ **Green**: Allometric equations assigned (complete)
    - ⚠️ **Orange**: Needs re-assignment or manual assignment
    - ⚪ **Gray**: Not started

#### Tree Selection Criteria

The system automatically filters trees for biomass calculation:
- **Included**: Trees with crown class 1-6 (live and dominant trees)
- **Excluded**: Trees with crown class 7+ (dead, stump, and missing trees)

This ensures only viable trees are included in carbon stock calculations.

#### How to Proceed

1. **Review Zone Overview**
   - Check the physiography zone cards to understand the current assignment status
   - Look for zones that need allometric equation assignment

2. **Automatic Assignment (Recommended)**
   - For zones that haven't been assigned yet, click **"Assign Allometric Equations"** button
   - The system will:
     - Query species in the zone that need allometric equations
     - Match species to existing allometric models based on species code
     - Assign `vol_eqn_id` to tree records
     - Update tree records with allometric equation references

3. **Manual Assignment (For Unassigned Species)**
   - If some species don't have matching allometric equations, click **"Edit Unassigned Species"** button
   - This opens a modal where you can:
     - View all unassigned species for the zone
     - Enter allometric equation parameters for each species:
       - **Density** (wood density in kg/m³) - **Required**
       - **Stem Parameters**: `stem_a`, `stem_b`, `stem_c` (optional)
       - **Top 10% Parameters**: `top_10_a`, `top_10_b` (optional)
       - **Top 20% Parameters**: `top_20_a`, `top_20_b` (optional)
       - **Bark Parameters**: `bark_stem_a`, `bark_stem_b`, etc. (optional)
       - **Branch Parameters**: `branch_s`, `branch_m`, `branch_l` (for small, medium, large trees)
       - **Foliage Parameters**: `foliage_s`, `foliage_m`, `foliage_l` (for small, medium, large trees)
     - Use pagination to navigate through multiple species
     - Filter species by genus or species name
     - Save all changes at once

4. **Verify Assignment**
   - After assignment, the zone cards will update to show:
     - ✅ Green indicators for successfully assigned equations
     - Updated counts for assigned vs unassigned trees
     - `vol_eqn_id` status (trees with volume equation ID)

#### Vol_eqn_id Assignment

The system automatically assigns `vol_eqn_id` to tree records when allometric equations are assigned. This links each tree to its specific allometric equation for volume and biomass calculations.

**Status Indicators**:
- **Complete**: All trees have `vol_eqn_id` assigned
- **Incomplete**: Some trees are missing `vol_eqn_id` assignments
- **Auto-update**: The system automatically updates `vol_eqn_id` assignments when allometric equations are assigned

#### Validation Requirements

- **Allometric Equations Assigned**: All species must have allometric equations assigned
- **Vol_eqn_id Complete**: All trees must have `vol_eqn_id` assigned
- **Next Step Button**: Will be enabled when:
  - Allometric assignment is complete (`allometricAssignmentComplete = true`)
  - Vol_eqn_id assignments are complete (`vol_eqn_ids_complete = true`)

#### Troubleshooting

- **No Data Available**: Click "Refresh Data" to reload physiography zone information
- **Unassigned Species**: Use the "Edit Unassigned Species" modal to manually assign equations
- **Missing Vol_eqn_id**: The system will auto-update `vol_eqn_id` assignments, but you may need to re-run assignment for zones
- **Assignment Failed**: Check that species codes exist in the database and allometric models are available

---

### Step 2: Calculate Biomass & Carbon

**Purpose**: Calculate biomass components (stem, branch, foliage) and convert to carbon stocks using allometric equations.

#### What You'll See

- **Overview Section**: Displays physiography zones ready for biomass calculation
- **Zone Cards**: Each zone shows:
  - Zone name and tree count
  - Species count
  - Allometric assignment status
  - Biomass calculation status:
    - ✅ **Green**: Biomass calculation completed
    - ⚪ **Gray**: Ready for calculation

#### Biomass Calculation Process

The calculation involves 5 main steps:

1. **Height Determination** (`height_use`)
   - If tree is broken (crown_class == 6) and predicted height < measured height: use `height × 1.1`
   - Otherwise, use measured height
   - If no height measured (or < 1.3m): use predicted height (`Pre_ht`)

2. **Expansion Factor Calculation** (`exp_fa`)
   - Scales single tree measurement to hectare basis
   - Based on tree diameter at breast height (dbh):
     - If `dbh < 10 cm` → `exp_fa = 198.94 trees/ha`
     - If `10 cm ≤ dbh < 20 cm` → `exp_fa = 49.74 trees/ha`
     - If `20 cm ≤ dbh < 30 cm` → `exp_fa = 14.15 trees/ha`
     - If `dbh ≥ 30 cm` → `exp_fa = 7.96 trees/ha`

3. **Volume & Stem Biomass Calculation**
   - **Basal Area**: `BA_tree_sqm = (π × dbh²) / 40,000`
   - **Stem Volume**: `volume_cum_tree = exp(Stem_a + Stem_b × log(dbh) + Stem_c × log(height_use)) / 1000`
   - **Max Volume**: `BA_tree_sqm × height_use × 0.7` (form factor)
   - **Volume Correction**: Apply `volume_ratio` based on comparison with max volume
   - **Volume per ha**: `volume_final_cum_tree × exp_fa`
   - **Stem Biomass**: `stem_kg_tree = volume_final_cum_tree × density`
   - **Stem Biomass per ha**: `(stem_kg_tree × exp_fa) / 1000` (in tons/ha)

4. **Branch & Foliage Biomass Calculation**
   - **Branch Ratio**: Interpolate between `branch_s`, `branch_m`, `branch_l` based on dbh
   - **Foliage Ratio**: Interpolate between `foliage_s`, `foliage_m`, `foliage_l` based on dbh
   - **Branch Biomass**: `branch_kg_tree = stem_kg_tree × b_ratio`
   - **Foliage Biomass**: `foliage_kg_tree = stem_kg_tree × f_ratio`

5. **Scale Up to Per-Hectare and Convert to Carbon**
   - **Total Tree Biomass**: `Total_kg_tree = stem_kg_tree + branch_kg_tree + foliage_kg_tree`
   - **Biomass per ha (Air-Dry)**: `Total_biom_ad_ton_ha = (Total_kg_tree × exp_fa) / 1000`
   - **Biomass per ha (Oven-Dry)**: `Total_biom_od_ton_ha = Total_biom_ad_ton_ha / 1.1`
   - **Carbon per ha**: `Carbon_ton_ha = Total_biom_od_ton_ha × 0.47` (47% carbon fraction)
   - **CO₂ Equivalent**: `CO2_ton_ha = Carbon_ton_ha × 3.67` (molecular weight ratio)

#### How to Proceed

1. **Check Zone Readiness**
   - Zones with complete allometric assignments will show as "Ready for biomass calculation"
   - Only zones with all trees having `vol_eqn_id` assigned can proceed

2. **Calculate Biomass by Zone**
   - Click **"Calculate Biomass"** button for individual zones
   - The system will:
     - Process all trees in the zone
     - Calculate biomass components for each tree
     - Aggregate results to hectare basis
     - Convert to carbon stocks
   - A success message will show the total carbon for the zone

3. **Calculate Biomass for All Zones**
   - Alternatively, use the main **"Calculate Biomass and Carbon"** button to process all zones at once
   - This is recommended for smaller datasets

4. **View Results**
   - After successful calculation, the interface will display:
     - **Total Trees**: Number of trees processed
     - **Total Biomass**: Total biomass in tons/ha (oven-dry)
     - **Total Carbon**: Total carbon stock in tons/ha
     - **CO₂ Equivalent**: Carbon dioxide equivalent in tons/ha

5. **Recalculate (If Needed)**
   - If you need to recalculate after updating allometric equations, click **"Recalculate Biomass"** for the zone
   - This will update all calculations with the new parameters

#### Calculation Results Display

After calculation, the system shows:

- **Summary Cards**:
  - Total Trees processed
  - Total Biomass (t/ha)
  - Total Carbon (t/ha)
  - CO₂ Equivalent (t/ha)

- **Zone Status**:
  - Each zone shows completion status
  - Calculated zones can be recalculated or viewed in detail

#### Validation Requirements

- **Allometric Assignment Complete**: Step 1 must be completed first
- **Vol_eqn_id Complete**: All trees must have `vol_eqn_id` assigned
- **Biomass Calculation Complete**: All zones must show successful calculation
- **Next Step Button**: Will be enabled when biomass calculation is complete for all zones

#### Troubleshooting

- **No Trees Found**: Ensure allometric equations are properly assigned in Step 1
- **Calculation Errors**: Check that all required allometric parameters are provided
- **Missing Vol_eqn_id**: Re-run allometric assignment to update `vol_eqn_id` values
- **Partial Completion**: Re-run biomass calculation for zones that failed

---

## Exporting Results

Once the analysis is complete, you can download the detailed results.

1. **Export Tree Biometric Calc Data**
   - On the Carbon Calculation page, after biomass calculation is complete, click **"Export Tree Biometric Calc (CSV)"** button
   - A file named `tree_biometric_calc_[project_name].csv` will download
   - This file contains tree-level data including:
     - Tree identification (plot, tree number, species)
     - Measured and predicted heights
     - Volume calculations
     - Biomass components (stem, branch, foliage)
     - Carbon stocks per tree and per hectare
     - Allometric equation references

2. **Data Columns in Export**
   - Tree identification fields
   - Height measurements (measured, predicted, calculated)
   - DBH and other tree measurements
   - Volume calculations (with ratios)
   - Biomass components (stem, branch, foliage in kg/tree and tons/ha)
   - Carbon stocks (carbon per tree and per hectare)
   - Expansion factors
   - Allometric equation IDs

---

## Navigation and Progress Tracking

### Step Navigation

- **Previous Phase Button**: Navigate back to Phase 3 (Volume Ratio Calculation)
- **Next Step Button**: 
  - **Disabled** (gray): When current step requirements are not met
  - **Enabled** (green): When all validation requirements are satisfied
  - **Text Changes**: Based on current step and completion status:
    - "Complete Allometric Assignment to Continue"
    - "Complete Vol Eqn ID Assignment to Continue"
    - "Complete Biomass Calculation to Continue"
    - "Next Step" (when ready)
    - "Analysis Complete!" (when all steps done)

### Progress Indicators

- **Step Overview**: Visual progress bar showing current step (1 of 2, 2 of 2)
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

1. **Allometric Assignment**:
   - `GET /api/mrv/projects/{id}/allometric-assignment/status/` - Get assignment status
   - `POST /api/mrv/projects/{id}/allometric-assignment/` - Assign equations for a zone
   - `POST /api/mrv/projects/{id}/save-allometric-assignments/` - Save manual assignments

2. **Biomass Calculation**:
   - `POST /api/mrv/projects/{id}/biomass-calculation/` - Calculate biomass and carbon
   - `GET /api/mrv/projects/{id}/biomass-calculation/status/` - Check calculation status

3. **Export**:
   - `GET /api/mrv/projects/{id}/export/tree-biometric-calc/` - Export tree biometric calc data

### Database Schema

**Key Tables**:
- `tree_biometric_calc`: Main tree data table with calculated biomass and carbon
- `allometric_models`: Allometric equation definitions
- `forest_species`: Species reference data
- `physiography`: Physiography zone reference data

**Key Columns in `tree_biometric_calc`**:
- `vol_eqn_id`: Allometric equation identifier
- `height_use`: Height used for calculations
- `exp_fa`: Expansion factor (trees per hectare)
- `volume_final_cum_tree`: Final tree volume (m³)
- `stem_kg_tree`: Stem biomass per tree (kg)
- `branch_kg_tree`: Branch biomass per tree (kg)
- `foliage_kg_tree`: Foliage biomass per tree (kg)
- `Total_biom_ad_ton_ha`: Total biomass per hectare (air-dry, tons)
- `Total_biom_od_ton_ha`: Total biomass per hectare (oven-dry, tons)
- `Carbon_ton_ha`: Carbon stock per hectare (tons)
- `CO2_ton_ha`: CO₂ equivalent per hectare (tons)

---

## Best Practices

### Data Quality

1. **Verify Allometric Assignments**: Ensure all species have appropriate allometric equations assigned
2. **Check Parameter Values**: Validate that density and equation parameters are reasonable for each species
3. **Review Calculation Results**: Check that biomass and carbon values are within expected ranges
4. **Validate Vol_eqn_id**: Ensure all trees have `vol_eqn_id` assigned before proceeding to Step 2

### Performance Optimization

1. **Zone-by-Zone Processing**: For large datasets, process zones individually to monitor progress
2. **Batch Assignment**: Use automatic assignment when possible to speed up the process
3. **Error Handling**: Review error messages and address data quality issues before recalculating

### Troubleshooting Common Issues

1. **Missing Allometric Equations**: 
   - Check if species codes match allometric model database
   - Manually assign equations using the modal interface
   - Verify that required parameters (density, stem_a, stem_b) are provided

2. **Vol_eqn_id Assignment Issues**:
   - Re-run allometric assignment for affected zones
   - Check that allometric models are properly linked to species
   - Verify database constraints and foreign key relationships

3. **Calculation Errors**:
   - Ensure all required fields (dbh, height, volume_ratio) are present
   - Check that allometric parameters are valid numbers
   - Verify expansion factor calculations are correct

4. **Data Inconsistencies**:
   - Review tree selection criteria (crown class filtering)
   - Check for null or invalid values in required fields
   - Validate volume ratio values (should be 0-1 range)

---

## Technical Details

### Allometric Equation Format

Allometric equations use the following format for stem volume:

```
volume = exp(Stem_a + Stem_b × log(dbh) + Stem_c × log(height)) / 1000
```

Where:
- `Stem_a`, `Stem_b`, `Stem_c`: Species-specific parameters
- `dbh`: Diameter at breast height (cm)
- `height`: Tree height (m)

### Biomass Component Calculations

1. **Stem Biomass**:
   ```
   stem_kg_tree = volume_final_cum_tree × density
   ```

2. **Branch Biomass**:
   ```
   branch_ratio = interpolate(branch_s, branch_m, branch_l, dbh)
   branch_kg_tree = stem_kg_tree × branch_ratio
   ```

3. **Foliage Biomass**:
   ```
   foliage_ratio = interpolate(foliage_s, foliage_m, foliage_l, dbh)
   foliage_kg_tree = stem_kg_tree × foliage_ratio
   ```

### Carbon Conversion Factors

- **Air-Dry to Oven-Dry**: Divide by 1.1 (10% moisture content)
- **Biomass to Carbon**: Multiply by 0.47 (47% carbon fraction)
- **Carbon to CO₂**: Multiply by 3.67 (molecular weight ratio: 44/12)

### Expansion Factor Logic

Expansion factors are based on tree diameter classes to account for different sampling intensities:

- **Small trees** (dbh < 10 cm): Higher expansion factor (198.94 trees/ha)
- **Medium trees** (10-30 cm): Moderate expansion factors (49.74, 14.15 trees/ha)
- **Large trees** (dbh ≥ 30 cm): Lower expansion factor (7.96 trees/ha)

This reflects the typical sampling design where larger trees are measured more intensively.

---

## Next Steps

After completing Phase 4 (Carbon Emission Calculation):

1. **Review Results**: Export and review the tree biometric calc data
2. **Quality Assurance**: Verify calculation results against expected values
3. **Documentation**: Document any manual assignments or special cases
4. **Reporting**: Use the results for MRV reporting and carbon project documentation

The system will automatically track completion status and allow navigation to the next phase when all steps are completed successfully.

---

## Related Documentation

- [Data Selection Guide](data-selection-guide.md)
- [Height Prediction Guide](height-prediction-guide.md)
- [Volume Ratio Guide](volume-ratio-guide.md)
- [User Manual](User_Manual.md)

---

*This guide covers the complete carbon biomass calculation process in the Forest Biometric Analysis system. Each step builds upon the previous phases, ensuring data quality and process integrity throughout the analysis workflow.*
