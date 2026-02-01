# LetzPocket

LetzPocket is a comprehensive property management application designed specifically for UK landlords. This MVP provides essential tools to help landlords manage their properties efficiently, stay compliant with the Renters Rights Act 2024, and make informed investment decisions.

## Features

### 🏠 Property Management
- **Property Portfolio Dashboard**: View and manage all your rental properties in one place
- **Property Details**: Track address, value, rental income, and tenancy information
- **Tenant Management**: Keep track of current tenants and lease expiry dates
- **Property Status**: Monitor occupancy status (occupied, vacant, maintenance)

### 📋 Tenancy Agreement Checker
- **Document Upload**: Upload your current tenancy agreements (PDF, DOC, DOCX)
- **Compliance Analysis**: Automated checking against the Renters Rights Act 2024
- **Issue Identification**: Get detailed reports on areas that need attention
- **Recommendations**: Receive specific guidance on how to amend agreements
- **Download Reports**: Export analysis results for your records

### 💰 Yield Calculator
- **Multi-Property Support**: Calculate yields for multiple properties simultaneously
- **Comprehensive Metrics**: Gross yield, net yield, ROI, and profit calculations
- **Cost Tracking**: Factor in maintenance, insurance, and other costs
- **Vacancy Rate Adjustment**: Account for potential void periods
- **Portfolio Summary**: View combined performance across all properties

### 📊 House Price Estimator
- **Market Valuation**: Get estimated property values based on current UK market data
- **Detailed Property Analysis**: Consider property type, size, condition, and features
- **Local Market Insights**: Compare with local average prices
- **Trend Analysis**: Understand current market trends in your area
- **Confidence Scoring**: Get reliability indicators for estimates

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Custom components inspired by shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Create React App

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd letzpocket
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Key Features in Detail

### Tenancy Agreement Checker
The agreement checker analyzes uploaded documents for compliance with the Renters Rights Act 2024, identifying:
- Missing compliance clauses
- Unclear rent increase terms
- Outdated termination notice periods
- Other regulatory requirements

Each issue is categorized by severity (high, medium, low) with specific recommendations for remediation.

### Yield Calculator
Calculate comprehensive rental yields including:
- **Gross Yield**: Basic rental income as percentage of property value
- **Net Yield**: After accounting for costs and vacancy periods
- **ROI**: Return on investment considering total costs
- **Profit Analysis**: Monthly and annual profit projections

### Price Estimator
Get accurate property valuations based on:
- Property location (postcode)
- Property type and size
- Number of bedrooms and bathrooms
- Property condition
- Additional features (garden, parking, garage)
- Current market trends

## Future Enhancements

Planned features for future releases:
- Integration with Zoopla and Rightmove for automatic property listings
- Automated rent collection processing
- Maintenance request tracking
- Tax calculation assistance
- Document storage and management
- Mobile application
- Advanced reporting and analytics

## Contributing

This is an MVP project. Contributions and feedback are welcome for future development.

## License

[License information to be added]

## Support

For support or questions about LetzPocket, please contact the development team.

---

**LetzPocket** - Empowering UK landlords with modern property management tools.
