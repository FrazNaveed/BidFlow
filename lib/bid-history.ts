import type { SupabaseClient } from "@supabase/supabase-js";

export interface BidHistoryStats {
  historicalWinRate: number;
  competitorRisk: number;
  budgetAlignment: number;
  domain: string;
  sampleSize: number;
}

function parseBudgetAmount(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/\$?([\d.]+)\s*(million|M|billion|B|thousand|K)?/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "million" || unit === "m") value *= 1_000_000;
  else if (unit === "billion" || unit === "b") value *= 1_000_000_000;
  else if (unit === "thousand" || unit === "k") value *= 1_000;
  return value;
}

export async function getBidHistoryStats(
  supabase: SupabaseClient,
  domain: string,
  rfpBudgetText?: string | null
): Promise<BidHistoryStats> {
  const normalizedDomain = domain?.toLowerCase() || "it services";

  const { data: domainBids } = await supabase
    .from("bid_history")
    .select("*")
    .ilike("domain", `%${normalizedDomain.split(" ")[0]}%`);

  const { data: allBids } = await supabase.from("bid_history").select("*");

  const bids = domainBids && domainBids.length >= 5 ? domainBids : allBids || [];

  if (bids.length === 0) {
    return {
      historicalWinRate: 45,
      competitorRisk: 60,
      budgetAlignment: 70,
      domain: normalizedDomain,
      sampleSize: 0,
    };
  }

  const wins = bids.filter((b) => b.outcome?.toLowerCase() === "win");
  const historicalWinRate = Math.round((wins.length / bids.length) * 100);

  const avgCompetitors =
    bids.reduce((s, b) => s + (b.competitor_count || 3), 0) / bids.length;
  const winCompetitors =
    wins.length > 0
      ? wins.reduce((s, b) => s + (b.competitor_count || 3), 0) / wins.length
      : avgCompetitors;
  const competitorRisk = Math.min(
    100,
    Math.round(100 - (winCompetitors / Math.max(avgCompetitors, 1)) * 30 - historicalWinRate * 0.3)
  );

  const rfpBudget = parseBudgetAmount(rfpBudgetText);
  let budgetAlignment = 75;

  if (rfpBudget) {
    const values = bids
      .map((b) => b.contract_value as number)
      .filter((v) => v > 0);
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const ratio = rfpBudget / avg;
      if (ratio >= 0.5 && ratio <= 2) budgetAlignment = 90;
      else if (ratio >= 0.25 && ratio <= 4) budgetAlignment = 70;
      else budgetAlignment = 40;
    }
  }

  return {
    historicalWinRate,
    competitorRisk,
    budgetAlignment,
    domain: normalizedDomain,
    sampleSize: bids.length,
  };
}
