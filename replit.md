# Esteticacarro - Cristal Care Auto Detail Management System

## Project Overview
A comprehensive management system for auto detailing and body shop businesses. Built with React, TypeScript, and Vite, this application provides a complete ERP solution for automotive care services.

**Date Imported:** December 1, 2025

## Technology Stack
- **Frontend Framework:** React 19.1.0
- **Language:** TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **Styling:** Tailwind CSS 3.4.1
- **Router:** React Router DOM 7.9.6
- **UI Components:** 
  - Lucide React (icons)
  - Framer Motion (animations)
  - Recharts (data visualization)
- **HTTP Client:** Axios 1.9.0
- **Utilities:** date-fns, clsx, tailwind-merge

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ClientDetailsModal.tsx
│   ├── ClientModal.tsx
│   ├── EmployeeModal.tsx
│   ├── InventoryModal.tsx
│   ├── Layout.tsx
│   ├── ServiceModal.tsx
│   ├── TechLogin.tsx
│   ├── VehicleDamageMap.tsx
│   └── WorkOrderModal.tsx
├── context/            # React context providers
│   ├── AppContext.tsx
│   └── DialogContext.tsx
├── lib/               # Utility functions
│   └── utils.ts
├── pages/             # Application pages/views
│   ├── Clients.tsx
│   ├── Dashboard.tsx
│   ├── Finance.tsx
│   ├── Inventory.tsx
│   ├── Marketing.tsx
│   ├── Operations.tsx
│   ├── Schedule.tsx
│   ├── ServicesPricing.tsx
│   ├── Settings.tsx
│   ├── ShopLanding.tsx
│   └── Team.tsx
│   └── TechPortal.tsx
├── App.tsx            # Main app component with routing
├── main.tsx           # Application entry point
├── index.css          # Global styles
└── types.ts           # TypeScript type definitions
```

## Features
- **Dashboard:** Financial metrics, customer analytics, and business intelligence
- **Schedule:** Appointment and service scheduling
- **Operations:** Work order management
- **Clients:** Customer relationship management
- **Marketing:** Marketing campaign management
- **Finance:** Financial tracking and reporting
- **Inventory:** Parts and supplies inventory management
- **Team:** Employee management
- **Services/Pricing:** Service catalog and pricing
- **Settings:** System configuration
- **Shop Landing:** Public-facing landing page
- **Tech Portal:** Standalone portal for technicians

## Development Setup
The project is configured to run on Replit with the following settings:

### Vite Configuration
- **Host:** 0.0.0.0 (required for Replit proxy)
- **Port:** 5000
- **Allowed Hosts:** true (enables Replit iframe proxy)

### Commands
- `npm run dev` - Start development server (port 5000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Replit Environment
- **Workflow:** Start application (npm run dev)
- **Port:** 5000 (webview)
- **Language Module:** Node.js
- **Package Manager:** npm

## Notes
- The application uses dark mode by default (`class="dark"` in index.html)
- Portuguese (pt-BR) is the primary language for the interface
- Originally designed for deployment on Netlify (see netlify.toml)
- Chart components may show warnings about dimensions in console - this is normal for responsive charts

## Recent Changes
- **2025-12-01:** Initial import and Replit configuration
  - Configured Vite for Replit environment (host 0.0.0.0, port 5000, allowed hosts)
  - Set up workflow for development server
  - Installed dependencies
  - Enhanced .gitignore with standard entries
