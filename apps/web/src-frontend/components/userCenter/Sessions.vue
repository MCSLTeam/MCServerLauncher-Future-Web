<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import { ref } from "vue";
import type { SessionInfo } from "../../utils/types.ts";
import { notifyErr, requestWithToken } from "../../utils/network.ts";
import Tag from "@repo/ui/src/components/misc/tag/Tag.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import { formatDate } from "@repo/ui/src/utils/utils.ts";
import dayjs from "dayjs";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import ConfirmModal from "@repo/shared/src/components/ConfirmModal.vue";

const t = useI18n().t;

const sessions = ref<SessionInfo[]>();
let sessionToDelete = "";
const showDeleteConfirm = ref(false);

async function refresh() {
  sessions.value = await requestWithToken<SessionInfo[]>(
    "/session/self",
    "GET",
    (e) => notifyErr(e, "web.user-center.sessions.error"),
  );
}

async function deleteSession() {
  await requestWithToken<void>("/session/" + sessionToDelete, "DELETE", (e) =>
    notifyErr(e, "web.user-center.sessions.delete.error"),
  );

  new MCSLNotif({
    data: {
      color: "success",
      title: t("ui.notification.title.success"),
      message: t("web.user-center.sessions.delete.success"),
    },
  }).open();

  await refresh();
}

refresh();
</script>

<template>
  <div class="sessions">
    <ConfirmModal
      v-model:visible="showDeleteConfirm"
      :title="t('web.user-center.sessions.delete.confirm')"
      @confirm="deleteSession"
    />
    <table v-if="sessions" class="sessions__table">
      <thead>
        <tr>
          <th>{{ t("web.user-center.sessions.info.type.label") }}</th>
          <th>{{ t("web.user-center.sessions.info.user-agent") }}</th>
          <th>{{ t("web.user-center.sessions.info.created-at") }}</th>
          <th>{{ t("web.user-center.sessions.info.last-active-ip") }}</th>
          <th>{{ t("web.user-center.sessions.info.last-active-at") }}</th>
          <th>{{ t("ui.common.actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in sessions" :key="session.token_id">
          <td>
            <Tag :color="session.remember ? 'primary' : 'default'">
              {{
                t(
                  "web.user-center.sessions.info.type." +
                    (session.remember ? "remember" : "temporary"),
                )
              }}
            </Tag>
          </td>
          <td v-tooltip="session.user_agent" class="sessions__text-eclipse">
            {{ session.user_agent }}
          </td>
          <td>
            {{ formatDate(dayjs(session.created_at)) }}
          </td>
          <td>
            {{ session.last_active_ip }}
          </td>
          <td>
            {{ formatDate(dayjs(session.last_active_at)) }}
          </td>
          <td>
            <Button
              icon="fa-solid fa-trash-can"
              color="danger"
              rounded
              size="small"
              v-tooltip="t('ui.common.delete')"
              @click="
                () => {
                  sessionToDelete = session.token_id;
                  showDeleteConfirm = true;
                }
              "
            />
          </td>
        </tr>
      </tbody>
    </table>
    <Spinner v-else class="sessions__spinner" />
  </div>
</template>

<style scoped lang="scss">
.sessions {
  overflow: auto;
}

.sessions__table {
  min-width: 540px;
}

.sessions__text-eclipse {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.sessions__spinner {
  height: 6rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
