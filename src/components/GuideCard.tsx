import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface GuideCardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

const GuideCard = ({ title, children, icon }: GuideCardProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {icon || <Info className="h-5 w-5 text-primary" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-primary">{title}</h3>
            <div className="text-sm text-muted-foreground">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuideCard;
