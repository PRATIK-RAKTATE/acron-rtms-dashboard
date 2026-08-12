hey agent this is my files dont read it or execute it
Injection Molding RTMS – Website Development Requirements

1. Objective

Develop a real-time web-based Injection Molding Real-Time Monitoring System (RTMS) using the existing machine and database data.

The objective is not only to display raw machine data, but to convert it into meaningful production, utilization, mold, cavity, trial, and loss information that can be used by operators, supervisors, production managers, and management.

The database is assumed to already receive the required data in real time. The website should therefore focus on data processing, KPI calculation, event generation, visualization, filtering, search, and actionable alerts.

---

2. Existing Real-Time Data Available

The system currently has the following data sources.

2.1 Machine Cycle Detection

A production cycle is considered completed when the following sequence occurs in the defined order:

1. Clamp Close
2. Injection Feed
3. Refilling
4. Clamp Open

The backend should validate this sequence and generate a successful/valid cycle event only when the complete sequence is detected correctly.

From this, the system already has:

- Total shots/cycles
- Successful cycles
- Cycle timestamp
- Cycle duration
- Machine production activity

---

2.2 RFID-Based Mold Identification

Each mold has a unique RFID.

Each injection molding machine has an RFID reader.

The system therefore knows:

- Which mold is currently installed on which machine
- Mold installation timestamp
- Mold removal timestamp
- Mold changeover
- Current machine-to-mold relationship
- Historical machine-to-mold relationship

The website must provide complete Mold Tracking and Mold History.

---

2.3 Cavity Monitoring

An analog signal changes according to cavity blockage/status.

Each mold can have its own configured:

- Minimum threshold
- Maximum threshold
- Expected cavity count
- Cavity mapping/master configuration

Based on these values, the system can determine:

- Expected parts per cycle
- Actual cavity output
- Cavity blockage/loss
- Actual production quantity
- Production loss due to cavity issues

Example:

16-cavity mold
100 successful cycles

Expected production:

"100 × 16 = 1,600 parts"

If actual cavity output is 15 parts/cycle:

"100 × 15 = 1,500 parts"

Production loss:

"1,600 − 1,500 = 100 parts"

This calculation should be available in real time.

---

3. Machine Operating Modes

Each machine has a mode selection:

Trial Mode

Used when a mold is installed and production is being tested/setup.

Production Mode

Used for actual planned production.

The website must keep Trial and Production data completely separate.

For each machine/mold/SKU, track:

- Trial cycles
- Trial production
- Trial duration
- Production cycles
- Production quantity
- Production duration
- Trial-to-production transition time

---

4. Machine Dashboard

The main dashboard should provide a Factory Overview.

The first screen should immediately show the current condition of the complete factory.

Factory KPI Cards

Display:

- Total Machines
- Running Machines
- Idle Machines
- Trial Machines
- Stopped Machines
- Machines in Production
- Total Production Today
- Total Trial Quantity
- Successful Cycles Today
- Machine Utilization
- Production Time
- Idle Time
- Trial Time
- Changeover Time
- Production Loss

These values should update in real time.

---

5. Machine Live Status Grid

Display all machines in a card/grid format.

Each machine card should show at minimum:

Machine ID

Current Status

- Running
- Idle
- Trial
- Stopped
- Changeover

Current Mold ID

Current SKU/Product

Cycle Time

Successful Cycles

Actual Production

Expected Production

Cavity Performance

Production Mode / Trial Mode

Example:

MACHINE M-032
Status: RUNNING
Mold: MD-024
SKU: SKU-104
Mode: PRODUCTION

Cycle Time: 12.4 sec
Cycles: 2,842
Expected Qty: 45,472
Actual Qty: 44,980
Cavity Performance: 98.9%
Production Time: 8h 42m

Use clear visual status indicators and make the machine card clickable.

Clicking the machine should open the Machine Detail Dashboard.

---

6. Machine Detail Dashboard

When a machine is selected, show detailed information.

Current Machine Information

- Machine ID
- Machine status
- Current mold
- Current SKU
- Current operating mode
- Current cycle time
- Current cycle status
- Current cavity status

Today's Production

- Total shots
- Successful cycles
- Expected quantity
- Actual quantity
- Production loss
- Trial quantity
- Production quantity
- Production time
- Idle time
- Changeover time

Performance

- Average cycle time
- Standard/reference cycle time
- Cycle-time deviation
- Machine utilization
- Production efficiency
- Cavity efficiency

---

7. Machine Timeline

A visual timeline should show the complete operating history of a machine.

Example:

08:00 ─ Idle
08:25 ─ Trial
08:48 ─ Production
11:42 ─ Idle
12:30 ─ Production
15:10 ─ Changeover
15:45 ─ Trial
16:05 ─ Production

Timeline events should be generated from real-time data.

Each event should have:

- Start time
- End time
- Duration
- Event type
- Mold
- Mode

This will allow the user to understand what happened on a machine throughout the shift/day.

---

8. Production Loss Analysis

The system must not only show actual production.

It should calculate potential/expected production versus actual production.

Example:

Expected Production: 100,000
Actual Production:    92,500

Production Loss:       7,500

The loss should be categorized wherever the data supports it:

- Idle time
- Changeover
- Trial
- Cavity loss
- Breakdown/stoppage
- Slow cycle
- Other losses

This should be available for:

- Machine
- Mold
- SKU
- Shift
- Day
- Month
- Factory

---

9. Cavity Performance Dashboard

For molds with cavity monitoring, display:

- Total cavities
- Active cavities
- Blocked/non-producing cavities
- Expected parts
- Actual parts
- Cavity efficiency
- Production loss

Example:

Mold: MD-024
Total Cavities: 16

C1  ✅
C2  ✅
C3  ✅
C4  ❌
C5  ✅
...
C16 ✅

The user should be able to identify which cavity is causing production loss.

Provide trend information such as:

- Cavity performance today
- Cavity performance by shift
- Repeated cavity failure
- Number of cycles affected

---

10. Mold Dashboard

A dedicated Mold Dashboard is required.

This is very important because every mold is independently identified through RFID.

The mold dashboard should provide two primary functions:

A. Live Mold Tracking

Show all molds and their current status.

Example:

Mold ID| Status| Current Machine| SKU| Mode| Installed Since
MD-001| Running| M-012| SKU-101| Production| 08:32
MD-002| Idle| M-025| SKU-204| Trial| 10:12
MD-003| Available| —| —| —| —
MD-004| Running| M-041| SKU-302| Production| 06:45

The user should immediately know:

«Which mold is currently installed on which machine?»

---

B. Mold Search

Provide a prominent search function.

User should be able to search by:

- Mold ID
- Machine ID
- SKU/Product
- Status

Example:

Search:

"MD-024"

Result:

Mold ID: MD-024
Current Machine: M-032
Current Status: PRODUCTION
SKU: SKU-104
Mode: Production
Installed At: 09-Aug-2026 10:42
Current Cycles: 2,842
Actual Production: 44,980

The search result should also show the complete mold history.

---

11. Mold History

When a mold is opened, show:

Current Information

- Mold ID
- Current machine
- Current SKU
- Current status
- Current mode
- Installation time

Production Statistics

- Today's shots
- Today's production
- Trial quantity
- Production quantity
- Production time
- Cavity efficiency
- Production loss

Historical Information

- Previous machines
- Installation history
- Removal history
- Changeover history
- Total cycles
- Total production
- Machine-wise production history
- Date-wise production history

Example:

MD-024

M-012 → 08 Aug → 12:20–16:40
M-032 → 09 Aug → 10:42–Present
M-018 → Previous installation

This makes the mold a traceable production asset.

---

12. Mold Lifecycle View

Each mold should have a complete digital history:

Mold Created
      ↓
Installed on Machine
      ↓
Trial
      ↓
Production
      ↓
Changeover / Removal
      ↓
Installed on Another Machine
      ↓
Production

The system should retain this historical information permanently.

---

13. Trial Dashboard

Provide a dedicated Trial Monitoring section.

Show:

- Machines currently in trial
- Mold under trial
- Trial start time
- Trial duration
- Trial cycles
- Trial quantity
- Time taken to move from trial to production
- Trial history by mold

Example:

M-018
Mold: MD-043
Trial Duration: 42 min
Trial Cycles: 84
Trial Quantity: 1,344
Status: READY FOR PRODUCTION

---

14. Production Dashboard

Production dashboard should show:

- Production by machine
- Production by mold
- Production by SKU
- Production by shift
- Production by day
- Target vs actual
- Expected vs actual
- Production loss
- Cycle count
- Cavity efficiency

Charts should support selectable time ranges:

- Current shift
- Today
- Yesterday
- 7 Days
- 30 Days
- Custom date range

---

15. Alerts & Events

The website should have a real-time alert/event section.

Examples:

Cavity Alert

M-032 / Mold MD-024

Cavity loss detected.
Expected: 16
Actual: 15
Affected cycles: 18

Trial Alert

M-018

Mold MD-043 has been in Trial Mode for 46 minutes.

Mold Change Event

MD-024 removed from M-032
10:42 AM

Mold Installation Event

MD-024 installed on M-041
11:03 AM

Alerts should be prioritized:

- Critical
- Warning
- Information

---

16. Real-Time Factory Floor View

Create a visual factory-floor overview where every machine is represented by a live status indicator.

Example:

M-001 🟢     M-002 🟢     M-003 🟡
M-004 🔵     M-005 🔴     M-006 🟢
M-007 🟢     M-008 🟡     M-009 🟢

Clicking a machine should open its detailed information.

This view should provide an operator/supervisor with a 5-second understanding of the current factory condition.

---

17. Recommended Management KPIs

The top-level management dashboard should focus on a small number of high-value KPIs.

Production

- Actual Production
- Expected Production
- Production Achievement %

Machine

- Machine Utilization
- Production Time
- Idle Time
- Trial Time
- Changeover Time

Performance

- Average Cycle Time
- Cycle Performance
- Cavity Efficiency

Loss

- Production Loss
- Idle Loss
- Cavity Loss
- Trial Loss
- Changeover Loss

Asset

- Running Machines
- Trial Machines
- Idle Machines
- Current Mold Distribution

---

18. Important Calculations

The backend/dashboard should calculate the following from the available data.

Valid Cycle

Clamp Close
→ Injection Feed
→ Refilling
→ Clamp Open
= 1 Successful Cycle

Expected Production

Successful Cycles × Configured Cavity Count

Actual Production

Based on the configured analog signal/master cavity thresholds.

Production Loss

Expected Production − Actual Production

Machine Utilization

Production Time / Available Time × 100

Cavity Efficiency

Actual Cavity Production /
Expected Cavity Production × 100

Production Achievement

Actual Production / Target Production × 100

Additional calculations can be added later as more production/process data becomes available.

---

19. Dashboard Design Principle

The website should follow this hierarchy:

Level 1 — Factory Visibility

What is happening right now?

Level 2 — Production Performance

How much did we produce and how efficiently?

Level 3 — Loss Analysis

Where are we losing production?

Level 4 — Asset/Mold Intelligence

Where is each mold and how is it performing?

Level 5 — Technical Details

What exactly happened at machine/cycle/cavity level?

The system should avoid displaying excessive raw data on the main dashboard.

Raw signal data should be available in detailed technical screens, while the main dashboard should focus on meaningful KPIs, status, trends, losses, alerts, and actions.

---

20. Recommended Main Website Structure

RTMS
│
├── Dashboard
│   ├── Factory Overview
│   ├── Live Machine Status
│   ├── Production KPIs
│   ├── Production Loss
│   └── Live Alerts
│
├── Machines
│   ├── Machine List
│   ├── Machine Detail
│   ├── Machine Timeline
│   └── Machine History
│
├── Molds
│   ├── Mold Dashboard
│   ├── Search Mold
│   ├── Current Machine Mapping
│   ├── Mold Detail
│   └── Mold History
│
├── Production
│   ├── Production Overview
│   ├── Machine-wise
│   ├── Mold-wise
│   ├── SKU-wise
│   └── Shift-wise
│
├── Cavity Monitoring
│   ├── Live Cavity Status
│   ├── Cavity Performance
│   └── Cavity Loss
│
├── Trial Monitoring
│
├── Alerts & Events
│
└── Reports
    ├── Daily
    ├── Shift
    ├── Machine
    ├── Mold
    └── Production

21. Overall Product Vision

The RTMS should not be developed as simply:

"A website showing machine data."

It should be developed as:

Real-Time Manufacturing Intelligence Platform

with the flow:

Existing Real-Time Database
          ↓
Event Processing
          ↓
Machine + Mold + SKU + Mode Context
          ↓
Production Calculation
          ↓
Cavity / Production Loss Calculation
          ↓
KPI Engine
          ↓
Real-Time Dashboard
          ↓
Alerts & Insights
          ↓
Historical Analysis

The main objective is that whenever a user opens the RTMS, they should immediately understand:

What is happening now?
What has been produced?
How efficiently are we producing?
Where are we losing production?
Which mold is where?
Which machine/mold needs attention?

That should be the core design principle for the entire website.