# Plan: Fix Territories Page Filters

The "Territórios" page shows "No cities found" because the population filter is too restrictive by default. This plan addresses the filter initialization and ensures data visibility.

## Proposed Changes

### Frontend Improvements
- Update `POP_RANGES` to include an "All" option or adjust logic to show all cities when no filter is applied.
- Initialize `selectedPopRange` state to 0 and ensure the first range includes all cities or represents a "No filter" state.
- Add `console.log` to monitor `mergedData` and `filteredData` lengths during development.
- Ensure the population filter logic correctly handles the "All" case.

### Implementation Details
1.  **Modify `POP_RANGES`**:
    - Current: `< 50k`, `50k-100k`, etc.
    - New: Add `{ label: "Todas", min: 0, max: Infinity }` as the first item.
2.  **State Initialization**:
    - Keep `selectedPopRange` as `[0]`, which will now correspond to "Todas".
3.  **Logging**:
    - Add `useEffect` to log the length of `mergedData` whenever it changes.
4.  **Filter Logic**:
    - Verify `filteredData` useMemo correctly applies the range from index 0.

## Technical Details
- **File**: `src/routes/territorios.tsx`
- **State**: `selectedPopRange` (index-based slider)
- **Data Source**: IBGE API (Municípios and População)
- **Logic**: Range check `city.populacao >= range.min && city.populacao < range.max`

## Verification Plan
- Open the Territories page.
- Verify that the table is populated with cities by default.
- Check the browser console for the logged counts.
- Test the population slider to ensure it filters correctly between ranges.
- Confirm "Todas" shows the complete list (paginated to 50 items for performance).
