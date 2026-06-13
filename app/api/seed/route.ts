import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { seedAll } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { user, supabase } = auth!;

    const body = await request.json().catch(() => ({}));
    const results = await seedAll(supabase, user.id, {
      capabilityChunks: body.capabilityChunks ?? false,
    });

    return NextResponse.json({
      success: true,
      seeded: {
        bidHistory: results.bidHistory,
        evaluationTaxonomy: results.evaluationTaxonomy,
        capabilityRecords: results.capabilityRecords,
        capabilityChunks: results.capabilityChunks,
        companyDocuments: results.companyDocuments,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
