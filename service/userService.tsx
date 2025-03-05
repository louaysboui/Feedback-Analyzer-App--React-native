import { supabase } from "../lib/supabase"; // Adjust the path as necessary

export const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    return null;
  }

  return data;
};