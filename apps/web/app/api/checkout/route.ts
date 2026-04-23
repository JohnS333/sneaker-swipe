import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type CheckoutItem = {
  id?: number | string;
  listingID?: string;
  quantity?: number;
};

type CheckoutRequestBody = {
  items?: CheckoutItem[];
};

type OrderRow = {
  userID: string;
  listingID: string;
};

// type VectorPointResponse = {
//   vector?: number[] | Record<string, number[]>;
//   result?: Array<{ vector?: number[] | Record<string, number[]> }>;
// };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const VECTOR_SERVICE_URL = process.env.VECTOR_SERVICE_URL ?? "http://vectordb.gageserver.net";

function getListingID(item: CheckoutItem): string | null {
  if (typeof item.listingID === "string" && item.listingID.trim()) {
    return item.listingID.trim();
  }

  if (typeof item.id === "string" && item.id.trim()) {
    return item.id.trim();
  }

  if (typeof item.id === "number" && Number.isFinite(item.id)) {
    return String(item.id);
  }

  return null;
}

function expandCartItems(items: CheckoutItem[]): OrderRow[] {
  return items.flatMap((item) => {
    const listingID = getListingID(item);

    if (!listingID) {
      return [];
    }

    return [{
      listingID,
      userID: "",
    }];
  });
}

// function extractVectorFromResponse(response: unknown): number[] | null {
//   if (Array.isArray(response)) {
//     return extractVectorFromResponse(response[0]);
//   }

//   if (!response || typeof response !== "object") {
//     return null;
//   }

//   const typedResponse = response as VectorPointResponse & Record<string, unknown>;
//   const directVector = typedResponse.vector;

//   if (Array.isArray(directVector) && directVector.every((value) => typeof value === "number")) {
//     return directVector;
//   }

//   if (directVector && typeof directVector === "object") {
//     const firstVector = Object.values(directVector).find(
//       (value): value is number[] => Array.isArray(value) && value.every((entry) => typeof entry === "number")
//     );

//     if (firstVector) {
//       return firstVector;
//     }
//   }

//   if (Array.isArray(typedResponse.result) && typedResponse.result.length > 0) {
//     return extractVectorFromResponse(typedResponse.result[0]);
//   }

//   if ("points" in typedResponse && Array.isArray((typedResponse as { points?: unknown[] }).points)) {
//     const firstPoint = (typedResponse as { points?: unknown[] }).points?.[0];
//     return extractVectorFromResponse(firstPoint);
//   }

//   return null;
// }

// function averageVectors(vectors: number[][]): number[] {
//   if (vectors.length === 0) {
//     throw new Error("No vectors available to average");
//   }

//   const vectorLength = vectors[0]?.length ?? 0;
//   if (vectorLength === 0) {
//     throw new Error("Vectors are empty");
//   }

//   const sum = new Array(vectorLength).fill(0);

//   for (const vector of vectors) {
//     if (vector.length !== vectorLength) {
//       throw new Error("Vector length mismatch while averaging preference vector");
//     }

//     for (let index = 0; index < vectorLength; index += 1) {
//       sum[index] += vector[index];
//     }
//   }

//   return sum.map((value) => value / vectors.length);
// }

// async function fetchListingVector(listingID: string): Promise<number[]> {
//   const response = await fetch(`${VECTOR_SERVICE_URL}/vector/${listingID}`);

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`Failed to fetch vector for ${listingID}: ${response.status} ${errorText}`);
//   }

//   const payload = (await response.json()) as unknown;
//   const vector = extractVectorFromResponse(payload);

//   if (!vector) {
//     throw new Error(`Vector payload for ${listingID} did not contain a usable vector`);
//   }

//   return vector;
// }

// async function savePreferenceVector(userID: string, vector: number[], sourceListingIDs: string[]) {

//     // const res = await fetch("http://vectordb.gageserver.net/add-vector-raw", {
//     //     method: "POST",
//     //     headers: { "Content-Type": "application/json" },
//     //     body: {"id": userID, "vector": vector} // endpoint expects List[TextItem]
//     //     });

//   if (!res.ok) {
//     const errorText = await res.text();
//     throw new Error(`Failed to upsert preference vector into Qdrant: ${res.status} ${errorText}`);
//   }
// }

// export async function OPTIONS() {
//   return new NextResponse(null, { status: 204, headers: corsHeaders });
// }

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables" },
      { status: 500, headers: corsHeaders }
    );
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: authError?.message ?? "No user in session" },
      { status: 401, headers: corsHeaders }
    );
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "items is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const orderRows = expandCartItems(items).map((row) => ({
    ...row,
    userID: user.id,
  }));

  if (orderRows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid listing IDs were provided" },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: insertError } = await supabaseAdmin.from("orders").insert(orderRows);

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500, headers: corsHeaders }
    );
  }

  const { count: totalOrderCount, error: countError } = await supabaseAdmin
    .from("orders")
    .select("listingID", { count: "exact", head: true })
    .eq("userID", user.id);

  if (countError) {
    return NextResponse.json(
      { ok: false, error: countError.message },
      { status: 500, headers: corsHeaders }
    );
  }

  const preferenceVectorResult: {
    updated: boolean;
    message?: string;
  } = { updated: false };

//   const orderCount = totalOrderCount ?? 0;

//   if (orderCount >= 5) {
//     try {
//       const { data: recentOrders, error: recentOrdersError } = await supabaseAdmin
//         .from("orders")
//         .select("listingID")
//         .eq("userID", user.id)
//         .order("created_at", { ascending: false })
//         .limit(5);

//       if (recentOrdersError) {
//         throw recentOrdersError;
//       }

//       const recentListingIDs = (recentOrders ?? [])
//         .map((order) => order.listingID)
//         .filter((listingID): listingID is string => typeof listingID === "string" && listingID.trim().length > 0);

//       if (recentListingIDs.length === 5) {
//         const vectors = await Promise.all(recentListingIDs.map((listingID) => fetchListingVector(listingID)));
//         const averageVector = averageVectors(vectors);
//         await savePreferenceVector(user.id, averageVector, recentListingIDs);
//         preferenceVectorResult.updated = true;
//       } else {
//         preferenceVectorResult.message = "Not enough valid listing vectors to update preference vector";
//       }
//     } catch (error) {
//       preferenceVectorResult.message = (error as Error).message;
//       console.error("Preference vector update skipped:", error);
//     }
//   }

  return NextResponse.json(
    {
      ok: true,
      insertedOrders: orderRows.length,
      totalOrderCount,
      preferenceVector: preferenceVectorResult,
    },
    { status: 200, headers: corsHeaders }
  );
}