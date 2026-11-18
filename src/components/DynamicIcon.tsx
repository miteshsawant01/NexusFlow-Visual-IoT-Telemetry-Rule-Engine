import React from 'react';
import {
  Radio,
  Globe,
  Cpu,
  Sliders,
  Activity,
  AlertTriangle,
  RefreshCw,
  Layers,
  Send,
  Bell,
  Power,
  Zap,
  Workflow,
  CheckCircle,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface Props extends LucideProps {
  name: string;
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Radio,
  Globe,
  Cpu,
  Sliders,
  Activity,
  AlertTriangle,
  RefreshCw,
  Layers,
  Send,
  Bell,
  Power,
  Zap,
  Workflow,
  CheckCircle,
};

export const DynamicIcon: React.FC<Props> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
};
