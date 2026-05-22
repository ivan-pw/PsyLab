/**
 * src/renderer/src/components/Settings/BackupSettings.tsx
 *
 * Разделы «Бэкапы» и «Экспорт JSON» (план §6.5).
 *
 * Бэкап — копия `psynote.db` + `psynote.salt` в `userData/backups/`.
 * Открывать её можно только тем же паролем, которым шифровалась — это просто
 * snapshot файла. Ротация по `backup_keep_count` из настроек (по умолчанию 10).
 *
 * Экспорт JSON — расшифрованный дамп всей БД. Перед запуском показываем
 * предупреждение: файл будет лежать в открытом виде.
 */
import { useState } from 'react'
import { Download, FilePlus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  useBackups,
  useCreateBackup,
  useDeleteBackup
} from '@/hooks/useBackups'
import { backupApi } from '@/api/backup'
import { formatDateTime } from '@/lib/format'

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`
}

export function BackupSettings() {
  const { data: backups, isLoading } = useBackups()
  const create = useCreateBackup()
  const remove = useDeleteBackup()
  const [exporting, setExporting] = useState(false)
  const [warnExportOpen, setWarnExportOpen] = useState(false)

  async function handleCreate() {
    try {
      const b = await create.mutateAsync()
      toast.success(`Резервная копия создана (${fmtSize(b.size)})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(path: string) {
    if (!window.confirm('Удалить эту резервную копию?')) return
    try {
      await remove.mutateAsync(path)
      toast.success('Резервная копия удалена')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleExport() {
    setWarnExportOpen(false)
    setExporting(true)
    try {
      const dst = await backupApi.exportJson()
      if (dst) toast.success(`Экспорт сохранён: ${dst}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Резервные копии</h3>
            <p className="text-xs text-muted-foreground">
              Снимок зашифрованной базы данных. Восстановление возможно только
              с тем же паролем, что был в момент создания. Старые копии
              ротируются автоматически.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleCreate()}
            disabled={create.isPending}
          >
            <FilePlus className="size-4" />
            Создать копию
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !backups || backups.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Резервных копий пока нет.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {backups.map((b) => (
              <li
                key={b.path}
                className="group flex items-center gap-3 px-3 py-2 text-sm"
              >
                <RefreshCw className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs">
                    {formatDateTime(b.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmtSize(b.size)} · {b.path}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => void handleDelete(b.path)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Экспорт в JSON</h3>
            <p className="text-xs text-muted-foreground">
              Все данные в одном JSON-файле в открытом виде. Удобно для миграции
              или ручного анализа, но требует осторожности при хранении.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWarnExportOpen(true)}
            disabled={exporting}
          >
            <Download className="size-4" />
            Экспортировать
          </Button>
        </div>
      </div>

      <Dialog open={warnExportOpen} onOpenChange={setWarnExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Экспортировать данные в JSON?</DialogTitle>
            <DialogDescription>
              Файл будет содержать данные клиентов в открытом (нешифрованном)
              виде. Сохраняйте его только в защищённом месте, при передаче
              шифруйте отдельно. Удалите после использования.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnExportOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void handleExport()}>
              <Download className="size-4" />
              Понимаю, экспортировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
