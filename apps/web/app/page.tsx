import SwipeCards from "@/components/swipe-cards";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  // tutorial data fetch.
  // const { data: todos } = await supabase.from('todos').select()

  return <SwipeCards />;
}
