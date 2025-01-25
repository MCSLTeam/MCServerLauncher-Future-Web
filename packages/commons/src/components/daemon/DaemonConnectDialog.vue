<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, reactive, ref} from "vue";
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import MFPClient from "mfp-client/dist";
import {nanoid} from "nanoid";
import {daemonStorage} from "../../utils/daemon/daemons.ts";
import {sleep} from "../../utils/common.ts";

const visible = defineModel({
  type: Boolean,
  required: true,
});

const url = computed(() => {
  return `${form.secure ? "wss" : "ws"}://${form.host}:${form.port}/api/v1`;
});

let testId = "";

const tested = ref<"no" | "testing" | "yes">("no");

const i18n = useI18n();

const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  secure: false,
  host: "",
  port: 11451,
  username: "",
  password: "",
});

function resetTest() {
  tested.value = "no";
}

const rules = reactive<FormRules<typeof form>>({
  name: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
  ],
  host: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
  ],
  port: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
    {
      validator(_, value) {
        return value >= 0 && value <= 65535;
      },
      message: i18n.t("form.invalid.range", {min: 0, max: 65535}),
      trigger: "blur",
    },
  ],
  username: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
  ],
});

function resetForm() {
  formRef.value?.resetFields();
  resetTest()
}

async function test(timeout: number = 10000) {
  const id = nanoid(4);
  testId = id;
  tested.value = "testing";
  const client = new MFPClient({
    host: form.host,
    port: form.port,
    username: form.username,
    password: form.password,
    secure: form.secure,
    reconnectOnClose: false,
  });
  try {
    await client.connect();
    const start = Date.now();
    while (start + timeout > Date.now()) {
      if (client.connected()) {
        if (testId == id) {
          tested.value = "yes";
          ElMessage.success(i18n.t("daemon.connect.test.success"));
        }
        client.close();
        return;
      }
      await sleep(timeout / 20)
    }
  } catch (e) {
    throw e;
  } finally {
    if (testId == id && tested.value == "testing") {
      tested.value = "no";
      ElMessage.error(i18n.t("daemon.connect.test.failed"));
    }
  }
}

function save() {
  daemonStorage.value[form.name] = {
    host: form.host,
    port: form.port,
    secure: form.secure,
    username: form.username,
    password: form.password,
  };
}
</script>

<template>
  <ElDialog
      v-model="visible"
      :title="i18n.t('daemon.connect.title')"
      width="825px"
      @close="visible = false"
      @open="resetForm"
  >
    <ElForm
        ref="formRef"
        v-model="form"
        label-width="120px"
        :model="form"
        :rules="rules"
    >
      <ElFormItem :label="i18n.t('daemon.connect.name')" prop="name" required>
        <ElInput
            v-model="form.name"
            :placeholder="i18n.t('daemon.connect.name.placeholder')"
        />
      </ElFormItem>
      <ElFormItem :label="i18n.t('daemon.connect.host')" prop="host" required>
        <ElInput
            @input="resetTest"
            v-model="form.host"
            :placeholder="i18n.t('daemon.connect.host.placeholder')"
        />
      </ElFormItem>
      <ElFormItem :label="i18n.t('daemon.connect.port')" prop="port" required>
        <ElInput
            @input="resetTest"
            type="number"
            v-model="form.port"
            :placeholder="i18n.t('daemon.connect.port.placeholder')"
        />
      </ElFormItem>
      <ElFormItem
          :label="i18n.t('daemon.connect.secure')"
          prop="secure"
          required
      >
        <ElCheckbox @change="resetTest" v-model="form.secure"/>
      </ElFormItem>
      <ElFormItem
          :label="i18n.t('daemon.connect.username')"
          prop="username"
          required
      >
        <ElInput
            @input="resetTest"
            v-model="form.username"
            :placeholder="i18n.t('daemon.connect.username.placeholder')"
        />
      </ElFormItem>
      <ElFormItem
          :label="i18n.t('daemon.connect.password')"
          prop="password"
          required
      >
        <ElInput
            @input="resetTest"
            type="password"
            v-model="form.password"
            :placeholder="i18n.t('daemon.connect.password.placeholder')"
        />
      </ElFormItem>
      <br/>
      <ElFormItem :label="i18n.t('daemon.connect.preview')">
        <code class="font-mono daemon-connect__preview">{{ url }}</code>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" v-if="tested == 'yes'" @click="save">{{
            i18n.t("daemon.connect.save")
          }}
        </ElButton>
        <ElButton
            type="primary"
            v-else
            @click="test()"
            :disabled="tested == 'testing'"
        >
          {{
            tested == "testing"
                ? i18n.t("daemon.connect.test.testing")
                : i18n.t("daemon.connect.test.test")
          }}
        </ElButton>
        <ElButton @click="visible = false">{{
            i18n.t("dialog.cancel")
          }}
        </ElButton>
      </ElFormItem>
    </ElForm>
  </ElDialog>
</template>

<style scoped>
.daemon-connect__preview {
  width: 100%;
}
</style>
