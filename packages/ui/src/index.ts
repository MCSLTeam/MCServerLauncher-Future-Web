import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useAppearance, useMousePosition } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";
import { requestNotifPermission } from "./utils/notifications.ts";
import { isDragging } from "./utils/upload.ts";

export { default as Button } from "./components/button/Button.vue";
export { default as ButtonGroup } from "./components/button/ButtonGroup.vue";
export { default as SplitButton } from "./components/button/SplitButton.vue";
export { default as CodeEditor } from "./components/editor/CodeEditor.vue";
export { default as Checkbox } from "./components/form/entries/Checkbox.vue";
export { default as InputNumber } from "./components/form/entries/InputNumber.vue";
export { default as InputText } from "./components/form/entries/InputText.vue";
export { default as RadioGroup } from "./components/form/entries/RadioGroup.vue";
export { default as Segmented } from "./components/form/entries/Segmented.vue";
export { default as Select } from "./components/form/entries/Select.vue";
export { default as Slider } from "./components/form/entries/Slider.vue";
export { default as Switch } from "./components/form/entries/Switch.vue";
export { default as Textarea } from "./components/form/entries/Textarea.vue";
export { default as Alert } from "./components/misc/Alert.vue";
export { default as Avatar } from "./components/misc/Avatar.vue";
export { default as Background } from "./components/misc/Background.vue";
export { default as Badge } from "./components/misc/Badge.vue";
export { default as CopyableText } from "./components/misc/CopyableText.vue";
export { default as Divider } from "./components/misc/Divider.vue";
export { default as Empty } from "./components/misc/Empty.vue";
export { default as InfoBar } from "./components/misc/InfoBar.vue";
export { default as Kbd } from "./components/misc/Kbd.vue";
export { default as Message } from "./components/misc/Message.vue";
export { default as MeterGroup } from "./components/misc/MeterGroup.vue";
export { default as PageHeader } from "./components/misc/PageHeader.vue";
export { default as Result } from "./components/misc/Result.vue";
export { default as Skeleton } from "./components/misc/Skeleton.vue";
export { default as Table } from "./components/misc/Table.vue";
export { default as Tag } from "./components/misc/Tag.vue";
export { default as Breadcrumbs } from "./components/navigation/Breadcrumbs.vue";
export { default as ItemsPagination } from "./components/navigation/ItemsPagination.vue";
export { default as NavTabs } from "./components/navigation/NavTabs.vue";
export { default as Pagination } from "./components/navigation/Pagination.vue";
export { default as Sidebar } from "./components/navigation/Sidebar.vue";
export { default as Card } from "./components/panel/Card.vue";
export { default as Panel } from "./components/panel/Panel.vue";
export { default as Contextmenu } from "./components/overlay/Contextmenu.vue";
export { default as ContextmenuOverlay } from "./components/overlay/ContextmenuOverlay.vue";
export { default as ConfirmDialog } from "./components/overlay/ConfirmDialog.vue";
export { default as Drawer } from "./components/overlay/Drawer.vue";
export { default as DropdownMenu } from "./components/overlay/DropdownMenu.vue";
export { default as Modal } from "./components/overlay/Modal.vue";
export { default as Popover } from "./components/overlay/Popover.vue";
export { default as Tooltip } from "./components/overlay/Tooltip.vue";
export { default as NotificationOverlay } from "./components/overlay/notification/NotificationOverlay.vue";
export { default as NotificationTemplate } from "./components/overlay/notification/NotificationTemplate.vue";
export { default as ProgressBar } from "./components/progress/ProgressBar.vue";
export { default as Spinner } from "./components/progress/Spinner.vue";
export { default as FileDropper } from "./components/upload/FileDropper.vue";
export { default as FileInfo } from "./components/upload/FileInfo.vue";
export { useAppearance, useLocale, useMousePosition, useScreenWidth } from "./utils/stores.ts";
export type { Locale, Rendering, Theme, ThemeTransition } from "./utils/stores.ts";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export async function loadUi() {
  setLocale(getYupLocale());
  useAppearance().load();
  window.removeEventListener("mousemove", useMousePosition().onMouseMove);
  window.removeEventListener("mouseout", useMousePosition().onMouseOut);
  window.addEventListener("mousemove", useMousePosition().onMouseMove);
  window.addEventListener("mouseout", useMousePosition().onMouseOut);

  const onUserInteraction = () => {
    requestNotifPermission();
    document.removeEventListener("click", onUserInteraction);
  };

  document.addEventListener("click", onUserInteraction);

  let dragTimeout = -1;

  window.addEventListener("dragover", () => {
    clearTimeout(dragTimeout);
    isDragging.value = true;
  });

  window.addEventListener("dragleave", () => {
    clearTimeout(dragTimeout);
    dragTimeout = window.setTimeout(() => {
      isDragging.value = false;
    }, 100);
  });

  window.addEventListener("drop", () => {
    isDragging.value = false;
    clearTimeout(dragTimeout);
  });

  window.addEventListener("blur", () => {
    isDragging.value = false;
    clearTimeout(dragTimeout);
  });
}
