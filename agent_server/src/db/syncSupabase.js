import { pool } from './pool.js';
import logger from '../utils/logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qkriofsteqxccheavuot.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcmlvZnN0ZXF4Y2NoZWF2dW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwOTQ3MjAsImV4cCI6MjExMDY3MDcyMH0.7fcsAwqZlWz3XAmeKkdvrIvB-xhrOOOM0szwwrcCH_0';

export async function syncCarsFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, 'Failed to fetch cars from Supabase');
      return { success: false, count: 0 };
    }

    const supabaseCars = await res.json();
    if (!Array.isArray(supabaseCars)) return { success: false, count: 0 };

    for (const c of supabaseCars) {
      const upsertSql = `
        INSERT INTO public.cars (
          id, make, model, year, variant, title, price, price_formatted,
          emi, emi_numeric, inspected, inspected_badge, home_inspected_badge,
          km, km_numeric, fuel, transmission, ownership, location, body_type,
          color, insurance, rto, image, cutout_image, detail_hero_image,
          gallery, total_photos, about_summary, about_full, key_features,
          extended_features, condition_history, dealer_id, dealer, listing_status,
          is_draft, show_in_hero, emi_available, emi_down_payment, emi_interest_rate,
          emi_tenure_months, emi_note
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35, $36,
          $37, $38, $39, $40, $41,
          $42, $43
        )
        ON CONFLICT (id) DO UPDATE SET
          make = EXCLUDED.make,
          model = EXCLUDED.model,
          year = EXCLUDED.year,
          variant = EXCLUDED.variant,
          title = EXCLUDED.title,
          price = EXCLUDED.price,
          price_formatted = EXCLUDED.price_formatted,
          emi = EXCLUDED.emi,
          emi_numeric = EXCLUDED.emi_numeric,
          inspected = EXCLUDED.inspected,
          km = EXCLUDED.km,
          km_numeric = EXCLUDED.km_numeric,
          fuel = EXCLUDED.fuel,
          transmission = EXCLUDED.transmission,
          ownership = EXCLUDED.ownership,
          location = EXCLUDED.location,
          body_type = EXCLUDED.body_type,
          color = EXCLUDED.color,
          image = EXCLUDED.image,
          listing_status = EXCLUDED.listing_status,
          dealer = EXCLUDED.dealer,
          is_draft = EXCLUDED.is_draft,
          updated_at = timezone('utc'::text, now())
      `;

      await pool.query(upsertSql, [
        c.id, c.make || '', c.model || '', c.year || 2020, c.variant || '', c.title || '',
        c.price || 0, c.price_formatted || '', c.emi || '', c.emi_numeric || null,
        c.inspected ?? true, c.inspected_badge || 'Inspected & Verified', c.home_inspected_badge || 'Inspected',
        c.km || '0 km', c.km_numeric || 0, c.fuel || 'Petrol', c.transmission || 'Manual',
        c.ownership || '1st Owner', c.location || 'Tiruppur, Tamil Nadu', c.body_type || 'Hatchback',
        c.color || 'White', c.insurance || '', c.rto || '', c.image || '',
        c.cutout_image || '', c.detail_hero_image || '',
        JSON.stringify(c.gallery || []), c.total_photos || 0, c.about_summary || '',
        c.about_full || '', JSON.stringify(c.key_features || []),
        JSON.stringify(c.extended_features || []), JSON.stringify(c.condition_history || []),
        c.dealer_id || 'nova-tiruppur', JSON.stringify(c.dealer || null), c.listing_status || 'Available',
        c.is_draft ?? false, c.show_in_hero ?? false, c.emi_available ?? true,
        c.emi_down_payment || null, c.emi_interest_rate || null, c.emi_tenure_months || null,
        c.emi_note || null
      ]);
    }

    // Remove local cars that no longer exist in Supabase (keep database 100% in sync)
    if (supabaseCars.length > 0) {
      const activeIds = supabaseCars.map((c) => c.id);
      await pool.query(
        'DELETE FROM public.cars WHERE id NOT IN (SELECT unnest($1::text[]))',
        [activeIds]
      );
    }

    logger.info({ count: supabaseCars.length }, 'Synchronized inventory from Supabase (purged stale local entries)');
    return { success: true, count: supabaseCars.length };
  } catch (err) {
    logger.error({ err: err.message }, 'Error syncing from Supabase');
    return { success: false, error: err.message };
  }
}

/**
 * Start periodic background sync every 30 seconds
 */
export function startPeriodicSync(intervalMs = 30000) {
  syncCarsFromSupabase();
  return setInterval(syncCarsFromSupabase, intervalMs);
}

export default { syncCarsFromSupabase, startPeriodicSync };
