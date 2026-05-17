export type { SavedOutfit } from '@/lib/supabase/wardrobe'
export {
  deleteOutfitFromDatabase as deleteOutfitFromWardrobe,
  fetchSavedOutfits as getSavedOutfits,
  saveOutfitToDatabase as saveOutfitToWardrobe,
} from '@/lib/supabase/wardrobe'
