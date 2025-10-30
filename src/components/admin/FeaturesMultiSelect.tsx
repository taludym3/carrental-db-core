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
  selectedFeatureIds: string[];
  onChange: (featureIds: string[]) => void;
  disabled?: boolean;
}

export const FeaturesMultiSelect = ({
  selectedFeatureIds,
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
      onChange([...selectedFeatureIds, feature.id]);
    } else {
      onChange(selectedFeatureIds.filter((id) => id !== feature.id));
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
              checked={selectedFeatureIds.includes(feature.id)}
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
