# Pulse Check demo

- **URL:** `/demo` or `/?demo=1`
- **Sample:** an 8-second steady 120 BPM reference click track with 15 detected
  onsets. It opens directly to a populated source-grid result.
- **Storage:** the demo uses only the localStorage key
  `demo:pulse-check:session`. Imported audio and measurements stay in memory.
  The app does not read or write real-data keys while demo mode is active.
- **Reset:** **Reset demo** discards the current in-memory demo state and loads
  a new reference sample.
- **Leave:** **Start for real** removes the `demo:` key, discards the demo
  state, and returns to the empty local-audio flow.

Every entry in `claims.json` starts from this URL in a fresh browser context.
