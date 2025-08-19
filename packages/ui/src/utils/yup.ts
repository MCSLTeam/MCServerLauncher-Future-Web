import { type LocaleObject, printValue, ValidationError } from "yup";
import { useLocale } from "./stores.ts";

export function getYupLocale(): LocaleObject {
  const i18n = useLocale().getI18n();

  const mixed: LocaleObject["mixed"] = {
    default: ({ path }) => i18n.t("yup.mixed.default", { label: path }),
    required: ({ path }) => i18n.t("yup.mixed.required", { label: path }),
    defined: ({ path }) => i18n.t("yup.mixed.defined", { label: path }),
    notNull: ({ path }) => i18n.t("yup.mixed.notnull", { label: path }),
    oneOf: ({ path, values }) =>
      i18n.t("yup.mixed.one-of", { label: path, values }),
    notOneOf: ({ path, values }) =>
      i18n.t("yup.mixed.not-one-of", { label: path, values }),
    notType: ({ path, type, value, originalValue }) => {
      const cast =
        originalValue != null && originalValue !== value
          ? i18n.t("yup.mixed.not-type.cast", {
              value: printValue(originalValue),
            })
          : "";

      return type == "mixed"
        ? i18n.t("yup.mixed.not-type.mixed", {
            path,
            type: i18n.t("yup.mixed.not-type.type", { type }),
            value: printValue(value),
            cast: cast,
          })
        : i18n.t("yup.mixed.not-type.not-mixed", {
            path,
            type: i18n.t("yup.mixed.notType.type", { type }),
            value: printValue(value),
            cast: cast,
          });
    },
  };

  const string: LocaleObject["string"] = {
    length: ({ path, length }) =>
      i18n.t("yup.string.length", { label: path, length }),
    min: ({ path, min }) => i18n.t("yup.string.min", { label: path, min }),
    max: ({ path, max }) => i18n.t("yup.string.max", { label: path, max }),
    matches: ({ path, regex }) =>
      i18n.t("yup.string.matches", { label: path, regex }),
    email: ({ path }) => i18n.t("yup.string.email", { label: path }),
    url: ({ path }) => i18n.t("yup.string.url", { label: path }),
    uuid: ({ path }) => i18n.t("yup.string.uuid", { label: path }),
    datetime: ({ path }) => i18n.t("yup.string.datetime", { label: path }),
    datetime_precision: ({ path, precision }) =>
      i18n.t("yup.string.datetime-precision", { label: path, precision }),
    datetime_offset: ({ path }) =>
      i18n.t("yup.string.datetime-offset", { label: path }),
    trim: ({ path }) => i18n.t("yup.string.trim", { label: path }),
    lowercase: ({ path }) => i18n.t("yup.string.lowercase", { label: path }),
    uppercase: ({ path }) => i18n.t("yup.string.uppercase", { label: path }),
  };

  const number: LocaleObject["number"] = {
    min: ({ path, min }) => i18n.t("yup.number.min", { label: path, min }),
    max: ({ path, max }) => i18n.t("yup.number.max", { label: path, max }),
    lessThan: ({ path, less }) =>
      i18n.t("yup.number.less-than", { label: path, less }),
    moreThan: ({ path, more }) =>
      i18n.t("yup.number.more-than", { label: path, more }),
    positive: ({ path }) => i18n.t("yup.number.positive", { label: path }),
    negative: ({ path }) => i18n.t("yup.number.negative", { label: path }),
    integer: ({ path }) => i18n.t("yup.number.integer", { label: path }),
  };

  const date: LocaleObject["date"] = {
    min: ({ path, min }) => i18n.t("yup.date.min", { label: path, min }),
    max: ({ path, max }) => i18n.t("yup.date.max", { label: path, max }),
  };

  const boolean: LocaleObject["boolean"] = {
    isValue: ({ path, value }) =>
      i18n.t("yup.boolean.is-value", {
        path,
        value: i18n.t(`yup.boolean.${value.toString()}`),
      }),
  };

  const object: LocaleObject["object"] = {
    noUnknown: ({ path, unknown }) =>
      i18n.t("yup.object.no-unknown", { label: path, unknown }),
    exact: ({ path, properties }) =>
      i18n.t("yup.object.exact", { label: path, properties }),
  };

  const array: LocaleObject["array"] = {
    min: ({ path, min }) => i18n.t("yup.array.min", { label: path, min }),
    max: ({ path, max }) => i18n.t("yup.array.max", { label: path, max }),
    length: ({ path, length }) =>
      i18n.t("yup.array.length", { label: path, length }),
  };

  const tuple: LocaleObject["tuple"] = {
    notType: (params) => {
      const { path, value, spec } = params;
      const typeLen = spec.types.length;
      if (Array.isArray(value)) {
        if (value.length < typeLen)
          return i18n.t("tuple.min", {
            path,
            typeLen,
            valueLen: value.length,
            value: printValue(value),
          });
        if (value.length > typeLen)
          return i18n.t("tuple.max", {
            path,
            typeLen,
            valueLen: value.length,
            value: printValue(value),
          });
      }

      return ValidationError.formatError(mixed.notType, params);
    },
  };

  return {
    mixed,
    string,
    number,
    date,
    boolean,
    object,
    array,
    tuple,
  };
}
