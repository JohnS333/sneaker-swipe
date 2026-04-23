import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type CheckoutItem = {
  id?: string;
  listingID?: string;
};

type CheckoutRequestBody = {
  items?: CheckoutItem[];
};

type OrderRow = {
  userID: string;
  listingID: string;
  datetime: string;
};

var generatedIDs: string[] = [];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getListingID(item: CheckoutItem): string | null {
  if (typeof item.listingID === "string" && isUuid(item.listingID.trim())) {
    return item.listingID.trim();
  }

  if (typeof item.id === "string" && isUuid(item.id.trim())) {
    return item.id.trim();
  }

  // if item doesnt havea listingid, just generate one for now
  const newID = crypto.randomUUID();
  generatedIDs.push(newID);
  return newID;

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
      datetime: new Date().toISOString(),
    }];
  });
}


export async function POST(request: Request) {
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

  const { error: insertError } = await supabase.from("orders").insert(orderRows);

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500, headers: corsHeaders }
    );
  }

//   const { count: totalOrderCount, error: countError } = await supabase
//     .from("orders")
//     .select("listingID", { count: "exact", head: true })
//     .eq("userID", user.id);

//   if (countError) {
//     return NextResponse.json(
//       { ok: false, error: countError.message },
//       { status: 500, headers: corsHeaders }
//     );
//   }


  return NextResponse.json(
    {
      ok: true,
      insertedOrders: orderRows.length,
      generatedIDs: generatedIDs,
    },
    { status: 200, headers: corsHeaders }
  );
}