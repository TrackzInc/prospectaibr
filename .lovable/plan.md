# Plan: Fix Territories Data Loading

The user reports that the Territories page is empty. This plan addresses the data fetching logic from IBGE and adds a fallback to ensure the page is always functional.

## Proposed Changes

### 1. Update Data Fetching Logic
- Update the population API URL to `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[all]` as requested.
- Ensure the data merging logic correctly handles the response format from IBGE (cross-referencing by ID).

### 2. Implement Local Fallback (Top Cities)
- Create a fallback dataset with the top 100-200 Brazilian cities (hardcoded) to display immediately if the API fails or takes too long.
- This ensures a "zero-data" state is avoided.

### 3. Improve Loading State
- Ensure the `loadingMunicipios` and `loadingPop` states are correctly tied to the UI.
- Use the existing skeleton/loading logic or enhance it if needed.

### 4. Fix Metric Cards
- Ensure `stats` useMemo correctly calculates counts based on the merged data.

## Technical Details
- **File**: `src/routes/territorios.tsx`
- **Population API**: `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[all]`
- **Merging**: `populacao[m.id]` mapping.

## Verification Plan
- Check if the table populates with all ~5,570 cities.
- Verify that metrics cards show correct counts (e.g., ~320 cities > 100k).
- Test filtering with the updated data.
