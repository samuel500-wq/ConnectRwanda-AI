# 🇷🇼 ConnectRwanda AI

**ConnectRwanda AI** is a unified mobility intelligence and local discovery platform designed to transform how people move, navigate, and discover places across Rwanda.

The platform brings together intelligent public transportation planning, route recommendations, local business discovery, and accessible navigation into one connected digital experience.

ConnectRwanda AI consists of two main applications:

1. **ConnectRwanda Platform** — The main landing page and central entry point for users.
2. **RouteView** — The intelligent transportation engine, consisting of a frontend, backend, and machine-learning prediction service.

> **🏗️ Architecture Note — MapForAll**
>
> MapForAll is a separate, independently hosted service running on Google Cloud Run. It does not need to be installed or executed locally. ConnectRwanda AI integrates with MapForAll through configured URLs, allowing both services to operate independently. This architecture improves flexibility, maintainability, and service reliability.

---

## 📚 TABLE OF CONTENTS

1. [Project Architecture](#-project-architecture)
2. [Prerequisites](#-what-you-need-before-starting)
3. [Step 1: Download the Code](#-step-1-download-the-code)
4. [Step 2: Install Dependencies](#-step-2-install-dependencies)
5. [Step 3: Set Up the Database](#-step-3-set-up-the-database)
6. [Step 4: Configure Environment Variables](#-step-4-configure-environment-variables)
7. [Step 5: Run the Project](#-step-5-run-the-project)
8. [Step 6: Access the Applications](#-step-6-access-the-applications)
9. [How the Applications Connect](#-how-the-applications-connect)
10. [Troubleshooting](#-troubleshooting)
11. [Security Recommendations](#-security-recommendations)

---

## 🏗️ PROJECT ARCHITECTURE

ConnectRwanda AI uses a modular architecture in which each component performs a specific responsibility.

| Component | Description | Local Port |
|---|---|---|
| ConnectRwanda Platform | Main landing page | 3002 |
| RouteView Frontend | User interface and trip planning | 3000 |
| RouteView Backend | API and application services | 4000 |
| RouteView ML Service | Machine-learning predictions | 8000 |
| MapForAll | Independent place-discovery platform | Cloud hosted |

Each service can be developed, maintained, and deployed independently while communicating through configured APIs and URLs.

---

## 🛠️ WHAT YOU NEED BEFORE STARTING

Before running the project, make sure you have installed the following software:

- **Node.js (Version 18 or 20)** — JavaScript runtime.
- **Python (Version 3.10 or newer)** — Required for machine-learning services.
- **XAMPP** — Provides the local MySQL database.
- **Git** — Used to download the project repository.
- **Visual Studio Code** — Recommended code editor.

Verify your installations:

```bash
node --version
npm --version
python --version
git --version
```

---

## 🚀 STEP 1: DOWNLOAD THE CODE

Open your terminal or command prompt and execute:

```bash
git clone https://github.com/your-username/ConnectRwanda-AI.git
```

Navigate into the project directory:

```bash
cd ConnectRwanda-AI
```

**Note:** Replace `your-username` with the actual GitHub username or organization hosting the repository.

---

## 📦 STEP 2: INSTALL DEPENDENCIES

Each application has its own dependencies. Install them separately.

### 1. ConnectRwanda Landing Page

```bash
cd connectrwanda-platform
npm install
cd ..
```

### 2. RouteView Frontend

```bash
cd routeviews/frontend
npm install
cd ../..
```

### 3. RouteView Backend

```bash
cd routeviews/backend
npm install
cd ../..
```

### 4. RouteView Machine-Learning Service

The ML service uses a Python virtual environment to isolate dependencies and prevent conflicts with other Python projects.

**Windows:**

```bash
cd routeviews/ml

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

cd ../..
```

**macOS / Linux:**

```bash
cd routeviews/ml

python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

cd ../..
```

---

## 🗄️ STEP 3: SET UP THE DATABASE

ConnectRwanda AI uses MySQL through XAMPP for the local RouteView database.

Follow these instructions:

1. Open XAMPP Control Panel.
2. Start MySQL.
3. Open your browser.
4. Navigate to:

   `http://localhost/phpmyadmin`

5. Click **New**.
6. Create a database named:

   `routeview`

7. Select the newly created database.
8. Open the **Import** tab.
9. Locate the SQL file:

   `routeviews/backend/src/db/schema.sql`

10. Upload the SQL file and click **Import** or **Go**.

Wait until the database import completes successfully.

Your RouteView database is now ready.

---

## 🔐 STEP 4: CONFIGURE ENVIRONMENT VARIABLES

Each application uses its own environment configuration file.

This separation makes the project easier to maintain and helps protect sensitive application credentials.

### 1. RouteView Backend

Create a file named `.env` inside:

`routeviews/backend/`

Add the following configuration:

```env
PORT=4000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=routeview

JWT_SECRET=replace_with_a_long_random_secret

OPENROUTER_API_KEY=your_openrouter_api_key

ML_URL=http://127.0.0.1:8000
```

**Important:**
- Replace the JWT secret with a strong, randomly generated value.
- Add your own OpenRouter API key.
- Set the correct MySQL password. Leave it blank only if your local MySQL account has no password.

### 2. RouteView Frontend

Create `.env.local` inside:

`routeviews/frontend/`

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000

NEXT_PUBLIC_MAPFORALL_URL=https://mapforall.connectrwanda.ai
```

### 3. ConnectRwanda Landing Page

Create `.env.local` inside:

`connectrwanda-platform/`

Add:

```env
NEXT_PUBLIC_ROUTEVIEW_URL=http://localhost:3000

NEXT_PUBLIC_MAPFORALL_URL=https://mapforall.connectrwanda.ai
```

> **Security Reminder:** Never expose private API keys, database passwords, JWT secrets, or other confidential credentials through variables beginning with `NEXT_PUBLIC_`. These variables are accessible to browser-side code.

Restart the relevant development servers whenever you change environment variables.

---

## 🏃 STEP 5: RUN THE PROJECT

You need **four separate terminals** to run all the local services simultaneously.

Keep all four terminals running while using the platform.

### TERMINAL 1 — ROUTEVIEW BACKEND

```bash
cd routeviews/backend

npm run dev
```

Backend:

`http://localhost:4000`

### TERMINAL 2 — ROUTEVIEW ML SERVICE

Activate the Python virtual environment first.

**Windows:**

```bash
cd routeviews/ml

.venv\Scripts\activate

uvicorn service:app --host 127.0.0.1 --port 8000
```

**macOS / Linux:**

```bash
cd routeviews/ml

source .venv/bin/activate

uvicorn service:app --host 127.0.0.1 --port 8000
```

ML Service:

`http://127.0.0.1:8000`

### TERMINAL 3 — ROUTEVIEW FRONTEND

```bash
cd routeviews/frontend

npm run dev
```

Frontend:

`http://localhost:3000`

### TERMINAL 4 — CONNECTRWANDA LANDING PAGE

```bash
cd connectrwanda-platform

npm run dev -- --port 3002
```

Landing Page:

`http://localhost:3002`

If the landing-page development script already specifies port 3002, use the existing script instead.

---

## 🌍 STEP 6: ACCESS THE APPLICATIONS

Once all services are running, open the following addresses in your browser.

| Application | Local URL |
|---|---|
| ConnectRwanda Landing Page | http://localhost:3002 |
| RouteView Application | http://localhost:3000 |
| RouteView Admin Dashboard | http://localhost:3000/admin/login |

### 🔑 DEFAULT ADMIN LOGIN

The following development credentials are provided for the local setup:

**Email:**
`admin@routeview.rw`

**Password:**
`Password123!`

> These credentials are intended for local development. Change the default password before deployment. If the account is not present in your database, create an administrator using the project's setup process.

---

## 🔗 HOW THE APPLICATIONS CONNECT

One of the key architectural decisions in ConnectRwanda AI is keeping the applications modular and independently manageable.

Instead of merging separate application databases, the platform communicates through configured URLs, APIs, and validated URL parameters.

This approach reduces unnecessary database dependencies and makes independent service deployment easier.

### 1. RouteView → MapForAll

When a user selects **Discover Places Around Destination**, RouteView can redirect the user to MapForAll while passing the destination coordinates and location name.

Example:

```text
https://mapforall.connectrwanda.ai/discover?lat=-1.94&lng=30.06&label=Nyabugogo
```

### 2. MapForAll → RouteView

When a user selects **Find Transport Here**, MapForAll can redirect the user back to RouteView with the selected destination information.

Example:

```text
http://localhost:3000/plan?toLat=-1.94&toLng=30.06&toLabel=Nyabugogo
```

These integrations allow users to move between transportation planning and local discovery without experiencing disconnected applications.

**Important:** Incoming coordinates and URL parameters should always be validated by the receiving application.

---

## 🛠️ TROUBLESHOOTING

### 1. Hydration Error or Application Not Loading

Try performing a hard refresh.

- Windows: `Ctrl + Shift + R`
- macOS: `Cmd + Shift + R`

If the issue continues, inspect the browser console and the terminal for errors.

### 2. AI Chat Shows "Connection Failed"

Check that:

- The backend is running in Terminal 1.
- MySQL is running in XAMPP.
- The backend URL in the frontend environment file is correct.
- Your OpenRouter API key is configured correctly.
- The backend has successfully connected to the database.

### 3. Database Connection Error

Check your backend `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=routeview
```

Make sure:
- MySQL is running.
- The `routeview` database exists.
- The SQL schema was imported successfully.
- Your database username and password are correct.

### 4. Machine-Learning Service Not Responding

Verify that:

- The Python virtual environment is activated.
- All dependencies were installed.
- The ML service is running on port 8000.
- The backend ML URL is correct.

```env
ML_URL=http://127.0.0.1:8000
```

### 5. Port Already in Use

If a service cannot start because its port is occupied, stop the conflicting application or configure an alternative port.

Remember to update the corresponding environment variables and service URLs.

---

## 🔒 SECURITY RECOMMENDATIONS

Before deploying ConnectRwanda AI to production:

- Never upload `.env` or `.env.local` files containing secrets to GitHub.
- Keep database credentials and private API keys on the server.
- Use strong JWT secrets.
- Change default administrator credentials.
- Use HTTPS for production services.
- Validate incoming requests and URL parameters.
- Apply appropriate authentication and authorization.
- Keep dependencies updated.
- Configure production environment variables separately from local development.
- Avoid exposing local development servers to the public internet.

---

## 🇷🇼 ABOUT CONNECTRWANDA AI

ConnectRwanda AI is built around a simple vision: making transportation, navigation, and local discovery smarter and more accessible.

By connecting intelligent mobility planning with location discovery, the platform aims to create a more connected experience for people, businesses, and communities across Rwanda.

**ConnectRwanda AI — Connecting People, Places, and Possibilities.**

---

*Developed with innovation and a vision for smarter mobility in Rwanda.*