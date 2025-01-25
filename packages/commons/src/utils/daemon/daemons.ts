import { useDatabase } from "../uses.ts";
import { ref } from "vue";

export let daemonStorage = ref<any>({});

export type DaemonInfo = {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
};

export function initDaemonStorage() {
  // eslint-disable-next-line vue/no-ref-as-operand
  daemonStorage = useDatabase().data<{ [key: string]: DaemonInfo }>(
    "daemons",
    {},
  );
}
