<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, type PropType, reactive, ref} from "vue";
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import MFPClient from "mfp-client";
import {formatError} from "../../utils/common.ts";
import type {DaemonInfo, DaemonStorage, DaemonUpdate} from "../../utils/daemon/daemons.ts";

const props = defineProps({
  edit: {
    type: Object as PropType<DaemonInfo | undefined>,
    required: false,
    default: () => undefined,
  },
  saveDaemon: {
    type: Function,
    required: true
  }
})

const visible = defineModel("visible", {
  type: Boolean,
  required: true
})

const url = computed(() => {
  return `${form.secure ? "wss" : "ws"}://${form.host}:${form.port}/`;
});

let testId = 0;

const tested = ref<"no" | "testing" | "yes">("no");

const i18n = useI18n();

const formRef = ref<FormInstance>();
const form = reactive<DaemonUpdate>(props.edit ? {
  ...props.edit,
} : {
  name: "",
  secure: false,
  host: "",
  port: 11451,
  token: "",
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
  token: [
    {
      required: props.edit == undefined,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
    {
      validator(_, value) {
        return !/^([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)$/gm.test(value); // not jwt
      },
      message: i18n.t("daemon.connect.token.invalid"),
      trigger: "blur",
    }
  ]
});

function resetForm() {
  formRef.value?.resetFields();
  resetTest();
}

async function test() {
  try {
    await formRef.value?.validate()
  } catch (_) {
    return
  }
  const id = testId + 1;
  testId = id;
  tested.value = "testing";
  const client = new MFPClient(<DaemonStorage>form, false);
  try {
    await client.connect();
    if (testId == id) {
      tested.value = "yes";
      ElMessage.success(i18n.t("daemon.connect.test.success"));
    }
    client.close();
  } catch (e) {
    if (testId == id && tested.value == "testing") {
      tested.value = "no";
      ElMessage.error(formatError("daemon.connect.test.failed", e));
      console.error(formatError("daemon.connect.test.failed", e), e);
    }
  }
}

async function save() {
  if (props.edit && form.token == "")
    form.token = undefined
  await props.saveDaemon(form);
  visible.value = false;
}
</script>

<template>
  <ElDialog
      v-model="visible"
      :title="i18n.t('daemon.connect.title')"
      width="825px"
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
          :label="i18n.t('daemon.connect.token')"
          prop="token"
          required
      >
        <ElInput
            @input="resetTest"
            v-model="form.token"
            :placeholder="i18n.t('daemon.connect.token.placeholder' + (edit ? '.edit' : ''))"
        />
      </ElFormItem>
      <br/>
      <ElFormItem :label="i18n.t('daemon.connect.preview')">
        <code class="font-mono daemon-connect__preview">{{ url }}</code>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" v-if="tested == 'yes'" @click="save"
        >{{ i18n.t("daemon.connect.save") }}
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
        <ElButton @click="visible = false"
        >{{ i18n.t("dialog.cancel") }}
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
