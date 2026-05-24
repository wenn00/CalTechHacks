/**
 * view_submission handler for the /ardd note modal.
 *
 * Discipline:
 *   - Cheap synchronous validation BEFORE ack
 *   - On invalid: ack({ response_action: 'errors', errors }) — no DB write
 *   - On valid: ack() first, THEN DB write and ephemeral confirmation
 *
 * Channel of origin is restored from private_metadata so chat.postEphemeral
 * lands in the right place. Passing user.id as channel does not work.
 */

import type { App } from "@slack/bolt";
import { createImpression } from "../../services/impression.service";
import { safeArchive } from "../middleware/archive";

const VIEW_CALLBACK_ID = "ardd_note_submit";
const NONE_VALUE = "__none__";

export function registerNoteSubmitHandler(app: App): void {
  app.view(VIEW_CALLBACK_ID, async ({ ack, body, view, client }) => {
    const sessionSelected =
      view.state.values?.session_block?.session_select?.selected_option;
    const noteRaw =
      view.state.values?.note_block?.note_input?.value ?? "";
    const note = noteRaw.trim();

    const errors: Record<string, string> = {};
    if (!sessionSelected || sessionSelected.value === NONE_VALUE) {
      errors.session_block = "Please pick a session.";
    }
    if (!note) {
      errors.note_block = "Note cannot be empty.";
    }

    if (Object.keys(errors).length > 0) {
      await ack({ response_action: "errors", errors });
      return;
    }

    await ack();

    let metadata: { channelId?: string } = {};
    try {
      metadata = view.private_metadata
        ? JSON.parse(view.private_metadata)
        : {};
    } catch {
      metadata = {};
    }

    const sessionId = sessionSelected!.value;

    try {
      await createImpression({
        sessionId,
        slackUserId: body.user.id,
        note,
      });

      if (metadata.channelId) {
        await client.chat.postEphemeral({
          channel: metadata.channelId,
          user: body.user.id,
          text: ":white_check_mark: Thanks — your note was saved.",
        });
      }

      // NOTE: resultSummary uses a template literal — keep the backticks.
      const resultSummary = `impression saved for session ${sessionId}`;
      await safeArchive(
        { user: { id: body.user.id }, channel: { id: metadata.channelId } },
        {
          interactionType: "view_submission",
          subcommand: "note",
          resultKind: "success",
          resultSummary,
        },
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error";

      if (metadata.channelId) {
        await client.chat.postEphemeral({
          channel: metadata.channelId,
          user: body.user.id,
          text: `:warning: Could not save your note: ${msg}`,
        });
      }

      await safeArchive(
        { user: { id: body.user.id }, channel: { id: metadata.channelId } },
        {
          interactionType: "view_submission",
          subcommand: "note",
          resultKind: "error",
          resultSummary: `note submit failed: ${msg}`,
        },
      );
    }
  });
}
