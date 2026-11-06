import { Chrome } from "../components/Chrome";
import { ManualBatchInbox } from "../components/ManualBatchInbox";

export default function AgentInboxPage() {
  return <Chrome title="Agent inbox" sub="Choose when Codex starts" active="/agent-inbox">
    <ManualBatchInbox />
  </Chrome>;
}
