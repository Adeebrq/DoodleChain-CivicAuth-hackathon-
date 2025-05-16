# DoodleChain – Decentralized Collaborative Drawing dApp

![Demo Image](https://drive.google.com/uc?export=view&id=1RA-CFVkKmrRAIJJKItlI_WrfHhJJAM1u)

## 🚨 Known issues

If drawings take time to appear or updates lag, please wait a moment — this can happen due to Firestore sync delays or network latency.

## Overview

DoodleChain is a decentralized collaborative drawing platform built with React, TypeScript, Civic Auth, and Firebase Firestore. Users log in via social accounts, automatically creating embedded wallets that link their identity to their contributions on a massive shared canvas. Every stroke is stored with metadata linking it to the creator’s wallet ID, enabling real-time collaboration, viewing contributors on hover, and tipping artists for their work.

## Features

- 🎨 **Collaborative Canvas**  
  Users draw freely on a shared infinite canvas with strokes tracked and saved in real-time.

- 🔐 **Embedded Wallets via Social Login**  
  Seamless social login creates embedded wallets to uniquely identify users without requiring blockchain key management.

- 💸 **Tipping System**  
  Users can tip others for their artwork, fostering community appreciation without strict ownership.

- 🖱️ **Hover to Identify Artist**  
  Hovering over a drawing shows the wallet ID or username of the creator.
  
![Demo Image 2](https://drive.google.com/uc?export=view&id=1JLydYLPDs0JRHTt7wz8uLhEOyNBwzCNt)


## Tech Stack

* **Frontend:** React, TypeScript, Konva.js (canvas library)  
* **Authentication:** Civic Auth (social login + embedded wallets)  
* **Backend & Database:** Firebase Firestore  
* **Blockchain:** Solana (embedded wallets for identity & tipping)

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- Firebase account with Firestore enabled
- Civic Auth credentials
- React development environment

### Installation


1. **Clone the repository:**
   ```
   git clone https://github.com/Adeebrq/DoodleChain-CivicAuth-hackathon-.git
   cd DoodleChain-CivicAuth-hackathon-
   ```

2. **Install Dependencies**
   ```
   npm install --force
   ```
   
3. **Firestore setup**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_CIVIC_CLIENT_ID=your_civic_client_id
```
🚨 **the firestore configuration requires custom logic implementation which is too big to include here, contact me for the code for this part, else use the live website**

4. **Firestore setup**
```
npm run dev
```




## 📁 Project Structure

```
civic/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── Modal.tsx
│   ├── config/
│   ├── hooks/
│   │   ├── useThemeContext.tsx
│   │   ├── useToaster.tsx
│   │   └── useWalletContext.tsx
│   ├── layout/
│   ├── pages/
│   │   ├── Canvas.tsx
│   │   └── LandingPage.tsx
│   ├── styles/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── public/
├── scripts/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── .gitignore
└── README.md
```

## 🏁 Hackathon

This project was developed for the Civic Auth Hackathon, showcasing fast and flexible authentication integration using the Civic Auth Web3 SDK with embedded wallets. It features seamless user login and automatic wallet creation to unlock blockchain benefits quickly. The submission includes a working implementation and a demo video explaining how Civic Auth is used in the app. Entries must use embedded wallets, include clear documentation, and be publicly accessible to qualify.
