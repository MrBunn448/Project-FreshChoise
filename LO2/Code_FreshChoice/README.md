# Student Housing - Party Notification System

This is the repository for the Fresh Choice project. It is a web application designed to make product orders and gather those products at the warehouse to deliver them. A differance to other exsisting analogs is the ability to set up your allergies. When you make an order, the system makes a barcode with which you can access the order information at the warehouse.

## Prerequisites

Before you start, make sure you have the following installed on your computer:

1. Node.js (v16 or higher) - [Download here](https://nodejs.org/)
2. MySQL Server (via XAMPP, MAMP, or MySQL Workbench)
3. Git (Optional, if cloning from a repo)

## Getting Started (Step-by-Step)

Since the database is hosted locally on your own computer, every team member must follow these steps to set up their own version of the database.

### 1. Install Dependencies

We have two separate applications: the Server (Backend) and the Client (Frontend). You need to install libraries for both.

Open your terminal in the project root and run:

```bash
# 1. Install Server dependencies
cd server
npm install

# 2. Install bcrypt dependancies
cd server
npm install bcrypt

# 3. Install express-sessions dependancies
cd server
npm i express-session connect-mysql2

# 4. Install Client dependencies
cd ../client
npm install


```

### 2. Database Configuration (Important)

Because we are working on different computers, your MySQL password might differ from mine.

1. Open the file: `server/setup_database.js`
2. Look for the `dbConfig` section at the top:

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',      // Default for XAMPP is 'root'
  password: '',      // Default for XAMPP is empty. CHANGE IF NEEDED.
  multipleStatements: true 
};
```

3. Update the `user` and `password` to match your local MySQL settings.
4. Repeat this step for the file `server/server.js` (it also needs the password to connect).

### 3. Run Migrations & Seeders

We have a script that automatically creates the database, tables, and fills them with dummy data (Seeders).

Make sure your MySQL server (XAMPP/MAMP) is running, then execute:

```bash
# Inside the 'server' folder
npm run db:setup
```

**Expected Output:**

```
Database setup complete!
```

**Note:** Running this script will wipe the existing `fresh_choice` database and recreate it. Do not run this if you have data you want to keep.

## Running the Application

You need to run the Backend and Frontend in two separate terminals.

**Terminal 1: Start the Backend (API)**

```bash
cd server
npm start
```

Output should say: `Server running on port 3001`

**Terminal 2: Start the Frontend (React)**

```bash
cd client
npm run dev
```

Click the link shown (usually `http://localhost:5173`) to open the website.

## Tech Stack & Features

- **Frontend:** React (Vite), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL

## Troubleshooting

- **"Client cannot connect to Server":** Ensure the server terminal is running on port 3001.
- **"Access denied for user 'root'@'localhost'":** You forgot to update the password in `server/server.js` or `server/setup_database.js`.
- **"Module not found":** You forgot to run `npm install` in the specific folder (client or server).