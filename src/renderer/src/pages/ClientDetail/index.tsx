/**
 * src/renderer/src/pages/ClientDetail/index.tsx
 *
 * Страница карточки клиента (plan §6.3).
 *
 *   ┌─────────────────────────────┬─────────────────────────┐
 *   │                             │  PermanentFields        │
 *   │    ClientTimeline           │  (диагноз, медикаменты, │
 *   │    (события по убыванию)    │   мессенджер, ...)      │
 *   │                             │  + Новый анамнез        │
 *   │                             ├─────────────────────────┤
 *   │                             │  NotesPanel             │
 *   └─────────────────────────────┴─────────────────────────┘
 *
 * Все события таймлайна (кроме client_created) кликабельны и открывают
 * соответствующий диалог. Универсальный dispatch — ниже в openTimeline().
 *
 * Кнопка «В архив» спрашивает подтверждение через ConfirmDestructiveDialog,
 * чтобы случайным кликом не отправить клиента в корзину.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, ArchiveRestore } from 'lucide-react'
import {
  useArchiveClient,
  useClient,
  useRestoreClient
} from '@/hooks/useClients'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/sonner'
import { useShellTitle } from '@/components/Layout/AppShell'
import { ClientTimeline } from '@/components/Timeline/ClientTimeline'
import { PermanentFieldsPanel } from '@/components/ClientFields/PermanentFieldsPanel'
import { AnamnesisDialog } from '@/components/AnamnesisDialog'
import { ConfirmDestructiveDialog } from '@/components/ConfirmDestructiveDialog'
import { MeetingDialog, type MeetingDialogState } from '@/components/MeetingDialog'
import { MeetingProtocolDialog } from '@/components/MeetingProtocolDialog'
import { NotesPanel } from '@/components/Notes/NotesPanel'
import {
  NoteDialog,
  type NoteDialogState
} from '@/components/Notes/NoteDialog'
import { RevisionEditDialog } from '@/components/ClientFields/RevisionEditDialog'
import { meetingsApi } from '@/api/meetings'
import { notesApi } from '@/api/notes'
import { formatDate } from '@/lib/format'
import type { Meeting, Note, TimelineEvent } from '@shared/types'

type AnamnesisState =
  | { open: false }
  | { open: true; anamnesisId: number | null }

type RevisionDialogState = {
  open: boolean
  revisionId: number
  fieldKey: string | null
  value: string | null
  prevValue: string | null
  changedAt: string
  note: string | null
}

type ProtocolDialogState = { open: boolean; meetingId: number }

export default function ClientDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : null
  const navigate = useNavigate()
  const { data: client, isLoading, error } = useClient(id)
  const archive = useArchiveClient()
  const restore = useRestoreClient()

  const [anamnesis, setAnamnesis] = useState<AnamnesisState>({ open: false })
  const [meetingDialog, setMeetingDialog] = useState<MeetingDialogState | null>(null)
  const [noteDialog, setNoteDialog] = useState<NoteDialogState | null>(null)
  const [protocol, setProtocol] = useState<ProtocolDialogState | null>(null)
  const [revision, setRevision] = useState<RevisionDialogState | null>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)

  useShellTitle(client?.full_name ?? 'Клиент')

  // Заранее «прогреваем» нужные сущности на запрос. Загружаются по факту.
  useEffect(() => {
    // no-op: оставлено как место для пред-загрузок при необходимости
  }, [client?.id])

  if (id === null || Number.isNaN(id)) {
    return (
      <div className="p-6 text-sm text-destructive">Неверный идентификатор клиента</div>
    )
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка…</div>
  }
  if (error || !client) {
    return (
      <div className="p-6 text-sm text-destructive">
        {error instanceof Error ? error.message : 'Клиент не найден'}
      </div>
    )
  }

  const archived = Boolean(client.archived_at)

  /** Универсальный обработчик клика по событию таймлайна. */
  async function openTimeline(ev: TimelineEvent) {
    try {
      switch (ev.kind) {
        case 'meeting': {
          // Подгружаем актуальную запись (в VIEW нет полного объекта).
          const m: Meeting = await meetingsApi
            .listInRange(ev.at, new Date(new Date(ev.at).getTime() + 1).toISOString())
            .then(
              (list) => list.find((x) => x.id === ev.ref_id) ?? listFirstOrThrow(list)
            )
            .catch(async () => {
              // Фоллбэк — listByClient (медленнее, но не зависит от точности at)
              const all = await meetingsApi.listByClient(ev.client_id)
              const found = all.find((x) => x.id === ev.ref_id)
              if (!found) throw new Error('Встреча не найдена')
              return found
            })
          setMeetingDialog({ mode: 'edit', meeting: m })
          return
        }
        case 'anamnesis':
          setAnamnesis({ open: true, anamnesisId: ev.ref_id })
          return
        case 'note_event': {
          const noteId = ev.extra ? Number(ev.extra) : NaN
          if (Number.isNaN(noteId) || ev.aux1 === 'delete') {
            // Удалённая заметка → редактировать нечего, показываем тост.
            toast.info('Заметка уже удалена — открывать нечего')
            return
          }
          const all = await notesApi.listByClient(ev.client_id)
          const note: Note | undefined = all.find((n) => n.id === noteId)
          if (!note) {
            toast.info('Заметка уже удалена')
            return
          }
          setNoteDialog({ mode: 'edit', note })
          return
        }
        case 'protocol': {
          const meetingId = ev.aux1 ? Number(ev.aux1) : NaN
          if (Number.isNaN(meetingId)) {
            toast.error('Не удалось определить встречу протокола')
            return
          }
          setProtocol({ open: true, meetingId })
          return
        }
        case 'revision':
          setRevision({
            open: true,
            revisionId: ev.ref_id,
            fieldKey: ev.aux1,
            value: ev.payload_text,
            prevValue: ev.aux2,
            changedAt: ev.at,
            note: ev.extra
          })
          return
        case 'client_created':
          return
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_360px] gap-0">
      {/* Левая колонка — Timeline */}
      <div className="flex h-full flex-col border-r">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Назад"
            onClick={() => navigate('/clients')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{client.full_name}</h2>
              {archived && <Badge variant="secondary">в архиве</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">
              {client.birth_date && <>род. {formatDate(client.birth_date)} · </>}
              создан {formatDate(client.created_at)}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setMeetingDialog({
                  mode: 'create',
                  preset: { clientId: client.id, start: new Date() }
                })
              }
            >
              + Встреча
            </Button>
            {archived ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => restore.mutate(client.id)}
              >
                <ArchiveRestore className="size-4" />
                Восстановить
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmArchive(true)}
              >
                <Archive className="size-4" />
                В архив
              </Button>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ClientTimeline clientId={client.id} onOpen={openTimeline} />
        </div>
      </div>

      {/* Правая колонка — поля + заметки */}
      <div className="flex h-full flex-col gap-3 overflow-auto p-4">
        <PermanentFieldsPanel
          client={client}
          onAddAnamnesis={() => setAnamnesis({ open: true, anamnesisId: null })}
        />
        <NotesPanel clientId={client.id} />
      </div>

      <AnamnesisDialog
        open={anamnesis.open}
        clientId={client.id}
        anamnesisId={anamnesis.open ? anamnesis.anamnesisId : null}
        onClose={() => setAnamnesis({ open: false })}
      />

      <MeetingDialog
        open={meetingDialog !== null}
        state={meetingDialog}
        onClose={() => setMeetingDialog(null)}
        // На странице самого клиента кнопка «Открыть клиента» избыточна.
        showOpenClient={false}
      />

      <NoteDialog
        open={noteDialog !== null}
        clientId={client.id}
        state={noteDialog}
        onClose={() => setNoteDialog(null)}
      />

      {protocol && (
        <MeetingProtocolDialog
          open={protocol.open}
          meetingId={protocol.meetingId}
          clientId={client.id}
          onClose={() => setProtocol(null)}
        />
      )}

      {revision && (
        <RevisionEditDialog
          open={revision.open}
          clientId={client.id}
          revisionId={revision.revisionId}
          fieldKey={revision.fieldKey}
          value={revision.value}
          prevValue={revision.prevValue}
          changedAt={revision.changedAt}
          note={revision.note}
          onClose={() => setRevision(null)}
        />
      )}

      <ConfirmDestructiveDialog
        open={confirmArchive}
        itemLabel={`Клиент «${client.full_name}» будет отправлен в архив. Восстановить можно из настроек.`}
        busy={archive.isPending}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={async () => {
          await archive.mutateAsync(client.id)
          setConfirmArchive(false)
        }}
      />
    </div>
  )
}

function listFirstOrThrow<T>(list: T[]): T {
  if (list.length === 0) throw new Error('Пусто')
  return list[0] as T
}
