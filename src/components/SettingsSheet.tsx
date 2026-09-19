import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Image, Palette, Ghost, Bell, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { isGhostModeEnabled, setGhostMode } from '@/lib/notifications';
import { toast } from '@/hooks/use-toast';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onNuke: () => Promise<boolean>;
}

const GRADIENT_PRESETS = [
  { name: 'Midnight', value: 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)' },
  { name: 'Deep Space', value: 'linear-gradient(135deg, #0f0f0f, #1a0a2e, #0a1628)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #0a0a0a, #1a2a1a, #0a1a2a)' },
  { name: 'Obsidian', value: 'linear-gradient(180deg, #0a0a0a, #151515)' },
];

const SettingsSheet = ({ open, onOpenChange, currentUser, onNuke }: SettingsSheetProps) => {
  const [confirmNuke, setConfirmNuke] = useState(false);
  const [isNuking, setIsNuking] = useState(false);
  const [ghostMode, setGhostModeState] = useState(isGhostModeEnabled());

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      await supabase
        .from('chat_settings')
        .upsert({ id: currentUser, wallpaper_url: url, updated_at: new Date().toISOString() });
    };
    reader.readAsDataURL(file);
  };

  const handleGradientSelect = async (gradient: string) => {
    await supabase
      .from('chat_settings')
      .upsert({ id: currentUser, wallpaper_url: gradient, updated_at: new Date().toISOString() });
  };

  const handleNuke = async () => {
    if (confirmNuke) {
      setIsNuking(true);
      const success = await onNuke();
      setIsNuking(false);
      setConfirmNuke(false);
      
      if (success) {
        toast({
          title: "History Cleared",
          description: "Stay Safe. 🤫",
          duration: 3000,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to clear history. Try again.",
          variant: "destructive",
        });
      }
    } else {
      setConfirmNuke(true);
      setTimeout(() => setConfirmNuke(false), 3000);
    }
  };

  const handleGhostModeToggle = (enabled: boolean) => {
    setGhostMode(enabled);
    setGhostModeState(enabled);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass border-l border-glass-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Ghost Mode Section */}
          <div className="Sample Message">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="Sample Message">
                  <Ghost className="Sample Message" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Ghost Mode</h4>
                  <p className="Sample Message">Disable all notifications</p>
                </div>
              </div>
              <Switch
                checked={ghostMode}
                onCheckedChange={handleGhostModeToggle}
              />
            </div>
          </div>

          {/* Notifications Info */}
          <div className="Sample Message">
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications appear as bank alerts for privacy</span>
          </div>

          {/* Wallpaper Section */}
          <div>
            <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Chat Wallpaper
            </h3>
            
            <label className="block">
              <div className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-lavender-deep/30 
                           hover:border-lavender-deep/50 transition-colors cursor-pointer text-center">
                <span className="Sample Message">Upload photo</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleWallpaperUpload}
                className="hidden" 
              />
            </label>
          </div>

          {/* Gradient Presets */}
          <div>
            <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Gradient Presets
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleGradientSelect(preset.value)}
                  className="h-16 rounded-xl border border-glass-border overflow-hidden hover:scale-105 transition-transform"
                  style={{ background: preset.value }}
                >
                  <span className="text-xs font-medium text-foreground/70 drop-shadow-sm">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            
            <Button
              variant={confirmNuke ? 'destructive' : 'outline'}
              className={`w-full ${confirmNuke ? '' : 'border-destructive/30 text-destructive hover:bg-destructive/10'}`}
              onClick={handleNuke}
              disabled={isNuking}
            >
              {isNuking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Nuking...
                </>
              ) : confirmNuke ? (
                'Tap again to confirm'
              ) : (
                'Clear All Messages'
              )}
            </Button>
            <p className="Sample Message">
              This will delete messages for both users permanently
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
