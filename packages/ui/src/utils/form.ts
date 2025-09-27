import * as yup from "yup";
import { computed, type ComputedRef, ref, type WritableComputedRef } from "vue";

export type ValidationTrigger = "input" | "blur" | "submit";

export type FormFieldInstance = {
  value: WritableComputedRef<any>;
  label?: string;
  validate: () => Promise<boolean>;
  reset: () => void;
  error: ComputedRef<string | null>;
  __setError__: (error: string | null) => void;
};

export type FormInstance<T extends Record<string, any>> = {
  value: WritableComputedRef<T>;
  validate: () => Promise<boolean>;
  validateField: (field: string) => Promise<boolean>;
  validationTrigger: ValidationTrigger;
  reset: () => void;
  resetField: (field: string) => void;
  __fieldMap__: Map<string, FormFieldInstance>;
  __getField__: (name: string) => FormFieldInstance;
};

export function createForm<T extends Record<string, any>>(
  defaultValues: T,
  schema: yup.ObjectSchema<T>,
  validationTrigger: ValidationTrigger = "input",
): FormInstance<T> {
  const formRef = ref(defaultValues);
  const fieldMap = new Map<string, FormFieldInstance>();
  const validate = async () => {
    let valid = true;
    for (const [_, instance] of fieldMap) {
      if (!(await instance.validate())) valid = false;
    }
    return valid;
  };
  return {
    value: computed({
      get() {
        return formRef.value;
      },
      set(value: T) {
        formRef.value = value;
        validate();
      },
    }),
    validate,
    async validateField(field: string) {
      const fieldInstance = fieldMap.get(field);
      try {
        await schema.validateAt(field, formRef.value);
        fieldInstance?.__setError__(null);
        return true;
      } catch (e: any) {
        fieldInstance?.__setError__(e.message);
        return false;
      }
    },
    validationTrigger,
    reset() {
      formRef.value = defaultValues;
      fieldMap.forEach((instance) => {
        instance.__setError__(null);
      });
    },
    resetField(field: string) {
      formRef.value[field] = defaultValues[field];
      fieldMap.get(field)?.__setError__(null);
    },
    __fieldMap__: fieldMap,
    __getField__(name: string): FormFieldInstance {
      if (fieldMap.has(name)) return fieldMap.get(name)!;
      const error = ref<string | null>(null);
      const instance = {
        value: computed({
          get() {
            return formRef.value[name];
          },
          set(value) {
            formRef.value[name] = value;
          },
        }),
        label: (schema.fields[name]! as yup.Schema).spec.label,
        validate: async () => {
          return await this.validateField(name);
        },
        reset: () => {
          this.resetField(name);
        },
        error: computed(() => error.value),
        __setError__(value: string | null) {
          error.value = value;
        },
      };
      fieldMap.set(name, instance);
      return instance;
    },
  };
}
