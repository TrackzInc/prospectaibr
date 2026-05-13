Implement automatic polling to refresh the QR code and check the connection status of a WhatsApp instance until it is connected.

### Technical Details
- **New State**: Add an `activePolls` state (Set of instance names) to track which instances are currently being polled.
- **Polling Logic**:
    - Modify `getQRCode` to support an optional `isAuto` parameter.
    - When an instance is not connected, the function will schedule itself to run again after a delay (e.g., 10 seconds).
    - Polling stops if:
        1. The instance status becomes 'connected'.
        2. The instance is deleted (check if it still exists in the local state).
        3. A maximum number of attempts is reached (optional, for safety).
- **UI Feedback**:
    - Show a small indicator (like a pulse or a "Polling..." text) when an instance is in automatic refresh mode.
    - Ensure manual "Refresh" doesn't create duplicate polls.

### Implementation Steps
1.  **State and Helpers**:
    - Add `const [pollingInstances, setPollingInstances] = useState<Set<string>>(new Set());`
2.  **`getQRCode` modification**:
    - Add logic to check status and re-call itself using `setTimeout`.
    - Update the local `pollingInstances` set to reflect the active state.
3.  **Component Lifecycle**:
    - Add a `useEffect` cleanup to clear any pending timeouts if the component unmounts.
4.  **UI Updates**:
    - Add a visual hint that automatic polling is active.

### Verification Plan
- Create a new instance.
- Observe the QR code appearing.
- Wait for a few seconds to see if it refreshes automatically (check console logs).
- Connect the phone and verify that polling stops once the status is "connected".
- Delete an instance during polling and verify no further requests are made for it.