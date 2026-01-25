import { type LocaleObject, printValue, ValidationError } from "yup";
import { useLocale } from "./stores.ts";

export function getYupLocale(): LocaleObject {
  const t = useLocale().getI18n().t;

  const mixed: LocaleObject["mixed"] = {
    default: ({ path }) => t("yup.mixed.default", { label: path }),
    required: ({ path }) => t("yup.mixed.required", { label: path }),
    defined: ({ path }) => t("yup.mixed.defined", { label: path }),
    notNull: ({ path }) => t("yup.mixed.notnull", { label: path }),
    oneOf: ({ path, values }) => t("yup.mixed.one-of", { label: path, values }),
    notOneOf: ({ path, values }) =>
      t("yup.mixed.not-one-of", { label: path, values }),
    notType: ({ path, type, value, originalValue }) => {
      const cast =
        originalValue != null && originalValue !== value
          ? t("yup.mixed.not-type.cast", {
              value: printValue(originalValue),
            })
          : "";

      return type == "mixed"
        ? t("yup.mixed.not-type.mixed", {
            path,
            type: t("yup.mixed.not-type.type", { type }),
            value: printValue(value),
            cast: cast,
          })
        : t("yup.mixed.not-type.not-mixed", {
            path,
            type: t("yup.mixed.notType.type", { type }),
            value: printValue(value),
            cast: cast,
          });
    },
  };

  const string: LocaleObject["string"] = {
    length: ({ path, length }) =>
      t("yup.string.length", { label: path, length }),
    min: ({ path, min }) => t("yup.string.min", { label: path, min }),
    max: ({ path, max }) => t("yup.string.max", { label: path, max }),
    matches: ({ path, regex }) =>
      t("yup.string.matches", { label: path, regex }),
    email: ({ path }) => t("yup.string.email", { label: path }),
    url: ({ path }) => t("yup.string.url", { label: path }),
    uuid: ({ path }) => t("yup.string.uuid", { label: path }),
    datetime: ({ path }) => t("yup.string.datetime", { label: path }),
    datetime_precision: ({ path, precision }) =>
      t("yup.string.datetime-precision", { label: path, precision }),
    datetime_offset: ({ path }) =>
      t("yup.string.datetime-offset", { label: path }),
    trim: ({ path }) => t("yup.string.trim", { label: path }),
    lowercase: ({ path }) => t("yup.string.lowercase", { label: path }),
    uppercase: ({ path }) => t("yup.string.uppercase", { label: path }),
  };

  const number: LocaleObject["number"] = {
    min: ({ path, min }) => t("yup.number.min", { label: path, min }),
    max: ({ path, max }) => t("yup.number.max", { label: path, max }),
    lessThan: ({ path, less }) =>
      t("yup.number.less-than", { label: path, less }),
    moreThan: ({ path, more }) =>
      t("yup.number.more-than", { label: path, more }),
    positive: ({ path }) => t("yup.number.positive", { label: path }),
    negative: ({ path }) => t("yup.number.negative", { label: path }),
    integer: ({ path }) => t("yup.number.integer", { label: path }),
  };

  const date: LocaleObject["date"] = {
    min: ({ path, min }) => t("yup.date.min", { label: path, min }),
    max: ({ path, max }) => t("yup.date.max", { label: path, max }),
  };

  const boolean: LocaleObject["boolean"] = {
    isValue: ({ path, value }) =>
      t("yup.boolean.is-value", {
        path,
        value: t(`yup.boolean.${value.toString()}`),
      }),
  };

  const object: LocaleObject["object"] = {
    noUnknown: ({ path, unknown }) =>
      t("yup.object.no-unknown", { label: path, unknown }),
    exact: ({ path, properties }) =>
      t("yup.object.exact", { label: path, properties }),
  };

  const array: LocaleObject["array"] = {
    min: ({ path, min }) => t("yup.array.min", { label: path, min }),
    max: ({ path, max }) => t("yup.array.max", { label: path, max }),
    length: ({ path, length }) =>
      t("yup.array.length", { label: path, length }),
  };

  const tuple: LocaleObject["tuple"] = {
    notType: (params) => {
      const { path, value, spec } = params;
      const typeLen = spec.types.length;
      if (Array.isArray(value)) {
        if (value.length < typeLen)
          return t("tuple.min", {
            path,
            typeLen,
            valueLen: value.length,
            value: printValue(value),
          });
        if (value.length > typeLen)
          return t("tuple.max", {
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
