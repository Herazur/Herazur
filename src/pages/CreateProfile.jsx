import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Image as ImageIcon, Save, Loader2, Trash2, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageCropDialog from '@/components/ImageCropDialog';
import { uploadFile } from '@/lib/uploadFile';
import getCroppedImg from '@/lib/cropImage';
import { countries } from '@/lib/countries';
import { supabase } from '@/lib/customSupabaseClient';
import { findInvalidSocialLink, sanitizeSocialLinks } from '@/lib/sanitize';

const socialPlatforms = [
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'medium', label: 'Medium' },
  { value: 'behance', label: 'Behance' },
  { value: 'website', label: 'Website' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const SESSION_STORAGE_KEY = 'createProfileForm';

const CreateProfile = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { tags: allTags, loading: dataLoading, createProfile } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      username: '',
      tagline: '',
      bio: '',
      tags: [],
      links: [],
      gender: '',
      country: '',
      referral_code: '',
    },
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [isCropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropType, setCropType] = useState('avatar');
  const [originalFile, setOriginalFile] = useState(null);
  const [canUseAnimatedGif, setCanUseAnimatedGif] = useState(false);
  const [formHydrated, setFormHydrated] = useState(false);

  const watchedForm = watch();

  useEffect(() => {
    if (!formHydrated) return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(watchedForm));
    } catch (error) {
      console.warn('Could not save form state to session storage:', error);
    }
  }, [watchedForm, formHydrated]);

  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
      }
    } catch (error) {
      console.warn('Could not load form state from session storage:', error);
    } finally {
      setFormHydrated(true);
    }
  }, [reset]);

  const selectedTags = watch('tags');
  const socialLinks = watch('links');

  useEffect(() => {
    const checkGifPermission = async () => {
      if (profile?.id) {
        try {
          const { data: boosts, error } = await supabase
            .from('user_boosts')
            .select('boost_type_id')
            .eq('profile_id', profile.id)
            .gte('end_at', new Date().toISOString());

          if (!error && boosts) {
            const hasGifPermission = boosts.some(boost =>
              boost.boost_type_id?.includes('ultimate_presence_90d') ||
              boost.boost_type_id?.includes('monthly_spotlight_30d') ||
              boost.boost_type_id?.includes('quick_boost_12h')
            );
            setCanUseAnimatedGif(hasGifPermission);
          }
        } catch (error) {
          console.error('Error checking GIF permission:', error);
          setCanUseAnimatedGif(false);
        }
      } else {
        setCanUseAnimatedGif(false);
      }
    };

    checkGifPermission();
  }, [profile?.id]);

  const popularTagNames = useMemo(
    () =>
      Array.isArray(allTags)
        ? allTags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
        : [],
    [allTags]
  );

  useEffect(() => {
    if (!authLoading && profile) {
      navigate(`/u/${profile.username}`);
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
      if (cropImage && cropImage.startsWith('blob:')) URL.revokeObjectURL(cropImage);
    };
  }, [avatarPreview, bannerPreview, cropImage]);

    const handleImageSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `The selected image is larger than ${MAX_FILE_SIZE / 1024 / 1024}MB. Please select a smaller file.`,
          variant: 'destructive',
        });
        e.target.value = null;
        return;
      }
      
      const isGif = file.type === 'image/gif';
      setOriginalFile(file);
      if (cropImage) URL.revokeObjectURL(cropImage);
      const imageUrl = URL.createObjectURL(file);
      setCropImage(imageUrl);
      setCropType(type);
      
      if (isGif && canUseAnimatedGif) {
        const fileSetter = type === 'avatar' ? setAvatarFile : setBannerFile;
        const previewSetter = type === 'avatar' ? setAvatarPreview : setBannerPreview;
        const oldPreview = type === 'avatar' ? avatarPreview : bannerPreview;
        
        fileSetter(file);
        previewSetter(imageUrl);
        if (oldPreview && oldPreview.startsWith('blob:')) {
          URL.revokeObjectURL(oldPreview);
        }
        
        toast({
          title: 'GIF Uploaded!',
          description: 'Your animated GIF has been uploaded successfully.',
        });
      } else {
        setCropOpen(true);
      }
    }
    e.target.value = null;
  };

    const onCropComplete = useCallback(
    async (croppedAreaPixels, isAnimatedGif, rotation) => {
      const fileSetter = cropType === 'avatar' ? setAvatarFile : setBannerFile;
      const previewSetter = cropType === 'avatar' ? setAvatarPreview : setBannerPreview;
      const oldPreview = cropType === 'avatar' ? avatarPreview : bannerPreview;

      let finalFile;
      let newPreviewUrl = '';
      
      if (isAnimatedGif && originalFile) {
        finalFile = originalFile;
        newPreviewUrl = URL.createObjectURL(finalFile);
      } 
      else if (originalFile && cropImage && croppedAreaPixels) {
        try {
          const croppedImageBlob = await getCroppedImg(cropImage, croppedAreaPixels, rotation);
          if (!croppedImageBlob) {
            throw new Error("Cropping resulted in an empty image.");
          }
          const fileExtension = (originalFile.name.split('.').pop() || 'png').toLowerCase();
          const newFileName = `${cropType}-cropped.${fileExtension}`;
          finalFile = new File([croppedImageBlob], newFileName, { type: croppedImageBlob.type });
          newPreviewUrl = URL.createObjectURL(finalFile);
        } catch (e) {
          console.error(e);
          toast({
            title: 'Error',
            description: 'Could not crop the image. Please try again.',
            variant: 'destructive',
          });
          setCropOpen(false);
          return;
        }
      }

      if (finalFile) {
        if (finalFile.size > MAX_FILE_SIZE) {
          toast({
            title: 'File too large',
            description: `The cropped image is larger than ${MAX_FILE_SIZE / 1024 / 1024}MB. Please crop a smaller area.`,
            variant: 'destructive',
          });
          if(newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
        } else {
          fileSetter(finalFile);
          previewSetter(newPreviewUrl);
          if (oldPreview && oldPreview.startsWith('blob:')) {
            URL.revokeObjectURL(oldPreview);
          }
        }
      }
    },
    [cropType, originalFile, cropImage, toast, avatarPreview, bannerPreview]
  );

  const handleCropDialogClose = useCallback(() => {
    setCropOpen(false);
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);
    setOriginalFile(null);
  }, [cropImage]);

  const handleTagSelect = (e) => {
    const newTag = e.target.value;
    if (newTag && selectedTags.length < 5 && !selectedTags.includes(newTag)) {
      setValue('tags', [...selectedTags, newTag]);
    }
    e.target.value = '';
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase().replace(/\s+/g, '-');
      if (newTag) {
        if (selectedTags.length >= 5) {
          toast({ title: 'Maximum interests reached', description: 'You can add up to 5 interests.' });
          return;
        }
        if (newTag.length > 15) {
          toast({ title: 'Interest too long', description: 'An interest can have a maximum of 15 characters.' });
          return;
        }
        if (!selectedTags.includes(newTag)) {
          setValue('tags', [...selectedTags, newTag]);
          e.currentTarget.value = '';
        }
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setValue(
      'tags',
      selectedTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const addSocialLink = () => {
    if (socialLinks.length < 5) {
      setValue('links', [...socialLinks, { platform: '', url: '' }]);
    } else {
      toast({ title: 'Maximum links reached', description: 'You can add up to 5 social links.' });
    }
  };

  const updateSocialLink = (index, field, value) => {
    const next = [...socialLinks];
    next[index][field] = value;
    setValue('links', next);
  };

  const removeSocialLink = (index) => {
    const next = socialLinks.filter((_, i) => i !== index);
    setValue('links', next);
  };

  const onSubmit = async (formData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a profile.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.tags.length < 3 || formData.tags.length > 5) {
      toast({ title: 'Validation Error', description: 'You must have 3 to 5 interests.', variant: 'destructive' });
      return;
    }

    if (findInvalidSocialLink(formData.links)) {
      toast({
        title: 'Invalid Social Link',
        description: 'Please use complete links with http, https, or mailto URLs.',
        variant: 'destructive',
      });
      return;
    }

    const normalizedUsername = (formData.username || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_.]/g, '');

    if (normalizedUsername) {
      const { data: existing, error: existsErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .limit(1)
        .maybeSingle();

      if (!existsErr && existing) {
        toast({ title: 'Username taken', description: 'Please choose another username.', variant: 'destructive' });
        return;
      }
    }

    try {
      let avatar_url = '';
      let banner_url = '';

      if (avatarFile) {
        const { url } = await uploadFile('avatars', avatarFile, user, { maxSize: MAX_FILE_SIZE });
        avatar_url = url;
      }
      if (bannerFile) {
        const { url } = await uploadFile('banners', bannerFile, user, { maxSize: MAX_FILE_SIZE });
        banner_url = url;
      }

      let referred_by_profile_id = null;
      if (formData.referral_code) {
        const { data: referrerProfile, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', formData.referral_code.toUpperCase())
          .single();

        if (referrerError || !referrerProfile) {
          toast({
            title: 'Invalid Referral Code',
            description: 'The referral code you entered is not valid. You can proceed without it.',
            variant: 'destructive',
          });
        } else {
          referred_by_profile_id = referrerProfile.id;
        }
      }

      const payload = {
        name: formData.name?.trim(),
        username: normalizedUsername,
        tagline: formData.tagline?.trim() || '',
        bio: formData.bio?.trim() || '',
        tags: formData.tags,
        links: sanitizeSocialLinks(formData.links),
        gender: formData.gender || '',
        country: formData.country || '',
        avatar_url,
        banner_url,
        referred_by: referred_by_profile_id,
      };

      const newProfile = await createProfile(payload);
      await refreshProfile();
      
      sessionStorage.removeItem(SESSION_STORAGE_KEY);

      toast({ title: 'Profile Created!', description: 'Welcome to the community!' });
      navigate(`/u/${newProfile.username}`);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error Creating Profile',
        description: error?.message || 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Create Your Profile"
        description="Join the Herazur community by creating your unique profile."
        noindex
      />

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold gradient-text">Create Your Profile</h1>
              <p className="text-muted-foreground mt-2">Let's get you set up. This is how others will see you.</p>
              {canUseAnimatedGif && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  🎁 You can use animated GIFs!
                </div>
              )}
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Profile Images</CardTitle>
                <CardDescription>
                  {canUseAnimatedGif
                    ? "You can upload animated GIFs - they will keep their animation!"
                    : "Choose an avatar and banner that represent you."
                  }
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="relative overflow-hidden rounded-lg">
                  <div className="h-48 sm:h-64 bg-muted">
                    {bannerPreview && (
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <label
                        htmlFor="banner-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 rounded-md bg-background/80 text-foreground text-sm font-medium hover:bg-background"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                      </label>
                      <input
                        id="banner-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => handleImageSelect(e, 'banner')}
                      />
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative">
                    <div className="flex items-end gap-4">
                      <div className="relative group">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full shadow-lg ring-4 ring-background bg-background">
                          <AvatarImage src={avatarPreview} alt="Avatar preview" className="rounded-full" />
                          <AvatarFallback className="text-4xl rounded-full bg-muted">
                            <UserCheck className="h-12 w-12 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label htmlFor="avatar-upload" className="cursor-pointer text-white">
                            <ImageIcon className="h-6 w-6" />
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => handleImageSelect(e, 'avatar')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Core Information</CardTitle>
                <CardDescription>This is how others will see you on the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" {...register('name', { required: 'Display name is required' })} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...register('username', {
                        required: 'Username is required',
                        minLength: { value: 3, message: 'Username must be at least 3 characters.' },
                        maxLength: { value: 15, message: 'Username cannot exceed 15 characters.' },
                        pattern: {
                          value: /^[a-z0-9_.]+$/,
                          message:
                            'Username can only contain lowercase letters, numbers, underscores, and periods.',
                        },
                      })}
                    />
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    {...register('tagline', {
                      maxLength: { value: 100, message: 'Tagline cannot exceed 100 characters.' },
                    })}
                    placeholder="A short, catchy phrase about you."
                  />
                  {errors.tagline && <p className="text-red-500 text-sm mt-1">{errors.tagline.message}</p>}
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register('bio', {
                      maxLength: { value: 500, message: 'Bio cannot exceed 500 characters.' },
                    })}
                    rows={4}
                    placeholder="Tell us more about yourself..."
                  />
                  {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Interests</CardTitle>
                <CardDescription>
                  Add 3 to 5 tags that best describe your interests. This helps others find you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-base py-1 px-3">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {selectedTags.length < 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Type a new tag (max 15 chars) and press Enter"
                      onKeyDown={handleTagInput}
                      disabled={selectedTags.length >= 5}
                      maxLength={15}
                    />
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={handleTagSelect}
                      defaultValue=""
                      disabled={selectedTags.length >= 5}
                    >
                      <option value="" disabled>
                        Or select from popular tags
                      </option>
                      {popularTagNames
                        .filter((name) => !selectedTags.includes(name))
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add up to 5 links to your social media profiles, portfolio, or personal website.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                        className="flex h-10 w-1/3 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="" disabled>
                          Platform
                        </option>
                        {socialPlatforms.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                {socialLinks.length < 5 && (
                  <Button type="button" variant="outline" onClick={addSocialLink} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Link
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10">
              <CardHeader>
                <CardTitle>Referral Code (Optional)</CardTitle>
                <CardDescription>
                  If a friend referred you, enter their code here to give them a bonus!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  id="referral_code"
                  {...register('referral_code')}
                  placeholder="Enter 8-character referral code"
                  className="uppercase"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Create Profile & Join
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      <ImageCropDialog
        isOpen={isCropOpen}
        onClose={handleCropDialogClose}
        image={cropImage}
        onCropComplete={onCropComplete}
        aspect={cropType === 'avatar' ? 1 : 16 / 9}
        isGif={originalFile?.type === 'image/gif'}
        canUseAnimatedGif={canUseAnimatedGif}
      />
    </>
  );
};

export default CreateProfile;
