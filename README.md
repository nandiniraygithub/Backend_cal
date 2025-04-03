# Backend_cal

## 📌 Project Overview
Backend_cal is a backend application designed to handle API requests efficiently, providing essential features for managing and processing calculations. This project utilizes **Node.js**, **Express.js**, and **MongoDB** to ensure scalability and performance.

## 🚀 Features
- RESTful API structure
- User authentication and authorization
- CRUD operations for calculations
- Secure password hashing using bcrypt
- Data validation with Zod
- Error handling and logging

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JWT, bcrypt
- **Validation:** Zod

## 🔧 Installation & Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/nandiniraygithub/Backend_cal.git
   cd Backend_cal
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   MONGO_CONN=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```sh
   npm start
   ```
   The server will run on `http://localhost:5000` by default.

## 📌 API Endpoints
| Method | Endpoint       | Description          |
|--------|---------------|----------------------|
| GET    | `/api/calculations` | Fetch all calculations |
| POST   | `/api/calculations` | Add a new calculation |
| PUT    | `/api/calculations/:id` | Update a calculation |
| DELETE | `/api/calculations/:id` | Delete a calculation |

## 📜 License
This project is licensed under the MIT License.

## 📩 Contact
For any inquiries, reach out to [Nandini Ray](https://github.com/nandiniraygithub).

