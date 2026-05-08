import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Image as ImageIcon, ArrowLeft, Bold, Italic, Heading1, Heading2, Heading3, Link as LinkIcon, List, Quote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MarkdownToolbar = ({ onInsert }) => {
  const tools = [
    { icon: Bold, tag: 'bold', markdown: '**text**', description: 'Kalın' },
    { icon: Italic, tag: 'italic', markdown: '*text*', description: 'İtalik' },
    { icon: Heading1, tag: 'h1', markdown: '# ', description: 'Başlık 1' },
    { icon: Heading2, tag: 'h2', markdown: '## ', description: 'Başlık 2' },
    { icon: Heading3, tag: 'h3', markdown: '### ', description: 'Başlık 3' },
    { icon: Quote, tag: 'quote', markdown: '> ', description: 'Alıntı' },
    { icon: List, tag: 'ul', markdown: '- ', description: 'Sırasız Liste' },
    { icon: LinkIcon, tag: 'link', markdown: '[text](url)', description: 'Link' },
    { icon: ImageIcon, tag: 'image', markdown: '![alt](url)', description: 'Resim' },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-input p-2 bg-background">
        {tools.map((tool) => (
          <Tooltip key={tool.tag}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onInsert(tool.markdown, tool.tag)}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

const ManageBlogPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm();
  
  const contentRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const imageUrlFromForm = watch('image_url');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Bu sayfaya erişmek için giriş yapmalısınız.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      toast({
        title: 'Yetkisiz Erişim',
        description: 'Bu sayfaya erişim izniniz yok.',
        variant: 'destructive',
      });
      navigate('/blog');
      return;
    }

    setLoading(false);

    if (postId) {
      setIsEditMode(true);
      fetchPostData();
    }
  }, [user, authLoading, isAdmin, postId, navigate, toast]);

  useEffect(() => {
    if (imageUrlFromForm) {
      setImagePreview(imageUrlFromForm);
      setImageFile(null);
    }
  }, [imageUrlFromForm]);

  const fetchPostData = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      setValue('title', data.title);
      setValue('content', data.content);
      setValue('image_url', data.image_url);
      setImagePreview(data.image_url || '');
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Hata',
        description: 'Blog yazısı yüklenirken hata oluştu.',
        variant: 'destructive',
      });
      navigate('/blog');
    }
  };
  
  const handleMarkdownInsert = (markdown, tag) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = getValues('content') || '';
    let newText;
    let newCursorPosition;

    if (tag === 'bold' || tag === 'italic') {
      const marker = markdown.slice(0, markdown.indexOf('text'));
      const selectedText = currentText.substring(start, end);
      if (selectedText) {
        newText = `${currentText.substring(0, start)}${marker}${selectedText}${marker}${currentText.substring(end)}`;
        newCursorPosition = start + marker.length + selectedText.length + marker.length;
      } else {
        newText = `${currentText.substring(0, start)}${marker}${marker}${currentText.substring(end)}`;
        newCursorPosition = start + marker.length;
      }
    } else if (tag === 'link' || tag === 'image') {
       const selectedText = currentText.substring(start, end);
       if (selectedText) {
         if(tag === 'link') {
            newText = `${currentText.substring(0, start)}[${selectedText}](url)${currentText.substring(end)}`;
            newCursorPosition = start + selectedText.length + 4;
         } else { // image
            newText = `${currentText.substring(0, start)}![${selectedText}](url)${currentText.substring(end)}`;
            newCursorPosition = start + selectedText.length + 5;
         }
       } else {
         newText = `${currentText.substring(0, start)}${markdown}${currentText.substring(end)}`;
         newCursorPosition = start + markdown.indexOf('text');
       }
    } else { // h1, h2, h3, quote, ul
      newText = `${currentText.substring(0, start)}${markdown}${currentText.substring(start)}`;
      newCursorPosition = start + markdown.length;
    }

    setValue('content', newText, { shouldDirty: true });
    textarea.focus();
    setTimeout(() => {
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };


  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({
          title: 'Geçersiz Dosya Türü',
          description: 'Lütfen JPG, PNG, WebP veya GIF görseli seçin.',
          variant: 'destructive',
        });
        e.target.value = null;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Dosya Çok Büyük',
          description: `Resim boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'tan küçük olmalı.`,
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setValue('image_url', '');
    }
  };

  const uploadImage = async (file) => {
    const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (formData) => {
    if (!user || !isAdmin) return;

    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const postData = {
        title: formData.title,
        content: formData.content,
        image_url: finalImageUrl,
        author_id: user.id,
      };

      let result;

      if (isEditMode) {
        result = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', postId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw new Error(result.error.message);
      }

      toast({
        title: 'Başarılı!',
        description: `Blog yazısı ${isEditMode ? 'güncellendi' : 'oluşturuldu'}.`,
      });

      navigate(`/blog/post/${result.data.slug}`);

    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Blog yazısı kaydedilirken hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Seo
        title={isEditMode ? 'Edit Blog Post' : 'New Blog Post'}
        description="Create or edit a blog post on Herazur."
        noindex
      />
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Blog'a Dön
          </Button>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}</CardTitle>
                <CardDescription>
                  {isEditMode ? 'Yazıyı güncelle' : 'Yeni blog yazısı oluştur'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    {...register('title', {
                      required: 'Başlık gerekli',
                      minLength: { value: 5, message: 'Başlık en az 5 karakter olmalı' }
                    })}
                    placeholder="Blog yazısı başlığı"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="content">İçerik *</Label>
                  <MarkdownToolbar onInsert={handleMarkdownInsert} />
                  {(() => {
                    const contentRegister = register('content', {
                      required: 'İçerik gerekli',
                      minLength: { value: 50, message: 'İçerik en az 50 karakter olmalı' }
                    });

                    return (
                  <Textarea
                    id="content"
                    {...contentRegister}
                    ref={(node) => {
                      contentRegister.ref(node);
                      contentRef.current = node;
                    }}
                    rows={15}
                    placeholder="Blog yazınızı buraya yazın (Markdown desteklenir)..."
                    className="rounded-t-none focus:z-10"
                  />
                    );
                  })()}
                  {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
                </div>

                <div>
                  <Label htmlFor="image-upload">Kapak Görseli</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Resim Yükle
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleImageSelect}
                    />
                    <span className="text-muted-foreground">veya</span>
                    <Input
                      id="image_url"
                      {...register('image_url')}
                      placeholder="URL yapıştır"
                      className="flex-1"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div>
                    <Label>Resim Önizleme</Label>
                    <div className="mt-2 aspect-video w-full rounded-lg border overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/blog')}
                    disabled={isSubmitting}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditMode ? 'Güncelle' : 'Yayınla'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ManageBlogPost;
