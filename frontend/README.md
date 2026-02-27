# Yield Intelligence - Frontend

This directory contains the frontend application for the Yield Intelligence tool, built with **React**, **Vite**, **Tailwind CSS**, and **Shadcn UI**.

## Overview

The frontend serves as the interactive dashboard for farmers and agronomists. It allows users to:
1.  Visualize hierarchical agricultural data (Folders -> Groups -> Fields).
2.  Analyze feature distributions and interactions.
3.  Select specific data points (fields, groups, features) to share with the AI agent.
4.  Chat with the **Agronomist Agent** to get personalized recommendations.

## Tech Stack

*   **Framework:** React 18 + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI (based on Radix UI)
*   **Icons:** Lucide React

## Project Structure

*   **`src/components/`**: Contains all React components.
    *   `DataVisualizationPage.tsx`: The core component for the data dashboard. Handles data rendering, selection logic, and hierarchy management.
    *   `ChatMessagesView.tsx`: The chat interface component.
    *   `MainLayout.tsx`: The main application layout wrapper.
*   **`src/lib/`**: Utility functions and UI component definitions (Shadcn).
*   **`src/App.tsx`**: The main application entry point. It manages the global state, the chat session, and the communication between the dashboard and the agent.

## Key Components & Logic

### 1. Data Visualization (`DataVisualizationPage.tsx`)
This component renders the complex hierarchy of agricultural data.
*   **Hierarchy Building**: Converts flat data into a tree structure (Folder -> Group -> Field).
*   **Selection Logic**: Users can select rows (Fields/Groups) and columns (Features).
*   **Context Sharing**: The `handleShareContext` function constructs a payload based on the user's selection and passes it to `App.tsx`.

### 2. Chat & Context Passing (`App.tsx`)
The `App.tsx` component orchestrates the interaction with the backend agent.

**How Context is Shared:**
When a user clicks "Share with Agent" in the dashboard:
1.  `DataVisualizationPage` creates a JSON payload describing the selection.
2.  `App.tsx` receives this payload via the `onShareContext` callback.
3.  `App.tsx` sends a **hidden message** to the agent. This message is not visible in the chat UI but is processed by the agent.

**Context Payload Structure:**
The payload is wrapped in a formatted string:
```text
[User Selection Context]
{
  "type": "group_analysis",
  "group": "Group Name",
  "selected_fields": ["Field A", "Field B"],
  "selectedFeatures": ["Nitrogen", "Yield"]
}

User Request: Analyze the selected fields...
```

**Common Payload Types:**
*   `folder_analysis`: Analyze an entire folder.
*   `group_analysis`: Analyze a specific group of fields.
*   `field_recommendation`: Get detailed advice for a single field.
*   `feature_interaction`: Analyze the relationship between two features.
*   `feature_distribution`: Analyze the histogram of a single feature.

## Development

### Setup
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build
```bash
npm run build
```
The build output will be generated in the `dist/` folder, which is then served by the Python backend in production.
