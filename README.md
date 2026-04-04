# KASU AI Expense Tracker

[**🔴 Live Demo Link**](https://kasu-sooty.vercel.app/)

A full-stack AI-powered expense tracking application built with Next.js, MongoDB, and Google Gemini AI for natural language expense management.

## 📸 Demo Screenshots / Video
![Dashboard ](/public/dashboard1.png)
![overview](/public/Overview1.png)

## 🚀 Setup Instructions

Follow these steps to install dependencies and run the project locally.

### Prerequisites

- Node.js 18+
- MongoDB Atlas account or local MongoDB instance
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nebula-expense-tracker.git
cd nebula-expense-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example` if available) and configure your keys:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nebula
JWT_SECRET=your-secure-random-secret-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
CLIENT_URL=http://localhost:3000
```

Required Configurations:
- **`MONGODB_URI`**: Required for connecting to your MongoDB cluster to store users, expenses, and budgets.
- **`GEMINI_API_KEY`**: Your Google Gemini API key used for the chatbot and interpreting natural language into JSON.
- **`JWT_SECRET`**: Required for signing authentication tokens.
- **`CLIENT_URL`**: Base URL of your app, used for CORS or API absolute routing (e.g., `http://localhost:3000` or the live Vercel URL).

### 4. Run Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🌐 Deployment Instructions

This project is built with Next.js and is optimized for deployment on Vercel.

**Steps to deploy to Vercel:**
1. Push your repository to GitHub. 
2. Go to [Vercel](https://vercel.com) and import your GitHub repository. Vercel will automatically detect the Next.js framework.
3. In the Vercel dashboard **Environment Variables** settings during setup, input all your variables from the `.env` file (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.). *You do not need to add the `PORT` variable.*
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch your application.
5. Once your Vercel URL is generated (e.g. `https://nebula-expense.vercel.app`), update your `CLIENT_URL` environment variable to match this domain and redeploy.
6. **MongoDB Atlas IP Access**: In your MongoDB Atlas dashboard, under *Network Access*, add `0.0.0.0/0` (Allow Anywhere) so Vercel's Serverless Functions can reach the database.

## 🏗️ Architecture

- **Frontend**: Next.js App Router (React.js) using Tailwind CSS and Radix UI primitives. Ensures maximum performance, SSR (Server Side Rendering), and excellent developer ergonomics.
- **Backend**: Native Next.js API Routes / App Router Serverless endpoints. This is a monolithic structure allowing seamless type-sharing, minimizing network roundtrips, and reducing standard server overhead.
- **Database**: MongoDB with Mongoose ODM. Chosen for its flexible document schema. It adapts easily to dynamic expense and budget objects.
- **Authentication**: Custom JWT (JSON Web Tokens) handling with `bcryptjs` and `jose` for secure route protection natively within Next.js Middleware.
- **State Management**: React Context API + Custom Hooks (`ChatContext`, `AuthContext`) for lightweight prop-drilling avoidance and reactive UI updates globally, paired with a custom EventBus (`window.dispatchEvent` / CustomEvent) across the client side for robust state invalidation without heavy external libraries like Redux.

## 🧠 AI Integration

The core feature of this platform is the AI Chatbot that interacts directly with user finances.

- **Prompts**: Built using structured, heavily defined system prompts. Gemini is instructed to act as a financial manager. It receives the current date, user details, and recent transaction history inside the initial system prompt to build up contextual awareness.
- **Tool Calls & Extraction**: Instead of generic language responses, we use Gemini's structural output parsing mode to extract precise intents (`CREATE_EXPENSE`, `DELETE_EXPENSE`, `GET_ANALYTICS`) along with arguments (amount, category, payment method).
- **CRUD Execution Pipeline**:
  1. The user inputs natural language: *"I spent $45 on groceries."*
  2. The Next.js API route formats this with historical chatter and queries Gemini.
  3. Gemini responds with a structured JSON action plan.
  4. The router parses the intended intent and invokes backend internal Controller functions securely (e.g., Mongoose creates the expense).
  5. The API answers the client with an AI-generated natural language confirmation based on the results.
- **State Management (Post-CRUD)**: Once the API updates the backend Database, the frontend triggers an `expenseDataChanged` client-side event. Listeners within the Dashboard charts and Transaction lists immediately receive this and auto-fetch new records, so that the UI stays strictly synchronized with the database state.

## 🔜 Future Improvements

Features and upgrades that could be added in the future:

1. **Receipt Scanning OCR**: Letting users upload photos of receipts and extracting amounts/vendors automatically.
2. **Plaid Integration**: Syncing real bank data to compliment the AI manual inputs.
3. **Subscription Management**: AI automatically detecting and alerting the user of recurring monthly expenses.


## Core API Endpoints

- `POST /api/chat`: Main AI natural language query interface.
- `GET /api/expenses`: Paginated, filterable endpoint for user expenses.
- `GET /api/analytics`: Aggregate statistics and charts.
- `POST /api/auth/register`: Account creation endpoint.

