# Vyomaa Energy - Lead CRM System

A comprehensive, user-friendly lead tracking and customer relationship management system designed for Vyomaa Energy. Built with mobile-first responsive design and inspired by industry-leading lead capture systems like OpenSolar.

![Vyomaa Energy](https://img.shields.io/badge/Vyomaa-Energy-56D54F?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0-blue?style=for-the-badge)
![Mobile Friendly](https://img.shields.io/badge/mobile-friendly-green?style=for-the-badge)

## 🌟 Features

### 🔐 Secure Authentication
- Login page with session management
- Protected dashboard access
- Secure logout functionality

### 📝 Public Lead Capture Form
- Simple, intuitive form design inspired by OpenSolar
- Mobile-responsive layout
- Required and optional fields
- Auto-qualification of new leads
- Success confirmation page
- No login required for lead submission

### 📊 Comprehensive CRM Dashboard
- Full lead management system
- Real-time statistics and analytics
- Advanced search and filtering
- Lead qualification tracking
- Pipeline management
- Deal size estimation
- Export to CSV functionality

### 📱 Mobile-First Design
- Fully responsive on all devices
- Touch-friendly interface
- Optimized for tablets and smartphones
- Progressive enhancement

## 🚀 Quick Start

### Access the Application

1. **Home Page**: `index.html`
   - Welcome page with navigation options
   - Auto-redirects if already logged in

2. **Lead Capture Form**: `lead-capture.html`
   - Public form for submitting inquiries
   - No login required
   - Ideal for embedding on website

3. **Login Page**: `login.html`
   - Secure authentication
   - Demo credentials provided

4. **CRM Dashboard**: `dashboard.html`
   - Protected by authentication
   - Full lead management capabilities

### Demo Login Credentials

```
Username: admin
Password: vyomaa2025
```

## 📋 Application Flow

```
Home Page (index.html)
├── Lead Capture Form (lead-capture.html) → Success → Back to Form/Login
└── Login (login.html) → Dashboard (dashboard.html) → Logout → Login
```

## 🎨 Design System

### Brand Colors
- **Primary Green**: `#56D54F`
- **Accent Yellow**: `#BAFF00`
- **Orange**: `#FC702F`
- **Dark Navy**: `#1C242E`
- **Light Gray**: `#e0e0e0`

### Typography
- Font Family: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Responsive font sizes
- Clear hierarchy

## 📱 Mobile Responsiveness

### Breakpoints
- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: ≤ 480px

### Mobile Optimizations
- Stacked layouts for small screens
- Touch-friendly buttons (min 44px height)
- Simplified navigation
- Optimized form inputs
- Reduced padding/margins
- Single-column layouts

## 🔒 Data Storage

- **Client-side**: All data stored in browser's `localStorage`
- **Session management**: Uses `sessionStorage` for authentication
- **No backend required**: Fully functional offline
- **Privacy**: Data never leaves the user's device

### Storage Keys
- `crm_leads`: All lead data
- `vyomaa_logged_in`: Authentication status
- `vyomaa_username`: Current user

## 📊 Lead Capture Fields

### Required Fields
- Company Name
- Industry Type
- City
- State
- Contact Name
- Email Address
- Phone Number

### Optional Fields
- Job Title
- Current Energy Infrastructure
- Estimated Capacity
- Preferred Model
- Additional Information

### Auto-filled Fields for Web Leads
- Lead Source: "Website"
- Lead Q Status: "In Review"
- Segment Tier: "B"
- Lead Status: "Warm"
- Step: "0"
- Date Added: Current date

## 💡 Usage Tips

### For Administrators
1. Login using credentials
2. View real-time statistics on dashboard
3. Add leads manually through the form
4. Search and filter leads
5. Export data to CSV for analysis
6. Track pipeline and deal progress

### For Website Integration
1. Share `lead-capture.html` link with prospects
2. Embed as iframe on your website
3. Customize fields as needed
4. Leads automatically appear in CRM

### For Mobile Users
- All pages are fully functional on mobile
- Forms adapt to smaller screens
- Touch-friendly interface
- No horizontal scrolling

## 📈 Analytics & Tracking

The dashboard provides real-time metrics:
- **Total Leads**: Count of all leads
- **Hot Leads**: Urgent follow-ups
- **Qualified Leads**: Verified prospects
- **Converted**: Successful closures
- **Pipeline Value**: Total deal size in ₹

## 🔧 Technical Details

### File Structure

```
lead-tracking/
├── index.html              # Home/Welcome page
├── login.html              # Authentication page
├── lead-capture.html       # Public lead form
├── dashboard.html          # Protected CRM dashboard
├── README.md              # Documentation
└── .github/
    └── workflows/
        └── static.yml     # GitHub Pages deployment
```

### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox & Grid
- **JavaScript**: Vanilla JS (no frameworks)
- **LocalStorage API**: Data persistence
- **SessionStorage API**: Authentication

## 🌐 Deployment

The application is deployed on GitHub Pages and accessible at your repository's GitHub Pages URL.

## 🔄 OpenSolar-Inspired Features

Based on research of OpenSolar's lead capture system:

✅ Simple lead capture form
✅ Required and optional field configuration
✅ Auto-population of CRM
✅ Mobile-responsive design
✅ Clean, professional interface
✅ Success confirmation
✅ No complex setup needed

## 📝 Version History

### Version 2.0 (Current)
- Added Vyomaa Energy branding
- Implemented authentication system
- Created public lead capture form
- Enhanced mobile responsiveness
- Improved user experience
- OpenSolar-inspired design

### Version 1.0
- Basic CRM functionality
- Single-page application
- Local storage only

---

**Built with ❤️ for Vyomaa Energy**

*Powering Your Future with Clean Energy Solutions*
