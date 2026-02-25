import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function BackupReminder() {
  const { shouldShowBackupReminder, dismissBackupReminder } = useSettings();

  useEffect(() => {
    if (shouldShowBackupReminder()) {
      toast('📦 Weekly Backup Reminder', {
        description: "It's been a week! Consider backing up your data.",
        duration: 10000,
        action: {
          label: 'Dismiss',
          onClick: () => dismissBackupReminder(),
        },
      });
      dismissBackupReminder();
    }
  }, [shouldShowBackupReminder, dismissBackupReminder]);

  return null;
}
