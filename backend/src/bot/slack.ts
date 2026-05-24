/**
 * Bolt v4 + Socket Mode bootstrap for the ARDD Community Slack Bot.
 *
 * Wires the single `/ardd` slash command, the `ardd_note_submit` view
 * submission, the modal-cache refresh loop, and (via callers) the daily
 * digest cron. Gated by ENABLE_SLACK_BOT in the application entrypoint.
 *
 * Discipline:
 *   - ack() is the first awaited operation on every slash command handler.
 *   - No DB query / network IO before ack.
 *   - Modal views.open uses the cached view; private_metadata carries the
 *     originating channel id so the view_submission handler can postEphemeral
 *     back to the right place.
 *   - safeArchive is called for every interaction; failures are logged only.
 */

import { App, LogLevel } from "@slack/bolt";

import { parseArddCommand, dispatch } from "./dispatch";
import { openNoteModal } from "./handlers/note.open";
import { registerNoteSubmitHandler } from "./handlers/note.submit";
import { refreshNoteModalCache, startModalCacheRefreshLoop } from "./modal-cache";
import { safeArchive } from "./middleware/archive";

let appInstance: App | null = null;

export async function startBot(): Promise<App> {
  if (appInstance) return appInstance;

  const botToken = required("SLACK_BOT_TOKEN");
  const appToken = required("SLACK_APP_TOKEN");

  const app = new App({
    token: botToken,
    appToken,
    socketMode: true,
    logLevel:
      process.env.NODE_ENV === "development" ? LogLevel.INFO : LogLevel.WARN,
  });

  registerSlashCommand(app);
  registerNoteSubmitHandler(app);

  // Warm the modal cache before accepting traffic so /ardd note never opens an
  // empty modal.
  await refreshNoteModalCache();
  startModalCacheRefreshLoop();

  await app.start();
  console.log("Slack bot connected via Socket Mode");

  appInstance = app;
  return app;
}

export function getBotApp(): App | null {
  return appInstance;
}

function registerSlashCommand(app: App): void {
  app.command("/ardd", async ({ ack, command, client, respond }) => {
    await ack();

    const { subcommand, rest } = parseArddCommand(command.text);

    try {
      if (subcommand === "note") {
        const openResult = await openNoteModal({
          triggerId: command.trigger_id,
          originatingChannelId: command.channel_id,
          slackClient: client,
        });
        await safeArchive(command, {
          interactionType: "slash_command",
          subcommand: "note",
          resultKind: openResult.ok ? "success" : "error",
          resultSummary: openResult.summary,
        });
        return;
      }

      const result = await dispatch({
        subcommand,
        rest,
        slackUserId: command.user_id,
        slackClient: client,
      });

      await respond(result.response);

      await safeArchive(command, {
        interactionType: "slash_command",
        subcommand,
        resultKind: result.resultKind ?? "success",
        resultSummary: result.summary,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      try {
        await respond({
          text: `:warning: ${message}`,
          response_type: "ephemeral",
        });
      } catch (respondErr) {
        console.warn("[bot] failed to respond after error:", respondErr);
      }
      await safeArchive(command, {
        interactionType: "slash_command",
        subcommand,
        resultKind: "error",
        resultSummary: message,
      });
    }
  });
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}
