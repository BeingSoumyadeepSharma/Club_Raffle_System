# 🎲 Raffle Club - Party Raffle System

A monorepo application for managing party raffle systems with support for multiple club entities.

## Features

- **Entity-based System**: Create and manage multiple club entities (e.g., GODFATHER'S CLUB, VIP LOUNGE, etc.)
- **Ticket Management**: Purchase tickets for any entity with automatic numbering
- **Receipt Generation**: Beautiful formatted receipts with customizable club branding
- **Raffle Management**: Create raffles, sell tickets, and draw winners
- **RESTful API**: Full Express.js backend with comprehensive endpoints

## Project Structure

```
raffle-godfather/
├── packages/
│   ├── shared/           # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/    # TypeScript interfaces
│   │   │   └── utils/    # Receipt generator
│   │   └── package.json
│   └── backend/          # Express.js API server
│       ├── src/
│       │   ├── data/     # In-memory data store
│       │   ├── services/ # Business logic
│       │   └── routes/   # API routes
│       └── package.json
└── package.json          # Root monorepo config
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Install all dependencies
npm install

# Build shared package
npm run build --workspace=@raffle/shared
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Entities (Clubs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entities` | List all entities |
| GET | `/api/entities/:id` | Get entity by ID |
| POST | `/api/entities` | Create new entity |
| PUT | `/api/entities/:id` | Update entity |
| DELETE | `/api/entities/:id` | Delete entity |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/purchase` | Purchase tickets |
| GET | `/api/tickets/purchases` | List all purchases |
| GET | `/api/tickets/purchases/:id` | Get purchase by ID |
| GET | `/api/tickets/purchases/:id/receipt` | Get receipt (JSON) |
| GET | `/api/tickets/purchases/:id/receipt/text` | Get receipt (plain text) |
| GET | `/api/tickets/purchases/entity/:entityId` | Get purchases by entity |

### Raffles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/raffles` | List all raffles |
| GET | `/api/raffles/:id` | Get raffle by ID |
| POST | `/api/raffles` | Create new raffle |
| PUT | `/api/raffles/:id` | Update raffle |
| DELETE | `/api/raffles/:id` | Delete raffle |
| POST | `/api/raffles/:id/draw` | Draw winner |

## Example Usage

### Create a New Club Entity

```bash
curl -X POST http://localhost:3000/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vip-lounge",
    "displayName": "VIP LOUNGE",
    "emoji": "🎰",
    "tagline": "Where winners play!"
  }'
```

### Purchase Tickets

```bash
curl -X POST http://localhost:3000/api/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "godfather-club",
    "buyerName": "John Doe",
    "rafflerName": "Mike Smith",
    "ticketCount": 5,
    "pricePerTicket": 100
  }'
```

### Sample Receipt Output

```
🎲 GODFATHER'S CLUB ʀᴀꜰꜰʟᴇ 🎲
Thanks for your Purchase.. and good luck~
~~~~~~~~~~~~~~~~~~~~~
Buyer: John Doe
Tickets purchased: 5
Price per ticket: $100
Total Price: $500
Ticket Numbers: 1-5
Raffler Name: Mike Smith
~~~~~~~~~~~~~~~~~~~~~
```

### Create a Raffle

```bash
curl -X POST http://localhost:3000/api/raffles \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "godfather-club",
    "name": "New Year Grand Prize",
    "prizeDescription": "Brand New Tesla Model 3",
    "ticketPrice": 100,
    "maxTickets": 500
  }'
```

### Draw a Winner

```bash
curl -X POST http://localhost:3000/api/raffles/{raffleId}/draw
```

## Default Entity

The system comes pre-configured with the **GODFATHER'S CLUB** entity:

- **ID**: `godfather-club`
- **Display Name**: `GODFATHER'S CLUB`
- **Emoji**: `🎲`
- **Tagline**: `Thanks for your Purchase.. and good luck~`

## License

MIT
