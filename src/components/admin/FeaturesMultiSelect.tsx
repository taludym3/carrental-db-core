import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Feature {
  id: string;
  name_ar: string;
  name_en: string;
}

interface FeaturesMultiSelectProps {
  selectedFeaturesAr: string[];
  selectedFeaturesEn: string[];
  onChange: (featuresAr: string[], featuresEn: string[]) => void;
  disabled?: boolean;
}

export const FeaturesMultiSelect = ({
  selectedFeaturesAr,
  selectedFeaturesEn,
  onChange,
  disabled = false,
}: FeaturesMultiSelectProps) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from("car_features")
        .select("*")
        .eq("is_active", true)
        .order("name_ar");
      
      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error("Error fetching features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (feature: Feature, checked: boolean) => {
    if (checked) {
      onChange(
        [...selectedFeaturesAr, feature.name_ar],
        [...selectedFeaturesEn, feature.name_en]
      );
    } else {
      onChange(
        selectedFeaturesAr.filter((f) => f !== feature.name_ar),
        selectedFeaturesEn.filter((f) => f !== feature.name_en)
      );
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;
  }

  if (features.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        لا توجد مميزات متاحة. يمكنك إضافة مميزات جديدة من قسم إدارة المميزات.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature.id} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={feature.id}
              checked={selectedFeaturesAr.includes(feature.name_ar)}
              onCheckedChange={(checked) => handleToggle(feature, checked as boolean)}
              disabled={disabled}
            />
            <Label 
              htmlFor={feature.id} 
              className="text-sm cursor-pointer flex-1"
            >
              {feature.name_ar}
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
