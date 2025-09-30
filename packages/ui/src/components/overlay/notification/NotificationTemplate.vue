<script setup lang="ts">
import { addTemplate, removeTemplate } from "../../../utils/notifications.ts";
import { onMounted, onUnmounted, type VueElement } from "vue";
import type { MessageProps } from "../../panel/Message.vue";

const props = withDefaults(
  defineProps<{
    id: string;
    props?: (data: any) => MessageProps;
  }>(),
  {
    props: (data: any) => data,
  },
);

const slots = defineSlots<{
  default(props: any): VueElement[];
}>();

onMounted(() => {
  addTemplate(props.id, props.props, slots.default);
});

onUnmounted(() => {
  removeTemplate(props.id);
});
</script>
