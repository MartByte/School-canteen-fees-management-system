# School Fees & Canteen Management System

A real-time, localized digital solution built to replace manual paper logging for an educational institution in Ghana. This system streamlines daily school attendance tracking, fee collections, and dynamic canteen account provisioning partitioned by student residential towns and bus transit routes.

---

## 🛠️ Tech Stack & Infrastructure

- **Frontend Mobile App:** React Native (Expo SDK), React Hooks, Context API, Native JavaScript Fetch Client.
- **Backend API Engine:** Node.js, Express.js REST API architecture.
- **Database Layer:** MySQL Relational Database (Connection Pooling, ACID Compliant Transactions).
- **DevOps & Hosting:** Deployed on a DigitalOcean Linux Droplet, process lifecycle managed via PM2.

---

## 🚀 Key Architectural Features & Problem Solving

### 1. Dynamic Canteen Provisioning (The 4 Archetypes)
Instead of static logging, the application shifts students dynamically across four payment categories to preserve cash-flow transparency:
* **Normal:** For daily pay-as-you-eat cash transactions (e.g., GH₵5 / GH₵10).
* **Advanced:** Upfront lump-sum deposits where daily costs are auto-deducted from a running balance (`canteen_balances`).
* **Credit:** Insulated account logging tracking students allowed to eat on credit.
* **Exempted:** For students who are exempted from paying the fees. (`canteen_exemptions`).

### 2. Network Optimization (Asynchronous Debouncing)
To protect server resources and maintain high mobile UI responsiveness, input fields monitoring monetary entry utilize a **1000ms debounce buffer**. The frontend stalls API payloads until user typing ceases, keeping the network connection pool from flooding during peak morning tracking hours.

### 3. Bulletproof Data Integrity (Database Transactions)
Critical group-state switches (such as transitioning a student to a different payment category) run through explicit MySQL transactional blocks (`START TRANSACTION`, `COMMIT`, `ROLLBACK`). If any sub-query fails mid-operation, the system automatically rolls back changes to ensure no phantom data or orphaned accounting states exist.

---

## 📁 Repository Structure

This project is organized as a decoupled monorepo layout:

```text
School-canteen-fees-management-system/
├── backend/          # Node.js + Express API Engine & SQL Seed Schemas
│   ├── routes/       # Express route controllers (canteen.js, fees.js)
│   ├── package.json
│   └── server.js     # System initialization & connection pool configurations
└── frontend/         # React Native (Expo) Mobile Client application
    ├── components/   # Modular UI elements (StudentSelectionModal.js)
    ├── screens/      # Core interface views (CollectCanteenScreen.js)
    └── package.json
