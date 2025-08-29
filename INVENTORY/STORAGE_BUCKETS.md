# Storage Buckets

## exercise-media
- **Public**: true
- **Purpose**: Exercise GIFs (and future images/videos)
- **Structure**:
  - `gif/<external_id>.gif`
- **Public URL prefix**:
  - `https://lrcrmmquuwphxispctgq.supabase.co/storage/v1/object/public/exercise-media/`
- **Client usage**:
  - `img.src = VITE_SUPABASE_URL + '/storage/v1/object/public/exercise-media/' + 'gif/<external_id>.gif'`
