# Data Selection & Validation Guide

## Overview
This guide walks you through the complete data selection and validation process for forest biometric analysis. The process consists of 4 main steps that ensure your data is properly imported, validated, and cleaned before proceeding to height-diameter modeling.

## Prerequisites
- A project must be created in the system
- Access to forest measurement data in supported database schemas
- Data should include tree measurements (DBH, height, species, location, etc.)

---

## Step 1: Select Schema & Table

### Purpose
Choose the data source (schema and table) containing your forest measurement data.

### What You'll See
- **Previous Data Imports**: If you have existing imports, you'll see a list of completed imports you can continue with
- **Select New Data**: Option to choose a new schema and table combination

### How to Proceed

#### Option A: Continue with Existing Data
1. Review the list of previous successful imports
2. Click on the import you want to continue with
3. The system will automatically select the schema and table
4. Click "Next Step" to proceed

#### Option B: Select New Data Source
1. Click "Select New Data" button
2. **Choose Schema**: 
   - Select from available schemas that contain imported data
   - Use the search box to filter schemas or tables
   - Schemas show the number of available tables
3. **Choose Table**:
   - Select from available tables in the chosen schema
   - The `tree_and_climber` table is recommended if available
   - Other common tables include measurement data, inventory data, etc.
4. Verify your selection appears in the summary box
5. Click "Next Step" to proceed

### Validation Requirements
- Both schema and table must be selected
- Selection cannot be empty
- The "Next Step" button will be enabled only when valid selections are made

---

## Step 2: Import Data

### Purpose
Import the selected data into your analysis project with options for handling existing data.

### What You'll See
- **Selected Data Source**: Confirmation of your schema.table selection
- **Import Action Options**: Choose how to handle existing data
- **Data Preview**: Option to preview data before import
- **Existing Data Detection**: Warning when existing data is found

### Import Actions

#### 1. Append Data (Recommended for first import)
- **What it does**: Adds new data alongside existing records
- **When to use**: First time importing data or adding additional data sources
- **Risk level**: Low - won't affect existing data

#### 2. Replace Selected Schema/Table Only
- **What it does**: Removes data from the same schema/table combination, then adds new data
- **When to use**: Updating data from the same source
- **Risk level**: Medium - affects data from the same source

#### 3. Replace All Data
- **What it does**: Removes ALL existing data from all sources, then adds new data
- **When to use**: Complete data refresh (use with extreme caution)
- **Risk level**: High - affects ALL existing data

### How to Proceed
1. **Preview Data** (Optional):
   - Click "Preview" to see data statistics and sample records
   - Review column information and data quality indicators
   - Confirm the import action in the preview modal
   
2. **Execute Import**:
   - Select your preferred import action
   - Click "Execute Import" button
   - Wait for the import to complete
   - Review the success message and imported row count

3. **Verify Import**:
   - Check the Import History section below
   - Ensure the import status shows "completed"
   - Verify the imported row count matches expectations

### Validation Requirements
- Import must complete successfully OR existing data must be detected
- At least one import must have data (imported_rows > 0)
- The "Next Step" button will be enabled when imports are successful OR when existing data is available

---

## Step 3: Data Quality Check

### Purpose
Perform comprehensive validation to identify data quality issues that need attention.

### What You'll See
- **Quality Check Options**: Choose scope of validation
- **Quality Check Results**: Summary of issues found
- **Issue Categories**: Detailed breakdown by issue type
- **Cancel Button**: Available when running new checks

### Quality Check Options

#### Option 1: Calculate All Data (Default - Recommended)
- **Scope**: Comprehensive validation across all imported data sources
- **Use when**: You want to validate your entire dataset
- **Selection**: No additional selection needed
- **Default**: This option is selected by default

#### Option 2: Check Selected Schema Data
- **Scope**: Validates only data from a specific imported schema/table
- **Use when**: You want to focus on a particular data source
- **Selection required**: Must choose a specific import from the dropdown

### How to Proceed
1. **Choose Scope**:
   - "Calculate All Data" is selected by default (recommended)
   - If choosing "Check Selected Schema Data", pick the specific import to validate
   
2. **Start Quality Check**:
   - Click "Start Quality Check" button
   - Wait for the validation to complete
   - Review the results summary

3. **Review Issues**:
   - Check the total records validated and quality score
   - Review issues by category (Plot Code, Physiography Zone, Tree Number, Species Code, DBH)
   - Click on any issue category to see detailed records

4. **Run New Check** (if needed):
   - Click "Run New Check" to return to the selection view
   - A "Cancel" button will appear to return to the quality summary
   - Use "Cancel" to go back to the quality summary without running a new check

### Issue Categories

#### Plot Code Generation
- **What it checks**: Plot identification and formatting
- **Common issues**: Missing plot columns, invalid plot numbers, format violations
- **Format required**: 0000-0000-000 (4 digits - 4 digits - 3 digits)

#### Physiography Zone Validation
- **What it checks**: Ecological zone classification
- **Valid values**: 1-5 (must be within this range)
- **Common issues**: Null zones, values outside valid range

#### Tree Number Validation
- **What it checks**: Individual tree identification
- **Valid values**: Must be greater than 0
- **Common issues**: Null tree numbers, invalid values

#### Species Code Validation
- **What it checks**: Tree species identification
- **Valid values**: Must match forest species reference table
- **Common issues**: Invalid species codes, codes not in reference table

#### DBH Validation
- **What it checks**: Diameter at breast height measurements
- **Valid values**: Must be greater than 0
- **Common issues**: Null DBH values, invalid measurements

### Resolving Issues
1. **Click on Issue Category**: Opens detailed view of problematic records
2. **Review Records**: See specific records with issues
3. **Individual Corrections**: Edit individual records inline
4. **Bulk Updates**: Select multiple records and update them simultaneously
5. **Ignore Records**: Mark records as ignored if they can't be corrected
6. **Mark as Corrected**: Confirm all issues are resolved

### Validation Requirements
- All quality issues must be resolved (corrected or ignored)
- The "Next Step" button will be enabled only when all issues are addressed
- If you come directly to this step and all issues are already resolved, the "Next" button will be enabled automatically

---

## Step 4: Data Cleaning

### Purpose
Final data preparation and cleaning before proceeding to analysis.

### What You'll See
- **Data Summary**: Overview of total records and ignored records
- **Cleaning Actions**: Available data cleaning operations
- **Records View**: Option to browse and filter all valid records

### Cleaning Actions

#### Remove Ignored Records
- **What it does**: Permanently removes records marked as ignored during quality checks
- **When to use**: After reviewing and confirming ignored records should be removed
- **Impact**: Reduces total record count, improves data quality
- **Note**: This action cannot be undone

#### View All Records
- **What it does**: Browse and filter all valid records in your dataset
- **Use when**: You want to review your cleaned data before analysis
- **Features**: Advanced filtering, pagination, detailed record view

### How to Proceed
1. **Review Data Summary**:
   - Check total records count
   - Note number of ignored records (if any)
   
2. **Remove Ignored Records** (if applicable):
   - Click "Remove" button if you have ignored records
   - Confirm the action
   - Wait for completion
   
3. **View Records** (Optional):
   - Click "View Records" to browse your data
   - Use filters to focus on specific subsets
   - Review data quality and completeness
   
4. **Verify Completion**:
   - Ensure all cleaning actions show as completed
   - Review the "Data Ready for Analysis" confirmation

### Validation Requirements
- All cleaning actions must be completed
- The system will confirm when data is ready for analysis

---

## Moving to Analysis

Once all 4 steps are completed successfully:

1. **Automatic Navigation**: The system will automatically navigate to the Height-Diameter Modeling page
2. **Project Progress**: Your project's current step will be updated to reflect completion
3. **Data Availability**: All cleaned and validated data will be available for analysis

---

## Troubleshooting

### Common Issues

#### Import Failures
- **Check**: Database connectivity and permissions
- **Verify**: Schema and table names are correct
- **Review**: Error messages in the import results

#### Quality Check Errors
- **Check**: Data format and completeness
- **Verify**: Required fields are populated
- **Review**: Reference data (species codes, physiography zones) is available

#### Performance Issues
- **Large Datasets**: Consider using pagination and filters
- **Network**: Check API response times
- **Browser**: Clear cache if experiencing slowdowns

### Getting Help

- **Error Messages**: Read error descriptions carefully
- **Validation Rules**: Review field requirements for each issue type
- **Data Format**: Ensure your data matches expected formats
- **Support**: Contact system administrators for technical issues

---

## Best Practices

### Data Preparation
- **Format Consistency**: Ensure consistent data formats across all records
- **Required Fields**: Populate all mandatory fields before import
- **Data Validation**: Validate data in source systems before import
- **Backup**: Keep backups of original data before major operations

### Import Strategy
- **Start Small**: Begin with smaller datasets to test the process
- **Incremental**: Use append mode for additional data sources
- **Documentation**: Keep records of import actions and data sources
- **Validation**: Always run quality checks after imports

### Quality Management
- **Regular Checks**: Run quality checks after each major data change
- **Issue Resolution**: Address quality issues promptly
- **Documentation**: Document any data corrections or assumptions
- **Review Process**: Establish review process for ignored records

---

## Summary

The data selection and validation process ensures your forest measurement data is:
- ✅ **Properly Imported**: From reliable data sources
- ✅ **Quality Validated**: Against established standards
- ✅ **Issues Resolved**: All problems corrected or documented
- ✅ **Ready for Analysis**: Clean, validated data for modeling

Follow each step carefully, and don't hesitate to review and correct issues as they arise. The time invested in proper data preparation will result in more accurate and reliable analysis results.
