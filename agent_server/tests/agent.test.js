import assert from 'node:assert';
import { validateReadOnlySql, executeReadOnlyQuery } from '../src/db/pool.js';
import { handleExecuteReadOnlySql } from '../src/tools/executeReadOnlySql.js';
import agentEngine from '../src/agent/agent.engine.js';
import { buildApp } from '../src/server.js';

async function runTests() {
  console.log('🚀 Starting Harsha Cars Agent Server Test Suite...\n');

  // TEST 1: SQL Read-Only Validation Security Checks
  console.log('--- TEST 1: SQL Read-Only Validation & Security Checks ---');
  {
    // Valid SELECT
    const validSql1 = "SELECT id, title, price FROM cars WHERE price < 600000";
    const res1 = validateReadOnlySql(validSql1);
    assert(res1.includes('SELECT') && res1.includes('LIMIT'), 'Should append LIMIT if omitted');
    console.log('✅ Valid SELECT query permitted and normalized');

    // Valid WITH ... SELECT
    const validSql2 = "WITH cheap_cars AS (SELECT * FROM cars WHERE price < 500000) SELECT * FROM cheap_cars";
    const res2 = validateReadOnlySql(validSql2);
    assert(res2.includes('cheap_cars'), 'Should allow CTE queries');
    console.log('✅ CTE (WITH ... SELECT) query permitted');

    // Block INSERT
    assert.throws(() => {
      validateReadOnlySql("INSERT INTO cars (title) VALUES ('Hacked')");
    }, /Only SELECT queries are allowed|Forbidden SQL keyword detected/);
    console.log('✅ Forbidden INSERT blocked');

    // Block DROP TABLE
    assert.throws(() => {
      validateReadOnlySql("DROP TABLE cars");
    }, /Only SELECT queries are allowed|Forbidden SQL keyword detected/);
    console.log('✅ Forbidden DROP TABLE blocked');

    // Block UPDATE
    assert.throws(() => {
      validateReadOnlySql("UPDATE cars SET price = 100 WHERE id = 'car-1'");
    }, /Only SELECT queries are allowed|Forbidden SQL keyword detected/);
    console.log('✅ Forbidden UPDATE blocked');

    // Block DELETE
    assert.throws(() => {
      validateReadOnlySql("DELETE FROM cars");
    }, /Only SELECT queries are allowed|Forbidden SQL keyword detected/);
    console.log('✅ Forbidden DELETE blocked');

    // Block multiple statements (SQL injection attempt with semicolon)
    assert.throws(() => {
      validateReadOnlySql("SELECT * FROM cars; DROP TABLE cars;");
    }, /Multiple SQL statements are strictly forbidden/);
    console.log('✅ Semicolon injection blocked');
  }

  // TEST 2: Read-Only DB Execution
  console.log('\n--- TEST 2: Database Query Execution ---');
  {
    const start = Date.now();
    const res = await executeReadOnlyQuery("SELECT id, title, price, fuel, location FROM cars WHERE listing_status = 'Available' ORDER BY price ASC LIMIT 5");
    const duration = Date.now() - start;
    assert(res.rowCount > 0, 'Database should return available cars');
    assert(Array.isArray(res.rows), 'Rows should be an array');
    console.log(`✅ DB Query returned ${res.rowCount} cars in ${duration}ms`);
    console.log(`   Sample car: "${res.rows[0].title}" - ₹${Number(res.rows[0].price).toLocaleString('en-IN')}`);
  }

  // TEST 3: Tool Execution & Entity Extraction
  console.log('\n--- TEST 3: Tool Handler & Car Card Extraction ---');
  {
    const toolRes = await handleExecuteReadOnlySql({
      query: "SELECT id, title, price, price_formatted, year, km, fuel, transmission, body_type, location, image FROM cars WHERE fuel = 'Petrol' AND price <= 600000 LIMIT 3"
    });
    assert(toolRes.success === true, 'Tool execution must succeed');
    assert(toolRes.extractedCars.length > 0, 'Should extract formatted car cards');
    console.log(`✅ Tool successfully extracted ${toolRes.extractedCars.length} formatted car cards`);
    console.log(`   First card: ${toolRes.extractedCars[0].title} | ${toolRes.extractedCars[0].fuel} | ${toolRes.extractedCars[0].priceFormatted}`);
  }

  // TEST 4: Fastify HTTP Server Health and Cars Endpoints
  console.log('\n--- TEST 4: HTTP API Health & Cars Endpoints ---');
  {
    const app = await buildApp();

    const healthRes = await app.inject({ method: 'GET', url: '/health' });
    assert.strictEqual(healthRes.statusCode, 200);
    const healthJson = healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');
    assert.strictEqual(healthJson.database, 'connected');
    console.log('✅ GET /health returned 200 OK with connected DB');

    const carsRes = await app.inject({ method: 'GET', url: '/api/v1/agent/cars' });
    assert.strictEqual(carsRes.statusCode, 200);
    const carsJson = carsRes.json();
    assert(carsJson.count > 0, 'Cars count should be > 0');
    console.log(`✅ GET /api/v1/agent/cars returned ${carsJson.count} cars`);

    await app.close();
  }

  // TEST 5: End-to-End AI Agent with DeepSeek V4.1 Flash
  console.log('\n--- TEST 5: End-to-End AI Agent Test (DeepSeek V4.1 Flash) ---');
  {
    const queries = [
      "Hi, what petrol cars do you have under 6 lakhs?",
      "Do you have any automatic cars or SUVs available in Tiruppur or Coimbatore?",
      "Tell me about your Honda City"
    ];

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      console.log(`\nTesting Query ${i + 1}: "${q}"`);
      const start = Date.now();
      const result = await agentEngine.run({
        prompt: q,
        sessionId: `test_session_${i + 1}`
      });
      const duration = Date.now() - start;

      console.log(`⏱️ Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`🔍 SQL Queries Executed:`, result.sqlQueries);
      console.log(`🚗 Extracted Cars Found: ${result.cars.length}`);
      console.log(`💬 Agent Response Preview:\n${result.text.slice(0, 300)}...`);

      assert(result.text && result.text.length > 20, 'Agent should provide a detailed response');
      assert(result.sqlQueries.length > 0, 'Agent should have executed read-only SQL queries');
      console.log(`✅ Query ${i + 1} passed successfully!`);
    }
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
