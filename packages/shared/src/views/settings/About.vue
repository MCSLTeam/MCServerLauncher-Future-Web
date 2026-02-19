<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import SettingsItem from "../../components/settings/SettingsItem.vue";
import Switch from "@repo/ui/src/components/form/entries/Switch.vue";
import { ref } from "vue";
import {
  buildTime,
  commitBranch,
  commitHash,
  getEula,
  platform,
  version,
  versionCodename,
} from "../../index.ts";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import CollapsablePanel from "@repo/ui/src/components/panel/CollapsablePanel.vue";
import { renderMd } from "@repo/ui/src/utils/render.ts";
import dependencies from "../../assets/dependencies.json";
import dayjs from "dayjs";
import { formatDate } from "@repo/ui/src/utils/utils.ts";

const t = useI18n().t;
const mcslQQGroup =
  "https://qm.qq.com/cgi-bin/qm/qr?k=ScuQmlGokmp_8XFQpLK_4FbSOd2IBmzT&authKey=CHKTHXco80XfN8jTdCFFIFPnz7qLmFq69tsq%2Byxz%2BWbNLEn4FlFpo7Pfc%2BIplcgW&group_code=733951376";

const autoDownloadUpdates = ref(false);

const eula = ref<string>();
const showEula = ref(false);

(async () => {
  eula.value = await getEula();
})();

function openLink(url: string) {
  window.open(url, "_blank");
}

(dependencies as any)?.awa?.(); // 防止idea说变量未使用
</script>

<template>
  <div class="settings__section">
    <Modal
      v-model:visible="showEula"
      :header="t('shared.eula.title')"
      max-width="60vw"
    >
      <div class="eula-content">
        <div
          v-if="eula"
          class="mcsl-typography"
          v-html="renderMd(eula, { html: false })"
        />
        <div v-else class="spinner">
          <Spinner />
        </div>
      </div>
    </Modal>
    <Panel>
      <div class="about__about">
        <img src="../../assets/img/MCSL.png" alt="" />
        <h2>{{ t("shared.app.name.name") }}</h2>
        <h1>
          {{ t("shared.app.name.future") }}
          {{ t(`${platform}.app.name.suffix`) }}
        </h1>
        <h4>{{ versionCodename }} (v{{ version }})</h4>
        <div>
          <Button
            type="text"
            rounded
            icon="fab fa-github"
            @click="
              openLink(
                'https://github.com/MCSLTeam/MCServerLauncher-Future-Web',
              )
            "
            v-tooltip="t('shared.settings.about.about.github')"
          />
          <Button
            type="text"
            rounded
            icon="fab fa-qq"
            @click="openLink(mcslQQGroup)"
            v-tooltip="t('shared.settings.about.about.qq')"
          />
          <Button
            type="text"
            rounded
            icon="fa fa-envelope"
            @click="openLink('mailto:services@mcsl.com.cn')"
            v-tooltip="t('shared.settings.about.about.email')"
          />
          <Button
            type="text"
            rounded
            icon="fa fa-globe"
            @click="
              openLink(
                'https://translate.mcsl.com.cn/projects/mcsl-future/web-panel/',
              )
            "
            v-tooltip="t('shared.settings.about.about.i18n')"
          />
          <Button
            type="text"
            rounded
            icon="fa fa-circle-dollar-to-slot"
            @click="openLink('https://afdian.com/a/lxhtt')"
            v-tooltip="t('shared.settings.about.about.afdian')"
          />
          <Button
            type="text"
            rounded
            icon="fa fa-book-open-reader"
            @click="showEula = true"
            v-tooltip="t('shared.eula.title')"
          />
        </div>
        <p>
          {{ t("shared.app.copyright", { year: dayjs().year() }) }}
        </p>
        <p>{{ t("shared.settings.about.about.disclaimer") }}</p>
      </div>
    </Panel>
    <!-- TODO: 更新检查 -->
    <SettingsItem
      label="shared.settings.about.auto-download-updates.label"
      desc="shared.settings.about.auto-download-updates.desc"
    >
      <Switch v-model="autoDownloadUpdates" />
    </SettingsItem>
    <SettingsItem
      label="shared.settings.about.check-updates.label"
      desc="shared.settings.about.check-updates.desc"
    >
      <Button type="primary" color="blue">{{
        t("shared.settings.about.check-updates.button")
      }}</Button>
    </SettingsItem>
    <CollapsablePanel>
      <template #header>
        <h4>{{ t("shared.settings.about.info.title") }}</h4>
      </template>
      <div class="about__info">
        <div>
          <h5>{{ t("shared.settings.about.info.build.title") }}</h5>
          <div
            v-html="
              renderMd(
                t('shared.settings.about.info.build.platform', { platform }),
              )
            "
          />
          <div
            v-html="
              renderMd(
                t('shared.settings.about.info.build.version', {
                  version,
                  versionCodename,
                }),
              )
            "
          />
          <div
            v-html="
              renderMd(
                t('shared.settings.about.info.build.time', {
                  buildTime: formatDate(buildTime),
                }),
              )
            "
          />
          <div
            v-html="
              renderMd(
                t('shared.settings.about.info.build.commit', {
                  commitBranch,
                  commitHash: commitHash.slice(0, 7),
                }),
              )
            "
          />
        </div>
        <div>
          <h5>{{ t("shared.settings.about.info.license.title") }}</h5>
          <div
            class="mcsl-typography"
            v-html="renderMd(t('shared.settings.about.info.license.content'))"
          />
        </div>
      </div>
    </CollapsablePanel>
    <CollapsablePanel>
      <template #header>
        <h4>{{ t("shared.settings.about.special-thanks.title") }}</h4>
      </template>
      <div class="about__special-thanks">
        <Panel size="small">
          <div class="about__special-thank">
            <div>
              <img src="../../assets/img/bangbang93.jpg" alt="" width="42" />
              <div>
                <h5>bangbang93</h5>
                <p>{{ t("shared.settings.about.special-thanks.bmcl.desc") }}</p>
              </div>
            </div>
            <div>
              <Button @click="openLink('https://afdian.com/a/bangbang93/')">{{
                t("shared.settings.about.special-thanks.sponsor")
              }}</Button>
            </div>
          </div>
        </Panel>
        <Panel size="small">
          <div class="about__special-thank">
            <div>
              <img src="../../assets/img/iNKORE.png" alt="" width="42" />
              <div>
                <h5>iNKORE Studios</h5>
                <p>
                  {{ t("shared.settings.about.special-thanks.inkore.desc") }}
                </p>
              </div>
            </div>
            <div>
              <Button @click="openLink('https://inkore.net/')">{{
                t("shared.settings.about.special-thanks.website")
              }}</Button>
            </div>
          </div>
        </Panel>
        <Panel size="small">
          <div class="about__special-thank">
            <div>
              <img src="../../assets/img/BakaXL.png" alt="" width="42" />
              <div>
                <h5>BakaXL</h5>
                <p>
                  {{ t("shared.settings.about.special-thanks.bakaxl.desc") }}
                </p>
              </div>
            </div>
            <div>
              <Button @click="openLink('https://afdian.com/a/TT702/')">{{
                t("shared.settings.about.special-thanks.sponsor")
              }}</Button>
            </div>
          </div>
        </Panel>
        <Panel size="small">
          <div class="about__special-thank">
            <div>
              <img src="../../assets/img/MCSL.png" alt="" width="42" />
              <div>
                <h5>
                  {{ t("shared.settings.about.special-thanks.qq.title") }}
                </h5>
                <p>{{ t("shared.settings.about.special-thanks.qq.desc") }}</p>
              </div>
            </div>
            <div>
              <Button @click="openLink(mcslQQGroup)">{{
                t("shared.settings.about.special-thanks.join-group")
              }}</Button>
            </div>
          </div>
        </Panel>
      </div>
    </CollapsablePanel>
    <CollapsablePanel>
      <template #header>
        <h4>{{ t("shared.settings.about.dependencies.title") }}</h4>
      </template>
      <div class="about__dependencies">
        <div
          v-for="([platform, deps], index) in Object.entries(dependencies)"
          :key="index"
        >
          <h5>{{ t(`shared.settings.about.dependencies.${platform}`) }}</h5>
          <Panel v-for="(dependency, index) in deps" size="small" :key="index">
            <div class="about__dependency">
              <div>
                <h5>{{ dependency.name }}</h5>
                <p>{{ dependency.desc }}</p>
              </div>
              <div>
                <Button
                  type="text"
                  rounded
                  v-for="(link, index) in dependency.links"
                  :key="index"
                  :icon="link.icon"
                  @click="openLink(link.url)"
                />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </CollapsablePanel>
  </div>
</template>

<style scoped lang="scss">
.about__about {
  display: flex;
  flex-direction: column;
  align-items: center;

  & > img {
    width: 7rem;
    margin-bottom: var(--mcsl-spacing-xs);
  }

  & > h2 {
    color: transparent;
    background: linear-gradient(
      45deg,
      var(--mcsl-color-green),
      var(--mcsl-color-blue)
    );
    background-clip: text;

    @media (max-width: 768px) {
      font-size: var(--mcsl-font-size-xl);
    }
  }

  & > h1 {
    color: transparent;
    background: linear-gradient(
      135deg,
      var(--suffix-color-1),
      var(--suffix-color-2)
    );
    background-clip: text;
    margin-bottom: var(--mcsl-spacing-4xs);
    font-size: var(--mcsl-font-size-3xl);

    @media (max-width: 768px) {
      font-size: var(--mcsl-font-size-2xl);
    }
  }

  & > h4 {
    color: var(--mcsl-text-color-secondary);
    margin-bottom: var(--mcsl-spacing-4xs);
  }

  & > p {
    color: var(--mcsl-text-color-gray);
    margin-top: var(--mcsl-spacing-4xs);
    text-align: center;

    &:last-child {
      font-weight: var(--mcsl-font-weight-light);
    }
  }

  & > div {
    display: flex;
    gap: var(--mcsl-spacing-4xs);

    & * {
      font-size: var(--mcsl-font-size-lg);
    }
  }
}

.about__info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--mcsl-spacing-sm);

  & > div {
    display: flex;
    flex-direction: column;

    & > h5 {
      margin-bottom: var(--mcsl-spacing-4xs);
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.eula-content {
  height: 50vh;
  overflow: auto;
  padding: var(--mcsl-spacing-xs);
  background: var(--mcsl-bg-color-main);
  border-radius: var(--mcsl-border-radius-md);
  & > .spinner {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 450px) {
    height: 100%;
  }
}

.about__dependencies,
.about__special-thanks {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
  max-height: 30rem;
  overflow: auto;
  background: var(--mcsl-bg-color-main);
  border-radius: var(--mcsl-border-radius-md);
  padding: var(--mcsl-spacing-md);
}

.about__dependencies > div {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
  & > h5 {
    margin-bottom: var(--mcsl-spacing-4xs);
  }
}

.about__special-thank > div {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);
  & > img {
    width: 3rem;
    border-radius: var(--mcsl-border-radius-sm);
  }
}

.about__special-thank,
.about__dependency {
  display: flex;
  justify-content: space-between;
  gap: var(--mcsl-spacing-2xs);

  @media (max-width: 768px) {
    flex-direction: column;
  }

  & > div:last-child {
    display: flex;
    gap: var(--mcsl-spacing-2xs);
    justify-content: flex-end;
  }
}

.about__dependency > div:last-child * {
  font-size: var(--mcsl-font-size-lg);
}
</style>
