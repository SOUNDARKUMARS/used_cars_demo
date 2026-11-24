import { executeReadOnlyQuery } from '../db/pool.js';
import logger from '../utils/logger.js';

export const executeReadOnlySqlTool = {
  type: 'function',
  function: {
    name: 'execute_read_only_sql',
    description:
      'Execute read-only SQL query on public.cars. Always filter WHERE listing_status = \'Available\' AND is_draft = false. Filter specifically by model, make, budget, or fuel.',
    parameters: {
      type: 'object',
      properties: {
        interim_message: {
          type: 'string',
          description:
            'A tiny, friendly 1-line interim acknowledgment to display to the user while this SQL runs (e.g. "Looking up our live Tiruppur & Coimbatore stock for you...", "Checking our available Triber options right now...").'
        },
        query: {
          type: 'string',
          description:
            'SQL SELECT query. Example: SELECT id, title, make, model, year, price, price_formatted, km, fuel, transmission, location, emi, image FROM public.cars WHERE listing_status = \'Available\' AND is_draft = false AND model ILIKE \'%triber%\' LIMIT 5'
        }
      },
      required: ['interim_message', 'query']
    }
  }
};

/**
 * Normalizes rows into frontend-ready car cards if the query queried the cars table.
 */
export function extractCarCards(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && (r.title || r.model) && r.price !== undefined)
    .map((r) => ({
      id: r.id || '',
      title: r.title || `${r.year || ''} ${r.make || ''} ${r.model || ''}`.trim(),
      make: r.make || '',
      model: r.model || '',
      variant: r.variant || '',
      year: r.year || null,
      price: Number(r.price) || 0,
      priceFormatted: r.price_formatted || (r.price ? `₹ ${Number(r.price).toLocaleString('en-IN')}` : ''),
      km: r.km || (r.km_numeric ? `${r.km_numeric.toLocaleString('en-IN')} km` : ''),
      fuel: r.fuel || '',
      transmission: r.transmission || '',
      bodyType: r.body_type || '',
      location: r.location || '',
      image: r.image || '',
      detailHeroImage: r.detail_hero_image || r.image || '',
      gallery: Array.isArray(r.gallery) && r.gallery.length > 0
        ? r.gallery
        : (r.image ? [{ id: 'hero-cover', label: 'Exterior Front', category: 'exterior', image: r.image, thumb: r.image }] : []),
      keyFeatures: r.key_features || r.keyFeatures || [],
      specs: r.specs || {},
      aboutSummary: r.about_summary || r.aboutSummary || '',
      aboutFull: r.about_full || r.aboutFull || '',
      inspectionGrade: r.inspection_grade || 'A',
      inspectedBadge: r.inspected_badge || 'Inspected & Verified',
      emi: r.emi || '',
      emiNumeric: Number(r.emi_numeric) || null,
      inspected: r.inspected ?? true,
      ownership: r.ownership || '1st Owner',
      listingStatus: r.listing_status || 'Available'
    }));
}

/**
 * Sanitizes and compacts rows sent back to LLM to preserve context window and tokens.
 * Only returns the core conversational fields (~30 tokens per car instead of 400).
 */
function compactRowForLlm(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    title: row.title || `${row.year || ''} ${row.make || ''} ${row.model || ''}`.trim(),
    price: row.price_formatted || (row.price ? `₹${Number(row.price).toLocaleString('en-IN')}` : ''),
    km: row.km || (row.km_numeric ? `${row.km_numeric} km` : ''),
    fuel: row.fuel || '',
    trans: row.transmission || '',
    loc: row.location || ''
  };
}

/**
 * Tool execution handler
 */
export async function handleExecuteReadOnlySql(args) {
  const { query, interim_message } = args || {};
  if (!query) {
    return {
      success: false,
      error: 'Missing required "query" parameter'
    };
  }

  try {
    const result = await executeReadOnlyQuery(query);
    const carCards = extractCarCards(result.rows);
    // Send maximum top 4 cars in ultra-compact format to LLM to save token cost
    const compactRows = (result.rows || []).slice(0, 4).map(compactRowForLlm);

    return {
      success: true,
      count: result.rowCount,
      sql: result.sql,
      durationMs: result.durationMs,
      rows: compactRows,
      extractedCars: carCards,
      interimMessage: interim_message || ''
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      attemptedSql: query
    };
  }
}

export default {
  tool: executeReadOnlySqlTool,
  handler: handleExecuteReadOnlySql,
  extractCarCards
};
