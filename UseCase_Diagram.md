# Forest Biometric Analysis System - Use Case Diagram

## Use Case Diagram (Mermaid)

```mermaid
graph TB
    User[Forest Analyst]
    
    subgraph System["Forest Biometric Analysis System"]
        subgraph DataMgmt["Data Management Inventory"]
            UC1[UC1: Import Foris Data Schema]
            UC2[UC2: Merge Schemas]
            UC3[UC3: View Schema Dashboard]
            UC4[UC4: Delete Schema]
            UC5[UC5: Search/Filter Schemas]
        end
        
        subgraph ProjMgmt["Project Management"]
            UC6[UC6: Create Analysis Project]
            UC7[UC7: Edit Project]
            UC8[UC8: Delete Project]
            UC9[UC9: Select/Continue Project]
            UC10[UC10: View Project Progress]
        end
        
        subgraph Phase1["Phase 1: Data Selection & Validation"]
            UC11[UC11: Select Schema & Table]
            UC12[UC12: Import Data to Project]
            UC13[UC13: Data Quality Check]
            UC14[UC14: Resolve Data Issues]
            UC15[UC15: Data Cleaning]
        end
        
        subgraph Phase2["Phase 2: Height-Diameter Modeling"]
            UC16[UC16: Assign HD Models]
            UC17[UC17: Predict Tree Heights]
            UC18[UC18: Validate HD Models]
            UC19[UC19: Calculate Slanted Heights]
        end
        
        subgraph Phase3["Phase 3: Volume Ratio Calculation"]
            UC20[UC20: Calculate Volume Ratios]
            UC21[UC21: Handle Broken Trees]
            UC22[UC22: Apply Taper Functions]
        end
        
        subgraph Phase4["Phase 4: Carbon Estimation Calculation"]
            UC23[UC23: Assign Allometric Equations]
            UC24[UC24: Calculate Biomass]
            UC25[UC25: Calculate Carbon Stocks]
            UC26[UC26: Export Results]
        end
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    User --> UC16
    User --> UC17
    User --> UC18
    User --> UC19
    User --> UC20
    User --> UC21
    User --> UC22
    User --> UC23
    User --> UC24
    User --> UC25
    User --> UC26
    
    UC6 -.->|includes| UC11
    UC11 -.->|includes| UC12
    UC12 -.->|includes| UC13
    UC13 -.->|includes| UC14
    UC14 -.->|includes| UC15
    UC15 -.->|includes| UC16
    UC16 -.->|includes| UC17
    UC17 -.->|includes| UC18
    UC18 -.->|includes| UC20
    UC20 -.->|includes| UC21
    UC21 -.->|includes| UC22
    UC22 -.->|includes| UC23
    UC23 -.->|includes| UC24
    UC24 -.->|includes| UC25
    UC25 -.->|includes| UC26
    
    UC1 -.->|extends| UC3
    UC2 -.->|extends| UC3
    UC9 -.->|includes| UC10
    
    style User fill:#e1f5ff
    style DataMgmt fill:#fff4e6
    style ProjMgmt fill:#e8f5e9
    style Phase1 fill:#f3e5f5
    style Phase2 fill:#e3f2fd
    style Phase3 fill:#fff3e0
    style Phase4 fill:#e0f2f1
```

## Use Case Descriptions

### Data Management (Inventory)

- **UC1: Import Foris Data Schema** - Upload SQL zip files containing forest inventory data from Foris database schemas
- **UC2: Merge Schemas** - Combine multiple database schemas into a single merged schema
- **UC3: View Schema Dashboard** - View all imported and merged schemas with their details
- **UC4: Delete Schema** - Remove a schema and all its associated data
- **UC5: Search/Filter Schemas** - Search and filter schemas by name, type, or other criteria

### Project Management

- **UC6: Create Analysis Project** - Create a new forest biometric analysis project with name and description
- **UC7: Edit Project** - Modify project name and details
- **UC8: Delete Project** - Permanently delete a project and all its analysis data
- **UC9: Select/Continue Project** - Select an existing project to continue work
- **UC10: View Project Progress** - View the current phase and step progress of a project

### Phase 1: Data Selection & Validation

- **UC11: Select Schema & Table** - Choose the data source (schema and table) for analysis
- **UC12: Import Data to Project** - Import selected data into the analysis project with options for handling existing data
- **UC13: Data Quality Check** - Validate data quality including Plot Codes, Physiography Zones, Tree Numbers, Species Codes, and DBH
- **UC14: Resolve Data Issues** - Correct or ignore identified data quality issues
- **UC15: Data Cleaning** - Remove ignored records to prepare data for analysis

### Phase 2: Height-Diameter Modeling

- **UC16: Assign HD Models** - Assign species-specific height-diameter models based on species and physiography zones
- **UC17: Predict Tree Heights** - Predict tree heights for trees with missing or invalid height measurements
- **UC18: Validate HD Models** - Validate the accuracy of height-diameter models
- **UC19: Calculate Slanted Heights** - Calculate corrected heights for slanted tree measurements

### Phase 3: Volume Ratio Calculation

- **UC20: Calculate Volume Ratios** - Calculate volume ratios for broken trees using taper functions
- **UC21: Handle Broken Trees** - Process trees with broken tops to correct biomass estimates
- **UC22: Apply Taper Functions** - Apply Fibonacci taper functions to determine remaining volume in damaged trees

### Phase 4: Carbon Estimation Calculation

- **UC23: Assign Allometric Equations** - Assign allometric equations to species for biomass calculation
- **UC24: Calculate Biomass** - Calculate tree biomass components (stem, branch, and foliage)
- **UC25: Calculate Carbon Stocks** - Estimate carbon stocks and CO2 equivalent from biomass
- **UC26: Export Results** - Export analysis results and calculated data to CSV format

## Relationships

- **Includes**: A use case that must be completed as part of another use case
- **Extends**: A use case that optionally extends another use case
- **Workflow**: The sequential flow from Phase 1 through Phase 4 represents the main analysis workflow
