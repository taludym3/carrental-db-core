import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AnnouncementEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_featured: false,
    branch_id: '',
    expires_at: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement-details', id],
    queryFn: async () => {
      if (!id) throw new Error('No announcement ID');
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name_ar')
        .eq('is_active', true)
        .order('name_ar');
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title_ar: announcement.title_ar || '',
        title_en: announcement.title_en,
        description_ar: announcement.description_ar || '',
        description_en: announcement.description_en || '',
        priority: announcement.priority,
        is_featured: announcement.is_featured,
        branch_id: announcement.branch_id || '',
        expires_at: announcement.expires_at ? announcement.expires_at.slice(0, 16) : ''
      });
      setCurrentImageUrl(announcement.image_url || '');
    }
  }, [announcement]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = currentImageUrl;

      // Upload new image if exists
      if (imageFile) {
        // Delete old image if exists
        if (currentImageUrl) {
          const oldImagePath = currentImageUrl.split('/').pop();
          if (oldImagePath) {
            await supabase.storage
              .from('announcement-images')
              .remove([oldImagePath]);
          }
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('announcement-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcement-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('announcements')
        .update({
          title_ar: formData.title_ar || formData.title_en,
          title_en: formData.title_en,
          description_ar: formData.description_ar || null,
          description_en: formData.description_en || null,
          image_url: imageUrl || null,
          priority: formData.priority as any,
          is_featured: formData.is_featured,
          branch_id: formData.branch_id || null,
          expires_at: formData.expires_at || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('تم تحديث الإعلان بنجاح');
      navigate(`/admin/announcements/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل تحديث الإعلان');
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_ar || !formData.title_en) {
      toast.error('يرجى إدخال العنوان بالعربي والإنجليزي');
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تعديل الإعلان"
        action={
          <Button variant="outline" onClick={() => navigate(`/admin/announcements/${id}`)}>
            <ArrowRight className="h-4 w-4" />
            العودة للتفاصيل
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>معلومات الإعلان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title_ar">العنوان (عربي) *</Label>
                <Input
                  id="title_ar"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title_en">العنوان (إنجليزي) *</Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف (عربي)</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة الإعلان</Label>
              <div className="space-y-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                />
                {(imagePreview || currentImageUrl) && (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview || currentImageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="normal">عادية</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">الفرع</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الفروع</SelectItem>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">تاريخ الانتهاء</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                إعلان مميز
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/announcements/${id}`)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AnnouncementEdit;
