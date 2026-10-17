# LIFELINE OS — SECURITY, SAFETY AND ETHICAL GOVERNANCE

## 1. Safety Principles & Human-In-The-Loop Governance
Lifeline OS is a clinical, logistical, and emergency decision-support platform designed to assist, not replace, authorized human emergency managers.

### Non-Negotiable Operational Constraints:
1. **Zero Autonomous Physical Deployment**: The software cannot unilaterally deploy physical assets, sign procurement tenders, or dispatch aircraft without explicit cryptographic or authenticated human sign-off (`Step 4: Official Requisition & Sanction`).
2. **Explicit Safety Locks**:
   - Drones cannot be dispatched if live or simulated wind speed exceeds $45\text{ km/h}$.
   - Rescue boats cannot be dispatched if river surface velocity exceeds $3.5\text{ m/s}$ or if night operations are active without specialized thermal forward-looking infrared (FLIR) marine equipment.
   - Bailey bridges cannot be sanctioned unless 16-Tonne heavy vehicle crane access is verified on the approach roadhead.

---

## 2. Mass Public Alert Safety & Prevention of Panic
- Mass emergency evacuation broadcasts (Cell Broadcast, SMS, ntfy) cannot be triggered in a sandbox environment without explicit confirmation.
- Default presentation mode uses a sandboxed demo topic (`lifeline-os-alert-2026`) preventing accidental mass panic alerts to real civilian cellular broadcast cells.

---

## 3. Data Privacy and Vulnerable Populations
- **Aggregated Statistical Counts**: Trapped population numbers are displayed as village-level or corridor-level aggregates derived from building footprints. No personally identifiable medical records (PHI) or individual patient names are exposed in public interfaces.
- **START Triage Confidentiality**: Clinical categories (Red, Amber, Yellow, Green) convey acuity requirements without publishing identifiable diagnostic health data.

---

## 4. Network Security & Interoperability Compliance
- External communications use HTTPS (TLS 1.3) and WSS/SSE.
- CAP v1.2 XML output strictly conforms to OASIS emergency management specifications, ensuring interoperability with government Emergency Warning Disaster Systems (EWDS) such as India NDMA Sachet and WMO international alert feeds.
