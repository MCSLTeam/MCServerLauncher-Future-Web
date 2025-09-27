import { defineComponent, type PropType } from "vue";
import { type Size } from "../utils/types.ts";
import { getSize } from "../utils/internal.ts";

export const ChangeSize = defineComponent({
  props: {
    size: {
      type: String as PropType<Size>,
      required: false,
    },
  },
  setup(props) {
    getSize(props.size);
  },
});
