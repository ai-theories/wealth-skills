/**
 * Wealth CRM Engine - Self-Contained Transcript Parsing & CRM Sync Logic
 */

export function parseMeetingTranscript(transcriptText) {
  const lines = transcriptText.split('\n');
  const actionItems = [];
  const keyDecisions = [];

  const ACTION_KEYWORDS = ['will', 'follow up', 'send', 'prepare', 'action', 'task', 'schedule'];
  const DECISION_KEYWORDS = ['agreed', 'agreed to', 'decided', 'approved', 'confirmed', 'chose', 'selected'];

  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (DECISION_KEYWORDS.some(kw => lower.includes(kw))) {
      keyDecisions.push(line.trim());
    } else if (ACTION_KEYWORDS.some(kw => lower.includes(kw))) {
      actionItems.push({
        task: line.trim(),
        priority: lower.includes('urgent') || lower.includes('asap') ? 'High' : 'Normal',
        dueDateDaysOut: lower.includes('next week') ? 7 : 3
      });
    }
  }

  return {
    parsedAt: new Date().toISOString(),
    extractedDecisionsCount: keyDecisions.length,
    extractedActionItemsCount: actionItems.length,
    keyDecisions,
    actionItems
  };
}

export function buildCrmPayload(crmType = 'Salesforce_FSC', householdId, meetingDate, actionItems) {
  const payload = {
    crmPlatform: crmType,
    householdId,
    meetingDate: meetingDate || new Date().toISOString().split('T')[0],
    tasks: actionItems.map((item, idx) => ({
      externalId: `TASK-${Date.now()}-${idx}`,
      subject: typeof item === 'string' ? item : item.task,
      priority: item.priority || 'Normal',
      status: 'Not Started',
      dueDate: new Date(Date.now() + (item.dueDateDaysOut || 7) * 86400000).toISOString().split('T')[0]
    }))
  };

  return payload;
}
