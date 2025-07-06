# 📦 SmartStock - Inventory Management System

A modern, full-stack inventory management system designed for Nigerian businesses. Built with React, Node.js, Express, and PostgreSQL (Neon).

![SmartStock Dashboard](https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80)

## 🚀 Features

### 📦 **Inventory Management**
- ✅ Add/Edit/Delete Products with Nigerian Naira (₦) currency
- ✅ Real-time stock tracking
- ✅ Low stock alerts and notifications
- ✅ Inventory adjustment with audit trail
- ✅ SKU management and barcode support
- ✅ Category organization

### 👨‍💼 **User Management & Authentication**
- ✅ **Admin Role**: Full system access
- ✅ **Manager Role**: Department management
- ✅ **Staff Role**: Limited access
- ✅ JWT authentication with refresh tokens
- ✅ Role-based route protection
- ✅ User profile management

### 🏢 **Department Management**
- ✅ Department creation and management
- ✅ Staff assignment to departments
- ✅ Department-based access control
- ✅ Staff count tracking

### 📊 **Analytics & Dashboard**
- ✅ Real-time dashboard with key metrics
- ✅ Total products, categories, and users
- ✅ Low stock alerts
- ✅ Recent activity feed
- ✅ Inventory value tracking in ₦

### 🔒 **Security Features**
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting and CORS protection
- ✅ Input validation and sanitization
- ✅ Secure database connections

### 🎨 **Modern UI/UX**
- ✅ Responsive design (mobile-friendly)
- ✅ Modern Tailwind CSS styling
- ✅ Intuitive navigation with sidebar
- ✅ Toast notifications for user feedback
- ✅ Loading states and error handling

## 🛠 Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Zustand** for state management
- **React Hook Form** for form handling
- **Recharts** for data visualization
- **Headless UI** for accessible components

### **Backend**
- **Node.js** with Express
- **PostgreSQL** (Neon cloud database)
- **JWT** authentication
- **bcrypt** for password hashing
- **WebSocket** for real-time updates
- **Joi** for validation
- **PDFKit** for report generation

### **Database**
- **PostgreSQL** with proper indexing
- **UUID** primary keys
- **JSONB** for flexible data storage
- **Triggers** for automatic timestamps

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (we recommend [Neon](https://neon.tech) for cloud hosting)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smartstock
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://username:password@host:port/database
# JWT_SECRET=your-secret-key
# etc...

# Run database migrations and seed data
npm run migrate
npm run seed

# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Credentials

After running the seed script, you can login with:

**Manager Account:**
- Email: `admin@smartstock.com`
- Password: `SecurePassword123!`

**Staff Account:**
- Email: `john@smartstock.com`
- Password: `password123`

## 📚 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **departments** - Organizational departments
- **categories** - Product categories
- **products** - Product catalog
- **inventory_logs** - Inventory movement history
- **stock_alerts** - Low stock notifications
- **activity_logs** - User activity tracking
- **refresh_tokens** - JWT refresh token management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Manager only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - List products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Manager only)
- `PUT /api/products/:id` - Update product (Manager only)
- `DELETE /api/products/:id` - Delete product (Manager only)
- `GET /api/products/:id/history` - Get product inventory history

### Inventory
- `POST /api/inventory/update` - Update product inventory
- `POST /api/inventory/bulk-update` - Bulk inventory update
- `GET /api/inventory/alerts` - Get stock alerts
- `PUT /api/inventory/alerts/:id/read` - Mark alert as read
- `GET /api/inventory/summary` - Get inventory dashboard data

### Users (Manager only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/activate` - Reactivate user
- `POST /api/users/:id/change-password` - Change password
- `POST /api/users/:id/reset-password` - Reset password

### Departments (Manager only)
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Categories (Manager only)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Reports
- `GET /api/reports/inventory-summary` - Inventory summary report
- `GET /api/reports/low-stock` - Low stock report
- `GET /api/reports/inventory-movements` - Inventory movements
- `GET /api/reports/activity-logs` - Activity logs (Manager only)

## 🔒 Security Features

- JWT access tokens (15 min expiry) + refresh tokens (7 days)
- bcrypt password hashing (12 rounds)
- Rate limiting on authentication endpoints
- CORS protection
- Helmet.js security headers
- SQL injection protection via parameterized queries
- XSS protection
- Role-based access control
- Activity logging for audit trails

## 📱 Mobile Responsive

SmartStock is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop computers
- 🖥 Large monitors

## 🌙 Dark Mode

Toggle between light and dark themes for comfortable viewing in any environment.

## 📊 Real-time Updates

- Live inventory updates via WebSocket
- Instant notifications for low stock alerts
- Real-time dashboard metrics
- Live user activity feeds

## 🎯 Roadmap

- [ ] Barcode/QR code scanning
- [ ] Supplier management module
- [ ] Purchase order system
- [ ] Multi-location inventory
- [ ] Advanced analytics with ML insights
- [ ] Mobile app (React Native)
- [ ] Integration with accounting software
- [ ] Email automation for alerts
- [ ] Inventory forecasting
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [Heroicons](https://heroicons.com/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Database hosting by [Neon](https://neon.tech/)

## 📞 Support

If you have any questions or need help getting started:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our [Discord community](https://discord.gg/smartstock)

---

**Built with ❤️ by the SmartStock Team**
