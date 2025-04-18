<script setup lang="ts">
import axios from "axios";
import { marked } from "marked";
import { onMounted, ref } from "vue";
import { agreedEula, canHideOverlay } from "../../utils/loader";
import FancyBackground from "../../components/FancyBackground.vue";
import { quit, router } from "../../utils/injections.ts";
import { useI18n } from "vue-i18n";

const md = ref("");
const waitTime = 10000;
const agreeCountdown = ref(-1);
const i18n = useI18n();
let startTime: number;

function initEula(text: string) {
  md.value = text.split("---\n").slice(2).join("---\n");
  startTime = Date.now();
  const interval = setInterval(() => {
    agreeCountdown.value = Math.floor(
      (waitTime - (Date.now() - startTime)) / 1000,
    );
    if (agreeCountdown.value <= 0) {
      agreeCountdown.value = 0;
      clearInterval(interval);
    }
  }, 500);
}

function disagree() {
  quit();
}

async function agree() {
  await router.push("/welcome/done");
  agreedEula.value = true;
}

async function init() {
  let eulaInfo;
  try {
    eulaInfo = await import(
      "../../assets/eula/" + useI18n().locale.value + ".json"
    );
  } catch (_) {
    eulaInfo = await import("../../assets/eula/en-US.json");
  }
  axios
    .get(eulaInfo.url)
    .then((res) => {
      initEula(res.data);
    })
    .catch(() => {
      if (eulaInfo.mirror) {
        axios
          .get(eulaInfo.mirror)
          .then((res) => {
            initEula(res.data);
          })
          .catch(() => {
            initEula(eulaInfo.content);
          });
      } else {
        initEula(eulaInfo.content);
      }
    });
}

onMounted(() => {
  init();
});
</script>

<template>
  <div v-show="canHideOverlay" class="eula__container">
    <FancyBackground light="7" />
    <div class="eula__container-inner">
      <ElCard class="eula__card" body-class="eula__card-body">
        <h1>{{ i18n.t("eula.title") }}</h1>
        <ElScrollbar class="eula__scrollbar" v-loading="md == ''">
          <ElText>
            <p v-html="marked.parse(md)" />
          </ElText>
        </ElScrollbar>
        <div v-if="agreeCountdown != -1" class="eula__buttons">
          <ElButton @click="router.push('/welcome/welcome')"
            >{{ i18n.t("welcome.prev") }}
          </ElButton>
          <ElButton @click="disagree">{{ i18n.t("eula.disagree") }}</ElButton>
          <ElButton
            type="primary"
            :disabled="agreeCountdown != 0"
            @click="agree"
          >
            {{
              agreeCountdown != 0
                ? i18n.t("eula.agree.countdown", {
                    time: agreeCountdown,
                  })
                : i18n.t("eula.agree")
            }}
          </ElButton>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.eula__container,
.eula__container-inner {
  width: 100%;
  height: 100%;
  margin: 0;
}

.eula__container-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  animation: 0.5s ease-in-out fadeInUp 0.5s both;
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.eula__container-inner * {
  z-index: 1;
}

.eula__card {
  width: 80%;
  height: 80%;
  padding: 1rem;
  border-radius: 1rem;
  @media screen and (max-width: 768px) {
    width: calc(100% - 6rem);
    height: calc(100% - 6rem);
  }
}

.eula__card h1 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-primary);
  @media (max-width: 768px) {
    font-size: 1.75rem;
    text-align: center;
  }
}

.eula__buttons {
  margin-top: 1rem;
  height: 3rem;
  display: flex;
  justify-content: start;
  align-items: center;
}
</style>

<style>
.eula__card-body {
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 768px) {
    align-items: center;
  }
}

.eula__scrollbar {
  width: 100%;
  height: calc(100% - 42px - 5rem);
  @media (max-width: 768px) {
    height: calc(100% - 42px - 4.75rem);
  }
}

.eula__scrollbar a {
  color: var(--el-text-color-regular);
  text-decoration: underline;
  transition: 0.3s ease-in-out;
}

.eula__scrollbar a:hover {
  color: var(--el-color-primary);
}
</style>
