<header>

<!--
  <<< Author notes: Course header >>>
  Read <https://skills.github.com/quickstart> for more information about how to build courses using this template.
  Include a 1280×640 image, course name in sentence case, and a concise description in emphasis.
  In your repository settings: enable template repository, add your 1280×640 social image, auto delete head branches.
  Next to "About", add description & tags; disable releases, packages, & environments.
  Add your open source license, GitHub uses the MIT license.
-->

# 🏠 Parcel Research Tool

A comprehensive real estate parcel research platform inspired by PropStream, featuring property search, filtering, comparable property analysis, deal calculators, and lead generation.

## Features

- **Property Search & Database** - Search 160M+ properties nationwide
- **Advanced Filtering** - 165+ filter options (price, location, property type, owner type, etc.)
- **Comparable Properties (Comps)** - Analyze comparable properties and market trends
- **Deal Analysis** - Calculate ROI, cash flow, maximum allowable offer (MAO)
- **Lead Generation** - Generate targeted lead lists for different strategies (flip, rental, wholesale)
- **Lead Management** - Manage, track, and export lead lists

## Architecture

```
Frontend (React)          Backend (Node.js/Express)    Database
   ↓                             ↓                         ↓
React Components ←→ API Routes ←→ PostgreSQL + Redis
  (Search UI)        (Routing)      (Parcel Data)
```

### Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (properties, leads, analysis) + Redis (caching)
- **Frontend**: React, TypeScript (in progress)
- **External APIs**: Zillow, Redfin, Google Maps
- **Authentication**: JWT (planned)

## Project Structure

```
parcel-research-tool/
├── src/
│   ├── server.js                 # Main Express app
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   └── redis.js             # Redis client
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── properties.js        # Property endpoints
│   │   ├── search.js            # Search & filtering
│   │   ├── comps.js             # Comparable properties
│   │   ├── calculator.js        # Deal calculations
│   │   └── leads.js             # Lead management
│   ├── models/
│   │   ├── Property.js
│   │   └── LeadList.js
│   ├── services/               # Business logic
│   ├── utils/                  # Helpers
│   └── db/
│       ├── schema.sql          # Database schema
│       ├── migrations/
│       └── seeds/
├── frontend/                    # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
├── package.json
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd parcel-research-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database, API keys, etc.
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb parcel_research
   
   # Load schema
   psql parcel_research < src/db/schema.sql
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`

## API Endpoints

### Properties
- `GET /api/properties/:id` - Get property details
- `GET /api/properties` - List properties with pagination

### Search
- `POST /api/search` - Advanced property search with filters
- `POST /api/search/leads` - Generate lead list

### Comps
- `GET /api/comps/:propertyId` - Find comparable properties

### Calculator
- `POST /api/calculator/roi` - Calculate ROI
- `POST /api/calculator/cashflow` - Calculate monthly cash flow
- `POST /api/calculator/mao` - Calculate Maximum Allowable Offer

### Leads
- `GET /api/leads` - Get saved lead lists
- `POST /api/leads` - Create lead list
- `POST /api/leads/:id/export` - Export leads (CSV/JSON)
- `DELETE /api/leads/:id` - Delete lead list

## Database Schema

### Core Tables
- **properties** - Parcel data (address, owner, tax value, comps, etc.)
- **users** - User accounts and authentication
- **lead_lists** - Saved lead searches and criteria
- **lead_list_items** - Properties in each lead list
- **deal_analysis** - ROI, cash flow, deal analysis
- **comps** - Comparable property relationships
- **market_data_cache** - Cached market trends
- **api_logs** - Activity tracking

See `src/db/schema.sql` for full schema documentation.

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run migrate:latest
npm run migrate:rollback
```

### Adding New Features
1. Create model in `src/models/`
2. Create service in `src/services/`
3. Create routes in `src/routes/`
4. Update database schema if needed
5. Add tests

## API Integration Status

- ✅ Local database structure
- ⏳ Zillow API integration (in progress)
- ⏳ Redfin API integration (planned)
- ⏳ County assessor data (planned)
- ⏳ Skip tracing service (planned)
- ⏳ GPT integration for AI assistant (planned)

## Roadmap

**Phase 1: Architecture** ✅
- [x] Project structure
- [x] Database schema
- [x] API scaffolding

**Phase 2: Core Features** 🔄
- [ ] Property search implementation
- [ ] Basic filtering engine
- [ ] Comps analyzer
- [ ] Deal calculator (stub routes exist)
- [ ] Lead export

**Phase 3: Data Integration**
- [ ] Zillow API connector
- [ ] Redfin data sync
- [ ] County assessor integration
- [ ] Skip tracing service

**Phase 4: Frontend** (Planned)
- [ ] React UI components
- [ ] Search interface
- [ ] Lead list builder
- [ ] Deal analyzer

## Configuration

See `.env.example` for all available configuration options:
- Database credentials
- API keys (Zillow, Google Maps, etc.)
- Redis connection
- Server port
- Log level

## Contributing

Contributions welcome! Please:
1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

MIT License - see LICENSE file

## Support

For issues, questions, or suggestions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/parcel-research-tool/issues)
- Discussions: [Ask a question](https://github.com/yourusername/parcel-research-tool/discussions)
