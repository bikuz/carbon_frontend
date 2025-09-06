# Volume Ratio Calculation Guide

## Overview

The Volume Ratio Calculation is **Phase 3** of the Forest Biometric Analysis workflow. This phase calculates volume ratios for broken trees using Fibonacci taper functions to determine the proportion of volume remaining in trees with broken tops.

## Purpose

Volume ratio calculation is essential for accurate biomass and carbon estimation because:

- **Broken trees** have reduced volume compared to intact trees
- **Volume ratios** provide a correction factor for biomass calculations
- **Accurate ratios** ensure precise carbon emission calculations in the final phase

## Prerequisites

Before running volume ratio calculations, ensure you have completed:

1. **Phase 1**: Data Selection & Validation
2. **Phase 2**: Height-Diameter Modeling
   - Height predictions must be calculated for all trees
   - HD models must be assigned to species-physiography combinations

## Volume Ratio Calculation Process

### Step 1: Isolate Broken Trees

The system filters the dataset to identify broken trees:
- **Filter criteria**: `crown_class = 6`
- **Crown class 6** indicates trees with broken tops
- Only broken trees require volume ratio calculations

### Step 2: Calculate Volume Ratio

The system applies different calculation logic based on three cases:

#### Case 1: Normal Broken Tree
**Condition**: `measured_height < predicted_height`

**Process**:
1. Calculate full tree volume (`vol_p`) using predicted height
2. Calculate broken tree volume (`vol_m`) using measured height
3. Calculate volume ratio: `vol_r = vol_m / vol_p`

**Example**:
- Predicted height: 25m
- Measured height: 18m
- Volume ratio: ~0.72 (72% of original volume remains)

#### Case 2: Unusual Case
**Condition**: `measured_height >= predicted_height`

**Note**: This is unusual and suggests measurement error or data quality issues.

**Process**:
1. Assume true unbroken height was 10% taller than measured height
2. Calculate full tree volume (`vol_p`) using assumed height (`height_m * 1.1`)
3. Calculate broken tree volume (`vol_m`) using measured height
4. Calculate volume ratio: `vol_r = vol_m / vol_p`

**Example**:
- Measured height: 30m
- Predicted height: 25m
- Assumed full height: 33m (30m × 1.1)
- Volume ratio: ~0.85 (85% of assumed full volume)

#### Case 3: No Measured Height
**Condition**: `measured_height == 0` or `NULL`

**Note**: Field crew didn't measure the height of the broken tree.

**Process**:
1. Calculate full tree volume (`vol_p`) using predicted height
2. Assume tree broke at 90% of predicted height (`height_p * 0.9`)
3. Calculate broken tree volume (`vol_m`) using assumed broken height
4. Calculate volume ratio: `vol_r = vol_m / vol_p`

**Example**:
- Predicted height: 25m
- Assumed broken height: 22.5m (25m × 0.9)
- Volume ratio: ~0.85 (85% of predicted volume)

### Step 3: Non-Broken Trees

For trees that are not broken (`crown_class ≠ 6`):
- **Volume ratio = 1.0**
- No volume reduction applied

## Technical Implementation

### Fibonacci Taper Function

The system uses a Fibonacci taper function to calculate tree volumes:

```python
def fibonacci(x_m, a_par, b_par):
    """
    Calculates relative diameter at given relative height
    using Fibonacci taper function parameters
    """
    Pb = ((a_par[0] + b_par[0]) * x_m +
          (a_par[1] + b_par[1]) * (x_m ** 2) +
          (a_par[2] + b_par[2]) * (x_m ** 3) +
          b_par[3] * (x_m ** 5) +
          b_par[4] * (x_m ** 8) +
          b_par[5] * (x_m ** 13) +
          b_par[6] * (x_m ** 21) +
          b_par[7] * (x_m ** 34))
    return Pb
```

### Volume Calculation

```python
def v_taper(d13, ht, ht_x, a_par, b_par, step=0.01):
    """
    Calculates stem volume from stump height (0.15m) to specified height
    using numerical integration with Fibonacci taper function
    """
    # Integration from 0.15m to ht_x with 1cm steps
    # Returns volume in cubic meters (m³)
```

## User Interface

### Overview Section

The interface displays physiography zones with:
- **Zone name** and identification number
- **Total tree count** in the zone
- **Species count** in the zone
- **Broken trees count** (crown class = 6)
- **Non-broken trees count**

### Calculation Options

#### Zone-by-Zone Calculation
- Calculate volume ratios for individual physiography zones
- Useful for large datasets or when processing specific areas
- Provides detailed results for each zone

#### All Zones Calculation
- Calculate volume ratios for all zones simultaneously
- Recommended for smaller datasets
- Provides overall project summary

### Results Display

After calculation, the system shows:
- **Total trees processed**
- **Broken trees processed**
- **Case breakdown**:
  - Case 1: Normal broken trees
  - Case 2: Unusual cases
  - Case 3: No measured height
  - Non-broken trees
- **Error count** (if any)

## Data Requirements

### Required Fields

For volume ratio calculation, trees must have:
- `dbh` (Diameter at Breast Height) > 0
- `height_predicted` > 0 (from Phase 2)
- `crown_class` (to identify broken trees)
- `species_code` (for taper function parameters)

### Optional Fields

- `height` (measured height) - if available, improves accuracy
- `phy_zone` (physiography zone) - for zone-specific processing

## Quality Control

### Data Validation

The system validates:
- **Positive DBH values**
- **Valid predicted heights**
- **Proper crown class codes**
- **Species code existence**

### Error Handling

Common errors and solutions:
- **Missing predicted heights**: Complete Phase 2 first
- **Invalid DBH values**: Check data quality in Phase 1
- **Missing species codes**: Verify species mapping
- **Calculation errors**: Check taper function parameters

## Output

### Database Updates

The system updates the `tree_biometric_calc` table with:
- `volume_ratio`: Calculated ratio (0-1)
- `updated_date`: Timestamp of calculation

### API Response

The calculation returns:
```json
{
  "success": true,
  "message": "Volume ratio calculation completed",
  "updated_count": 1250,
  "total_trees": 1250,
  "broken_trees": 180,
  "case1_count": 120,
  "case2_count": 15,
  "case3_count": 45,
  "non_broken_count": 1070,
  "errors_count": 0
}
```

## Best Practices

### Before Calculation

1. **Verify Phase 2 completion**: Ensure all trees have predicted heights
2. **Check data quality**: Review broken tree identification
3. **Validate species mapping**: Confirm HD model assignments

### During Calculation

1. **Process by zones**: For large datasets, calculate zone by zone
2. **Monitor progress**: Watch for error messages
3. **Review results**: Check case breakdowns for data quality

### After Calculation

1. **Verify results**: Check volume ratios are reasonable (0-1 range)
2. **Review errors**: Address any calculation failures
3. **Document issues**: Note unusual cases (Case 2) for investigation

## Troubleshooting

### Common Issues

#### No Trees Found
- **Cause**: Missing predicted heights or invalid data
- **Solution**: Complete Phase 2 height prediction first

#### High Error Count
- **Cause**: Invalid DBH values or missing species codes
- **Solution**: Review data quality in Phase 1

#### Unusual Case 2 Results
- **Cause**: Measured height >= predicted height
- **Solution**: Review field measurements and data entry

#### Calculation Failures
- **Cause**: Invalid taper function parameters
- **Solution**: Check species-HD model mapping

### Performance Tips

1. **Process by zones** for large datasets (>10,000 trees)
2. **Monitor memory usage** during calculation
3. **Use appropriate step size** in volume integration (default: 1cm)

## Next Steps

After successful volume ratio calculation:

1. **Review results** in the interface
2. **Check case breakdowns** for data quality insights
3. **Proceed to Phase 4**: Carbon Emission Calculation
4. **Use volume ratios** in biomass calculations

## Related Documentation

- [Data Selection Guide](data-selection-guide.md)
- [Height Prediction Guide](height-prediction-guide.md)
- [API Documentation](../carbonapi/mrv/API_DOCUMENTATION.md)

---

*This guide covers the volume ratio calculation process in the Forest Biometric Analysis system. For technical details, refer to the source code in `carbonapi/mrv/vol_ratio_utils.py` and `carbonapi/mrv/volume_ratio_views.py`.*
