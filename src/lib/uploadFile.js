import { supabase } from '@/lib/customSupabaseClient';

/**
 * Supabase Storage'a dosya yükler ve erişim URL'ini döner.
 *
 * @param {string} bucket   Storage bucket adı (örn: "avatars")
 * @param {File|Blob} file  Yüklenecek dosya
 * @param {{ id: string }} user Kullanıcı objesi
 * @param {object} options  Ek ayarlar
 * @returns {Promise<{ url: string; path: string; fileName: string }>}
 */
export async function uploadFile(bucket, file, user, options = {}) {
  if (!bucket) throw new Error('Bucket is required');
  if (!file) throw new Error('No file provided');
  if (!user?.id) throw new Error('No user provided');

  const {
    dir,
    visibility = 'public',
    maxSize = 20 * 1024 * 1024, // 20MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    signExpiresIn = 3600,
    cacheControl = '3600',
  } = options;

  // Boyut/mime kontrolü
  const size = Number(file.size ?? 0);
  if (size <= 0) throw new Error('Empty file');
  if (size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024);
    throw new Error(`File too large. Max ${mb}MB allowed.`);
  }

  const mime = String(file.type || 'application/octet-stream').toLowerCase();
  if (allowedTypes.length && !allowedTypes.includes(mime)) {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  // Güvenli dosya adı üretimi
  const originalName = String(file.name ?? 'unnamed');
  const byNameExt = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : '';
  const byMimeExt = mime.includes('/') ? mime.split('/')[1]?.toLowerCase() : '';
  const ext = (byNameExt || byMimeExt || 'bin').replace(/[^a-z0-9]+/g, '');

  const uuid =
    (typeof crypto !== 'undefined' && crypto?.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const baseNameRaw = originalName.split('.').slice(0, -1).join('.') || 'file';
  const safeBase = baseNameRaw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const fileName = `${safeBase || 'file'}-${uuid}.${ext}`;
  const baseDir = dir ? String(dir).replace(/^\/+|\/+$/g, '') : `public/${user.id}`;
  const filePath = `${baseDir}/${fileName}`;

  // Yükleme
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl,
      upsert: false,
      contentType: mime,
    });

  if (uploadError) {
    console.error(`Error uploading to ${bucket}:`, uploadError);
    throw new Error(uploadError.message || `Failed to upload to ${bucket}.`);
  }

  // URL üretimi
  if (visibility === 'signed') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, signExpiresIn);

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error);
      throw new Error(error?.message || 'Failed to create signed URL.');
    }
    return { url: data.signedUrl, path: filePath, fileName };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error('Public URL not generated');

  return { url: publicUrl, path: filePath, fileName };
}