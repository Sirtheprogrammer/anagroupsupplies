# M3 Outfit

A fashion shopping platform built with React.js, TailwindCSS, Firebase, and Gemini AI.

## Features

**User Features:**

- Browse and search for fashion items.
- View product details.
- Add items to the shopping cart.
- Proceed to checkout.
- User authentication (Login/Register).
- AI-powered fashion assistant for recommendations and advice.

**Admin Features:**

- Admin dashboard.
- Manage products (add, edit, delete).
- View and manage orders.
- Manage users.
- Settings.

## Tech Stack

- **Frontend:** React.js, TailwindCSS, Heroicons
- **Backend:** (Planned/Serverless for API interaction)
- **Database/Authentication:** Firebase
- **AI:** Google Gemini API

## Project Structure

```
m3_outfit/
├── public/
├── src/
│   ├── api/              # Serverless functions (for Gemini AI)
│   ├── assets/           # Static assets (images, fonts, etc.)
│   ├── components/       # Reusable React components
│   │   ├── layout/       # Layout components (Navbar, Footer)
│   │   └── ...
│   ├── pages/            # Application pages
│   │   ├── Home.js
│   │   ├── ProductDetails.js
│   │   ├── Cart.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── AdminPanel.js
│   │   └── ...
│   ├── App.js            # Main application component
│   ├── index.js          # Entry point
│   └── ...
├── tailwind.config.js    # Tailwind CSS configuration
├── .env.local            # Environment variables (for local development - **do not commit sensitive keys!**)
├── package.json
├── README.md             # Project README
└── ...
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sirtheprogrammer/m3_outfit.git
    cd m3_outfit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or if you are using yarn:
    ```bash
    yarn install
    ```

3.  **Set up Firebase:**
    - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com/).
    - Set up Firebase Authentication and other services you plan to use (e.g., Firestore, Storage).
    - Get your Firebase configuration object.
    - Create a `.env.local` file in the project root (if it doesn't exist) and add your Firebase configuration as environment variables. For example:
      ```env
      REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
      REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
      REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
      REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
      REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
      REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
      ```
      Replace the placeholder values with your actual Firebase configuration.

4.  **Set up Gemini API (for AI Assistant):**
    - Get your Gemini API key from the Google AI Studio or Google Cloud Console.
    - **Crucially, for production deployment, you must set this API key as an environment variable on your serverless hosting platform (e.g., Vercel, Netlify).** The serverless function in `api/gemini.js` reads the API key from `process.env.GEMINI_API_KEY`.
    - For **local development**, you can also add `GEMINI_API_KEY=YOUR_GEMINI_API_KEY` to your `.env.local` file, but be extremely cautious not to commit this file to your repository if it contains sensitive keys.

## Running the Application

1.  **Start the local development server:**
    If you are using a serverless platform CLI (like Vercel CLI):
    ```bash
    vercel dev
    ```
    If you are running a standard React development server (without local serverless simulation - AI assistant will not work):  
    ```bash
    npm start
    ```
    or
    ```bash
    yarn start
    ```

2.  Open your browser and visit `http://localhost:3000` (or the address provided by your CLI).

## Deployment

This project is structured to be easily deployable to serverless platforms like Vercel or Netlify.

1.  Push your code to a Git repository.
2.  Connect your repository to your chosen serverless platform.
3.  Configure the `GEMINI_API_KEY` environment variable (and any Firebase environment variables if required by your setup) in the platform's settings.
4.  Deploy your project.

## Contributing

(Add contributing guidelines here if applicable)

## License

MIT
#sirtheprogrammer
