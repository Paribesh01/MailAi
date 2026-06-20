import { GmailFolderView } from "@/components/gmail-folder/gmail-folder-view"
import { Trash2, RotateCcw } from "lucide-react"

export default function TrashPage() {
  return (
    <GmailFolderView
      title="Trash"
      description="Emails you've deleted. Gmail removes them after 30 days."
      icon={<Trash2 className="w-5 h-5 text-stone-warm" />}
      apiRoute="/api/trash"
      primaryAction={{
        label: "Restore",
        icon: <RotateCcw className="w-3 h-3" />,
        action: "restore",
      }}
      emptyMessage="Trash is empty"
    />
  )
}
