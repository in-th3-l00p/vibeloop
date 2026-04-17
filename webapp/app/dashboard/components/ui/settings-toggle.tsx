import { Switch } from "@/components/ui/switch";

export function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.05] transition-colors">
      <div>
        <p className="text-xs font-medium text-zinc-200">{label}</p>
        {description && <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0 ml-3" />
    </label>
  );
}
