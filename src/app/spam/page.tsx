import { GmailFolderView } from "@/components/gmail-folder/gmail-folder-view"
import { ShieldOff, ShieldCheck } from "lucide-react"

export default function SpamPage() {
  return (
    <GmailFolderView
      title="Spam"
      description="Emails Gmail thinks are spam. Gmail removes them after 30 days."
      icon={<ShieldOff className="w-5 h-5 text-stone-warm" />}
      apiRoute="/api/spam"
      primaryAction={{
        label: "Not spam",
        icon: <ShieldCheck className="w-3 h-3" />,
        action: "not-spam",
      }}
      emptyMessage="No spam — lucky you"
    />
  )
}
