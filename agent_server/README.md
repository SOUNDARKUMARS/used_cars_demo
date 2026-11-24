# Harsha Cars AI Agent Server

Modular, high-performance Node.js backend agent for **Harsha cars** pre-owned vehicle dealership in Tamil Nadu (Tiruppur & Coimbatore hubs).

Adapted and streamlined from the reference `esan_agent_server`, this agent replaces complex multi-tool food catalog logic with a single, ultra-fast, strictly read-only SQL tool (`execute_read_only_sql`) running on the vehicle inventory database.

## Architecture

- **Runtime**: Fastify (Node.js ESM)
- **Database**: PostgreSQL (`harsha_cars` database) with strictly read-only SQL execution and transaction isolation (`BEGIN READ ONLY`)
- **Primary AI Model**: `deepseek/deepseek-v4.1-flash` via OpenRouter (with automatic fallback to `gpt-4o-mini` if credit exhausted)
- **Tooling**: Single unified `execute_read_only_sql` tool that dynamically queries `cars`, `dealers`, and inventory specs using pure SQL.

## Security & Read-Only Enforcement

The `execute_read_only_sql` tool strictly enforces read-only access:
1. Rejects any non-SELECT statements (blocks `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`, etc.).
2. Rejects multiple statements (blocks semicolon injection).
3. Executes inside a PostgreSQL read-only transaction (`BEGIN READ ONLY; SET LOCAL statement_timeout = '4000ms'`).
4. Enforces a maximum result limit (`LIMIT 25`) to preserve context and speed.

## Endpoints

- `GET /health` - Service health and database connection status.
- `POST /api/v1/agent/chat` - Standard JSON chat request.
  ```json
  {
    "prompt": "Show me petrol cars under 6 lakhs",
    "sessionId": "session_123"
  }
  ```
- `POST /api/v1/agent/chat/stream` - Server-Sent Events (SSE) streaming (`agent:status`, `agent:sql`, `agent:cars`, `agent:text_delta`, `agent:done`).
- `GET /api/v1/agent/cars` - Instant catalog retrieval.
- `GET /api/v1/agent/messages/:sessionId` - Conversation history for a session.

## Running the Server

From the root of `used_car/site`:

```bash
# Run tests
npm run agent:test

# Start production agent server
npm run agent:start

# Start development mode (with hot reloading)
npm run agent:dev
```
